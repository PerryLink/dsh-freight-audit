export type FreightErrorCode='E_FREIGHT_CSV_INVALID'|'E_FREIGHT_RATE_MISSING'|'E_FREIGHT_RATE_OVERLAP'|'E_FREIGHT_EXPORT_FAILED'
export class FreightError extends Error{readonly code:FreightErrorCode;constructor(code:FreightErrorCode,message:string){super(`${code}: ${message}`);this.name='FreightError';this.code=code}}
export interface Rate{carrier:string;version:string;base_cents:number;per_kg_cents:number;fuel_pct:number;effective_from:string;effective_to?:string}
export interface Bill{shipment_id:string;carrier:string;version:string;weight_kg:number;billed_cents:number;expected_cents:number;variance_cents:number;created_at:string}
export function cents(raw:string):number{const v=raw.trim().replace(/[¥￥,\s]/g,'');const m=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(v);if(!m)throw new FreightError('E_FREIGHT_CSV_INVALID',`bad amount ${raw}`);return (m[1]==='-'?-1:1)*(Number(m[2])*100+Number((m[3]??'').padEnd(2,'0')))}
export function parseBills(text:string,carrier:string,version:string):Bill[]{const l=text.trim().split(/\r?\n/).filter(Boolean);if(l.length<2)throw new FreightError('E_FREIGHT_CSV_INVALID','CSV needs header+rows');const h=l[0]!.split(',').map(x=>x.toLowerCase().trim());const si=h.indexOf('shipment_id'),wi=h.indexOf('weight_kg'),bi=h.indexOf('billed');if(si<0||wi<0||bi<0)throw new FreightError('E_FREIGHT_CSV_INVALID','CSV needs shipment_id,weight_kg,billed');return l.slice(1).map(row=>{const c=row.split(',').map(x=>x.trim());const weight=Number(c[wi]);const billed=cents(c[bi]??'');if(!Number.isFinite(weight)||weight<=0)throw new FreightError('E_FREIGHT_CSV_INVALID','bad weight');return{shipment_id:c[si]??'',carrier,version,weight_kg:weight,billed_cents:billed,expected_cents:0,variance_cents:0,created_at:new Date().toISOString()}})}
export function expectedCents(rate:Rate,weight:number):number{return Math.round(rate.base_cents+rate.per_kg_cents*weight+ (rate.base_cents+rate.per_kg_cents*weight)*rate.fuel_pct/100)}
export function overlaps(a:Rate,b:Rate):boolean{if(a.carrier!==b.carrier||a.version===b.version)return false;const aEnd=a.effective_to??'9999-12-31',bEnd=b.effective_to??'9999-12-31';return a.effective_from<=bEnd&&b.effective_from<=aEnd}

export interface RateCardIssue { code: string; carrier: string; version: string; detail: string }
/**
 * Rate-card hygiene check: required fields, positive money values, fuel share 0-100,
 * a valid effective window, and overlapping versions for the same carrier.
 */
export function validateRateCards(cards: Rate[]): RateCardIssue[] {
  const issues: RateCardIssue[] = []
  const push = (code: string, card: Partial<Rate>, detail: string) => issues.push({ code, carrier: String(card.carrier ?? ''), version: String(card.version ?? ''), detail })
  for (const card of cards) {
    if (!card.carrier || !card.version) push('E_FREIGHT_RATE_MISSING', card, 'carrier and version are required')
    if (!Number.isInteger(card.base_cents) || card.base_cents < 0) push('E_FREIGHT_RATE_INVALID', card, 'base_cents must be a non-negative integer')
    if (!Number.isInteger(card.per_kg_cents) || card.per_kg_cents < 0) push('E_FREIGHT_RATE_INVALID', card, 'per_kg_cents must be a non-negative integer')
    if (typeof card.fuel_pct !== 'number' || !Number.isFinite(card.fuel_pct) || card.fuel_pct < 0 || card.fuel_pct > 100) push('E_FREIGHT_RATE_INVALID', card, 'fuel_pct must be between 0 and 100')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(card.effective_from ?? '')) push('E_FREIGHT_RATE_INVALID', card, 'effective_from must be YYYY-MM-DD')
    if (card.effective_to !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(card.effective_to) || card.effective_to < card.effective_from)) push('E_FREIGHT_RATE_INVALID', card, 'effective_to must be a date on or after effective_from')
  }
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      if (overlaps(cards[i]!, cards[j]!)) push('E_FREIGHT_RATE_OVERLAP', cards[i]!, `overlaps version ${cards[j]!.version}`)
    }
  }
  return issues
}
