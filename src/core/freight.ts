export type FreightErrorCode='E_FREIGHT_CSV_INVALID'|'E_FREIGHT_RATE_MISSING'|'E_FREIGHT_RATE_OVERLAP'|'E_FREIGHT_EXPORT_FAILED'|'E_FREIGHT_PATH_INVALID'|'E_FREIGHT_PATH_NOT_ALLOWED'
/** User-facing wording: one plain sentence, the code, then exactly one next action. */
const FREIGHT_HUMAN:Record<FreightErrorCode,{text:string;next:string}>={
  E_FREIGHT_CSV_INVALID:{text:'这张运费账单读不出来',next:'确保表头有 shipment_id,weight_kg,billed 三列，金额写成 23.00 这样的两位小数'},
  E_FREIGHT_RATE_MISSING:{text:'找不到这张费率卡，或费率卡字段不全',next:'先用 freight.ratecard 的 set 动作建好 carrier 和 version，再跑审计'},
  E_FREIGHT_RATE_OVERLAP:{text:'这张费率卡和同承运商的另一个版本生效期重叠',next:'改 effective_from/effective_to，让同一承运商的版本区间不重叠'},
  E_FREIGHT_EXPORT_FAILED:{text:'导出文件写不进去',next:'确认 $DSH_HOME 可写、磁盘还有空间，再重试一次'},
  E_FREIGHT_PATH_INVALID:{text:'导出文件名不合法',next:'承运商和版本号只用字母、数字、点、下划线和连字符'},
  E_FREIGHT_PATH_NOT_ALLOWED:{text:'导出路径跑到允许目录之外了',next:'把承运商或版本号里的斜杠和点点去掉，再导出'},
}
export class FreightError extends Error{
  readonly code:FreightErrorCode
  /** Technical detail for logs — never shown to the user. */
  readonly detail:string
  constructor(code:FreightErrorCode,detail=''){const human=FREIGHT_HUMAN[code];super(`${human.text}（${code}）｜下一步：${human.next}`);this.name='FreightError';this.code=code;this.detail=detail}
}
export interface Rate{carrier:string;version:string;base_cents:number;per_kg_cents:number;fuel_pct:number;effective_from:string;effective_to?:string}
export interface Bill{shipment_id:string;carrier:string;version:string;weight_kg:number;billed_cents:number;expected_cents:number;variance_cents:number;created_at:string}
export function cents(raw:string):number{const v=raw.trim().replace(/[¥￥,\s]/g,'');const m=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(v);if(!m)throw new FreightError('E_FREIGHT_CSV_INVALID',`bad amount ${raw}`);return (m[1]==='-'?-1:1)*(Number(m[2])*100+Number((m[3]??'').padEnd(2,'0')))}
export function parseBills(text:string,carrier:string,version:string):Bill[]{const l=text.trim().split(/\r?\n/).filter(Boolean);if(l.length<2)throw new FreightError('E_FREIGHT_CSV_INVALID','CSV needs header+rows');const h=l[0]!.split(',').map(x=>x.toLowerCase().trim());const si=h.indexOf('shipment_id'),wi=h.indexOf('weight_kg'),bi=h.indexOf('billed');if(si<0||wi<0||bi<0)throw new FreightError('E_FREIGHT_CSV_INVALID','CSV needs shipment_id,weight_kg,billed');return l.slice(1).map(row=>{const c=row.split(',').map(x=>x.trim());const weight=Number(c[wi]);const billed=cents(c[bi]??'');if(!Number.isFinite(weight)||weight<=0)throw new FreightError('E_FREIGHT_CSV_INVALID','bad weight');return{shipment_id:c[si]??'',carrier,version,weight_kg:weight,billed_cents:billed,expected_cents:0,variance_cents:0,created_at:new Date().toISOString()}})}
const CSV_NEEDS_QUOTES = /[",\r\n]/
const CSV_FORMULA_PREFIX = /^[=+\-@]/
/** Escape one CSV text field: neutralise formula prefixes, then quote and double embedded quotes. */
export function csvTextField(value: string): string {
  const guarded = CSV_FORMULA_PREFIX.test(value) ? `'${value}` : value
  return CSV_NEEDS_QUOTES.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}
/** Numbers stay numeric: a negative variance must not be mistaken for a formula. */
export function csvNumberField(value: number): string { return String(value) }
export const DISPUTE_CSV_HEADER = 'shipment_id,weight_kg,billed_cents,expected_cents,variance_cents'
/** Build the dispute CSV with every text field escaped before it reaches the file. */
export function buildDisputeCsv(rows: readonly Bill[]): string {
  const lines = rows.map((bill) => [
    csvTextField(bill.shipment_id),
    csvNumberField(bill.weight_kg),
    csvNumberField(bill.billed_cents),
    csvNumberField(bill.expected_cents),
    csvNumberField(bill.variance_cents),
  ].join(','))
  return [DISPUTE_CSV_HEADER, ...lines].join('\n') + '\n'
}
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

/** Accessorial charge types the audit understands (public carrier charge descriptions). */
export const ACCESSORIAL_TYPES = ['fuel','detention','liftgate','residential','inside_delivery','appointment','oversize','hazmat','waiting_time','reweigh','redelivery','storage'] as const
export interface AccessorialItem { type: string; amount_cents: number }
export interface AccessorialInput { items: AccessorialItem[]; allowed?: string[]; cap_cents?: number }
export interface AccessorialIssue { code: string; detail: string }
export interface AccessorialReport { total_cents: number; items: number; issues: AccessorialIssue[] }
export function checkAccessorials(input: AccessorialInput): AccessorialReport {
  const issues: AccessorialIssue[] = []
  const seen = new Set<string>()
  let total = 0
  for (const item of input.items) {
    const type = (item.type ?? '').trim().toLowerCase()
    if (!(ACCESSORIAL_TYPES as readonly string[]).includes(type)) {
      issues.push({ code: 'E_FREIGHT_ACCESSORIAL_UNKNOWN', detail: `${type || '(empty)'} is not a known accessorial type` })
      continue
    }
    if (!Number.isInteger(item.amount_cents) || item.amount_cents < 0) {
      issues.push({ code: 'E_FREIGHT_ACCESSORIAL_VALUE', detail: `${type} has a non-integer or negative amount` })
      continue
    }
    if (seen.has(type)) issues.push({ code: 'E_FREIGHT_ACCESSORIAL_DUPLICATE', detail: `${type} appears more than once` })
    else seen.add(type)
    if (input.allowed && !input.allowed.map((a) => a.toLowerCase()).includes(type)) {
      issues.push({ code: 'E_FREIGHT_ACCESSORIAL_NOT_ALLOWED', detail: `${type} is not in the agreed accessorial list` })
    }
    total += item.amount_cents
  }
  if (input.cap_cents !== undefined && total > input.cap_cents) {
    issues.push({ code: 'E_FREIGHT_ACCESSORIAL_CAP', detail: `total ${total} exceeds the cap ${input.cap_cents}` })
  }
  return { total_cents: total, items: input.items.length, issues }
}
