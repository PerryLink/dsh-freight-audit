import path from'node:path';import type{Context}from'@deepseek-ai/cordis';import{createTools}from'./tools.js';import{openFreight}from'./storage.js'
export const name='dsh-freight-audit';export const inject=['tools','storageDomain']
export async function apply(ctx:Context):Promise<void>{const baseDir=process.env.DSH_FREIGHT_HOME??path.join(process.env.DSH_HOME??process.cwd(),'storages','dsh-freight-audit');const{rates,bills}=await openFreight(ctx);for(const t of createTools({rates,bills,baseDir}))ctx.tools.register(t)}
