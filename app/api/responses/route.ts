import {env} from 'cloudflare:workers';
import {createCreatedIndexSql,createResponsesSql} from '../../../db/schema';
const singleFields=['petType','ageStage','royalUsage','priceAttitude'] as const;
const multiFields=['healthStatus','concerns','feedingIssue','trustSource'] as const;
export async function POST(request:Request){
 const body=await request.json() as Record<string,unknown>;
 const invalidSingle=singleFields.some(field=>typeof body[field]!=='string'||!body[field]);
 const invalidMulti=multiFields.some(field=>!Array.isArray(body[field])||(body[field] as unknown[]).length<1||(body[field] as unknown[]).length>3||(body[field] as unknown[]).some(item=>typeof item!=='string'));
 if(invalidSingle||invalidMulti)return Response.json({error:'invalid response'},{status:400});
 await env.DB.batch([env.DB.prepare(createResponsesSql),env.DB.prepare(createCreatedIndexSql)]);
 await env.DB.prepare(`INSERT INTO survey_responses (pet_type,age_stage,health_status,concerns,feeding_issue,royal_usage,trust_source,price_attitude) VALUES (?,?,?,?,?,?,?,?)`).bind(body.petType,body.ageStage,JSON.stringify(body.healthStatus),JSON.stringify(body.concerns),JSON.stringify(body.feedingIssue),body.royalUsage,JSON.stringify(body.trustSource),body.priceAttitude).run();
 return Response.json({ok:true},{status:201,headers:{'cache-control':'no-store'}});
}
