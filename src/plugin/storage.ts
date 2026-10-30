import{defineDomain,domainTable}from'@deepseek-ai/dsh-storage-domain';import type{Context}from'@deepseek-ai/cordis';import{z}from'zod'
const rate=z.object({carrier:z.string(),version:z.string(),base_cents:z.number().int(),per_kg_cents:z.number().int(),fuel_pct:z.number(),effective_from:z.string(),effective_to:z.string().optional()})
const bill=z.object({shipment_id:z.string(),carrier:z.string(),version:z.string(),weight_kg:z.number(),billed_cents:z.number().int(),expected_cents:z.number().int(),variance_cents:z.number().int(),created_at:z.string()})
export type RateRecord=z.infer<typeof rate>;export type BillRecord=z.infer<typeof bill>;export type Table<T>={get(k:string):T|undefined;entries():IterableIterator<[string,T]>;size:number;put(k:string,v:T):Promise<void>}
export const freightSpec=defineDomain({name:'freight',version:1,tables:{rates:domainTable<string,RateRecord>(rate),bills:domainTable<string,BillRecord>(bill)}})
export async function openFreight(ctx:Context){const d=await ctx.storageDomain.open(freightSpec);ctx.effect(()=>()=>d.close(),'dsh-freight-audit.domainClose');return{rates:d.table('rates') as Table<RateRecord>,bills:d.table('bills') as Table<BillRecord>}}
