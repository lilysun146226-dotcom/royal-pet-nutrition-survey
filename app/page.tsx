'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type SurveyData = { petType:string; ageStage:string; healthStatus:string[]; concerns:string[]; feedingIssue:string[]; royalUsage:string; trustSource:string[]; priceAttitude:string };
type Stats = { total:number; petTypes:Record<string,number>; stages:Record<string,number>; concerns:Record<string,number>; royalUsage:Record<string,number>; segments:Record<string,number> };
const initialData:SurveyData={petType:'',ageStage:'',healthStatus:[],concerns:[],feedingIssue:[],royalUsage:'',trustSource:[],priceAttitude:''};
const multiKeys=new Set(['healthStatus','concerns','feedingIssue','trustSource']);
const steps=[
{key:'petType',eyebrow:'01 · 宠物伙伴',title:'您正在为谁选择主粮？',note:'帮助我们区分猫犬喂养场景。',options:['猫咪','狗狗','猫狗都有']},
{key:'ageStage',eyebrow:'02 · 生命阶段',title:'TA 正处于哪个生命阶段？',note:'生命周期是营养需求分层的第一条主线。',options:['幼年期（1岁以内）','成年期（1–7岁）','老年期（7岁以上）']},
{key:'healthStatus',eyebrow:'03 · 健康状态',title:'目前是否存在需要特别关注的健康状况？',note:'可多选，最多3项；患病与处方粮需求将进入专业营养分层。',options:['总体健康','肠胃敏感／易软便','泌尿／肾脏问题','皮肤／毛发问题','体重管理','其他或不确定']},
{key:'concerns',eyebrow:'04 · 核心诉求',title:'选择宠粮时，您最在意什么？',note:'最多选择3项，用于识别核心决策驱动。',options:['适口性／爱不爱吃','肠胃耐受／便便状态','毛发／皮肤状态','原料安全与透明','价格／性价比','功能健康／精准营养','兽医或专业机构推荐']},
{key:'feedingIssue',eyebrow:'05 · 喂养痛点',title:'最近困扰您的喂养问题有哪些？',note:'可多选，最多3项；捕捉实际体验，而不仅是购买偏好。',options:['挑食／拒食','软便／呕吐','体重变化','不知道该选哪种粮','换粮困难','没有明显困扰']},
{key:'royalUsage',eyebrow:'06 · 品牌关系',title:'您与皇家 Royal Canin 的关系更接近哪一种？',note:'区分现有用户、流失用户和潜在人群。',options:['正在喂食','曾经喂过','了解但没有购买','只听说过','完全不了解']},
{key:'trustSource',eyebrow:'07 · 专业信任',title:'哪些信息能让您相信一款宠粮？',note:'可多选，最多3项；识别专业信任的主要建立路径。',options:['兽医建议','科学配方与研究','真实宠主评价','品牌长期口碑','清晰配料与检测','达人／博主推荐']},
{key:'priceAttitude',eyebrow:'08 · 价值判断',title:'面对专业营养宠粮，您的价格态度是？',note:'理解价格敏感度与价值接受门槛。',options:['效果明确，愿意支付更高价格','会比较，但专业与品质优先','促销合适才购买','价格是首要考虑']},
] as const;
const fallbackStats:Stats={total:0,petTypes:{'猫咪':0,'狗狗':0,'猫狗都有':0},stages:{'幼年期（1岁以内）':0,'成年期（1–7岁）':0,'老年期（7岁以上）':0},concerns:{},royalUsage:{},segments:{}};
const API_BASE='https://royal-pet-survey-api.royal-pet-survey-2026.workers.dev';

