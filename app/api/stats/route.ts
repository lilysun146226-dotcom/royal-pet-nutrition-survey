import {env} from 'cloudflare:workers';
import {createCreatedIndexSql,createResponsesSql} from '../../../db/schema';
type Row={age_stage:string;health_status:string;concerns:string;feeding_issue:string;royal_usage:string;trust_source:string;price_attitude:string};
const list=(value:string)=>{try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[value]}catch{return[value]}};
export async function GET(){
 await env.DB.batch([env.DB.prepare(createResponsesSql),env.DB.prepare(createCreatedIndexSql)]);
 const rows=await env.DB.prepare('SELECT age_stage,health_status,concerns,feeding_issue,royal_usage,trust_source,price_attitude FROM survey_responses ORDER BY id DESC').all<Row>();
 const stages:Record<string,number>={'幼年期（1岁以内）':0,'成年期（1–7岁）':0,'老年期（7岁以上）':0};
 const concerns:Record<string,number>={};const royalUsage:Record<string,number>={};
 const segments:Record<string,number>={'成长守护型':0,'敏感健康管理型':0,'专业信任型':0,'理性价值型':0,'老龄／特殊关怀型':0};
 for(const row of rows.results){
  stages[row.age_stage]=(stages[row.age_stage]||0)+1;royalUsage[row.royal_usage]=(royalUsage[row.royal_usage]||0)+1;
  const rowConcerns=list(row.concerns);const health=list(row.health_status);const issues=list(row.feeding_issue);const trust=list(row.trust_source);
  for(const item of rowConcerns)concerns[item]=(concerns[item]||0)+1;
  if(row.age_stage.includes('幼年'))segments['成长守护型']++;
  if(health.some(x=>/肠胃|泌尿|皮肤|体重/.test(x))||issues.some(x=>/软便|体重/.test(x)))segments['敏感健康管理型']++;
  if(trust.some(x=>/兽医|科学|检测/.test(x))||rowConcerns.some(x=>/专业机构|精准营养/.test(x)))segments['专业信任型']++;
  if(row.price_attitude.includes('比较')||row.price_attitude.includes('促销')||row.price_attitude.includes('价格'))segments['理性价值型']++;
  if(row.age_stage.includes('老年')||health.some(x=>/泌尿|肾脏/.test(x)))segments['老龄／特殊关怀型']++;
 }
 return Response.json({total:rows.results.length,stages,concerns,royalUsage,segments},{headers:{'cache-control':'no-store, max-age=0'}});
}