export default function Home(){
 const[mode,setMode]=useState<'survey'|'dashboard'>('survey'); const[step,setStep]=useState(-1); const[data,setData]=useState<SurveyData>(initialData); const[submitted,setSubmitted]=useState(false); const[sending,setSending]=useState(false); const[stats,setStats]=useState<Stats>(fallbackStats);
 useEffect(()=>{if(mode!=='dashboard')return;const refresh=()=>fetch(`${API_BASE}/api/stats`,{cache:'no-store'}).then(r=>r.ok?r.json():fallbackStats).then(setStats).catch(()=>setStats(fallbackStats));refresh();const timer=window.setInterval(refresh,5000);return()=>window.clearInterval(timer)},[mode,submitted]);
 const current=step>=0?steps[step]:null; const currentValue=current?data[current.key]:''; const canContinue=Array.isArray(currentValue)?currentValue.length>0:Boolean(currentValue); const progress=step<0?0:((step+1)/steps.length)*100;
 const choose=(value:string)=>{if(!current)return;if(multiKeys.has(current.key))setData(p=>{const values=p[current.key] as string[];const exists=values.includes(value);if(!exists&&values.length>=3)return p;return{...p,[current.key]:exists?values.filter(x=>x!==value):[...values,value]}});else setData(p=>({...p,[current.key]:value}))};
 const next=async(event?:FormEvent)=>{event?.preventDefault();if(!canContinue)return;if(step<steps.length-1){setStep(step+1);return}setSending(true);try{const r=await fetch(`${API_BASE}/api/responses`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw new Error();setSubmitted(true)}catch{window.alert('提交暂时没有成功，请检查网络后再试。')}finally{setSending(false)}};
 const topConcern=useMemo(()=>Object.entries(stats.concerns).sort((a,b)=>b[1]-a[1])[0],[stats]);
 return <main className="site-shell">
  <header className="topbar"><button className="brand" onClick={()=>{setMode('survey');setStep(-1)}} aria-label="返回问卷首页"><img src="./royal-canin-logo.svg" alt="Royal Canin"/><small>精准营养调研</small></button><nav aria-label="主要导航"><button className={mode==='survey'?'active':''} onClick={()=>setMode('survey')}>参与调研</button><button className={mode==='dashboard'?'active':''} onClick={()=>setMode('dashboard')}>统计看板</button></nav></header>
  {mode==='dashboard'?<Dashboard stats={stats} topConcern={topConcern}/>:submitted?<section className="completion panel"><span className="big-index">✓</span><p className="eyebrow">已完成 · 感谢您的声音</p><h1>每一只宠物，<br/><em>都有独特的营养需求。</em></h1><p>您的答案已经进入匿名统计。它将帮助我们理解不同生命阶段、健康状况与喂养家庭的真实需要。</p><div className="completion-actions"><button className="primary" onClick={()=>setMode('dashboard')}>查看实时统计</button><button className="secondary" onClick={()=>{setData(initialData);setSubmitted(false);setStep(-1)}}>重新填写</button></div></section>:step<0?<section className="hero"><div className="hero-copy"><p className="eyebrow">ROYAL CANIN · PET NUTRITION STUDY 2026</p><h1>听见每一种<br/><em>喂养需求</em></h1><p className="lead">一份约3分钟的匿名调研，了解幼年、成年、老年及特殊健康宠物家庭的核心诉求。</p><div className="hero-actions"><button className="primary" onClick={()=>setStep(0)}>开始填写 <span>→</span></button><span>8道题 · 无需登录 · 匿名统计</span></div></div><div className="pet-mosaic" aria-label="猫犬营养生命阶段图形"><div className="pet-tile dog"><span>DOG</span><b>生命阶段</b></div><div className="pet-tile cat"><span>CAT</span><b>精准营养</b></div><div className="pet-tile red"><span>01—08</span><b>宠主之声</b></div><div className="pet-tile rings"><span>HEALTH</span><b>专业信任</b></div></div><div className="hero-line"><span>幼年成长</span><span>成年维持</span><span>老年关怀</span><span>特殊健康</span></div></section>:<section className="question-wrap"><div className="progress"><span style={{width:`${progress}%`}}/></div><form className="question-card" onSubmit={next}><button type="button" className="back" onClick={()=>setStep(Math.max(-1,step-1))}>← 返回</button><p className="eyebrow">{current?.eyebrow}</p><h1>{current?.title}</h1><p className="question-note">{current?.note}</p><div className="options">{current?.options.map((option,index)=>{const selected=Array.isArray(currentValue)?currentValue.includes(option):currentValue===option;return <button type="button" className={selected?'option selected':'option'} key={option} onClick={()=>choose(option)}><span>{String(index+1).padStart(2,'0')}</span><b>{option}</b><i>{selected?'✓':'○'}</i></button>})}</div><div className="form-footer"><span>{current&&multiKeys.has(current.key)?`已选择 ${(currentValue as string[]).length}/3`:`${step+1} / ${steps.length}`}</span><button className="primary" disabled={!canContinue||sending}>{step===steps.length-1?(sending?'正在提交…':'提交问卷'):'继续 →'}</button></div></form></section>}
  <footer><span>独立研究用途 · 非皇家官方活动</span><span>匿名收集，不包含个人身份信息</span></footer>
 </main>
}

function Dashboard({stats,topConcern}:{stats:Stats;topConcern?:[string,number]}){
 const max=Math.max(1,...Object.values(stats.concerns));
 const rows=Object.entries(stats.concerns).sort((a,b)=>b[1]-a[1]);
 return <section className="dashboard">
  <div className="dash-head"><div><p className="eyebrow">LIVE RESEARCH DASHBOARD</p><h1>消费者营养需求<br/><em>统计看板</em></h1></div><p>新问卷提交后约5秒自动刷新。图表由匿名原始数据实时聚合，并用于建立生命周期、健康需求、信任方式和价值态度画像。</p></div>
  <div className="live-badge"><i/>实时连接数据库 · 每5秒更新</div>
  <div className="metric-grid"><article className="metric primary-metric"><span>有效样本</span><strong>{stats.total}</strong><small>份匿名问卷</small></article><article className="metric"><span>最高频诉求</span><strong className="word">{topConcern?.[0]||'等待样本'}</strong><small>{topConcern?`${topConcern[1]}次提及`:'提交后自动更新'}</small></article><article className="metric"><span>数据状态</span><strong className="word">实时</strong><small>约5秒刷新一次</small></article></div>
  <div className="chart-grid"><article className="chart-card"><div className="card-title"><span>01</span><h2>核心诉求提及频数</h2></div>{rows.length?rows.map(([label,value])=><div className="bar-row" key={label}><label>{label}</label><div><i style={{width:`${(value/max)*100}%`}}/></div><b>{value}</b></div>):<Empty/>}</article><article className="chart-card"><div className="card-title"><span>02</span><h2>生命周期人群</h2></div><div className="stage-list">{Object.entries(stats.stages).map(([label,value],index)=><div key={label}><span>0{index+1}</span><b>{label.split('（')[0]}</b><strong>{stats.total?Math.round(value/stats.total*100):0}%</strong><small>{value}份</small></div>)}</div></article></div>
  <article className="chart-card pet-card"><div className="card-title"><span>03</span><h2>猫狗样本分布</h2></div><p className="persona-note">依据问卷第1题统计，区分猫咪家庭、狗狗家庭以及猫狗共同喂养家庭。</p><div className="pet-type-grid">{Object.entries(stats.petTypes||{}).map(([label,value])=><div key={label}><b>{label}</b><strong>{value}</strong><span>{stats.total?Math.round(value/stats.total*100):0}% · {value}份</span></div>)}</div></article>
  <article className="chart-card persona-card"><div className="card-title"><span>04</span><h2>可用于用户画像的需求分群</h2></div><p className="persona-note">同一受访者可以进入多个分群，便于后续交叉分析与画像命名。</p><div className="persona-grid">{Object.entries(stats.segments).map(([label,value])=><div key={label}><b>{label}</b><strong>{value}</strong><span>{stats.total?Math.round(value/stats.total*100):0}% 样本覆盖</span></div>)}</div></article>
 </section>
}
function Empty(){return <div className="empty"><b>等待第一份问卷</b><span>提交后，统计结果会自动出现在这里。</span></div>}
