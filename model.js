/** Paper scenario data. Figures are estimates for five representative homes,
 * not a prediction for a specific user's home. All monetary costs are 万元. */
export const metricLabels=['成本','减碳','舒适','风貌','少扰动'];
export const defaults=Object.freeze({electricity:0.56,carbonFactor:0.6101});
export const measures=Object.freeze({
  window:{name:'更换外窗',description:'改善窗户保温与密封'},
  wall:{name:'外墙保温',description:'在外墙增设保温构造'},
  roof:{name:'屋面保温',description:'减少屋面热量散失'},
  heatpump:{name:'空气源热泵',description:'改善采暖制冷设备效率'},
  solar:{name:'屋面光伏',description:'利用屋顶太阳能发电'}
});
export const profiles=Object.freeze({
  S1:{name:'省钱优先',weights:[.45,.05,.20,.10,.20]},
  S2:{name:'舒适优先',weights:[.10,.05,.60,.10,.15]},
  S3:{name:'风貌优先',weights:[.15,.05,.10,.55,.15]},
  S4:{name:'省心优先',weights:[.20,.05,.20,.10,.45]}
});
const data=[
  ['P1','只换外窗',1.82,.20,1,4,4,['window']],
  ['P2','外墙保温',4.37,.14,.8,3,2,['wall']],
  ['P3','屋面保温',4.22,.07,.4,4,3,['roof']],
  ['P4','外窗＋外墙',6.19,.31,1.8,3,2,['window','wall']],
  ['P5','外窗＋屋面',6.04,.25,1.4,4,3,['window','roof']],
  ['P6','外墙＋屋面',8.59,.19,1.2,3,2,['wall','roof']],
  ['P7','围护结构综合改造',10.41,.35,2.2,3,2,['window','wall','roof']],
  ['P8','围护改造＋热泵',11.53,.57,2.8,3,2,['window','wall','roof','heatpump']],
  ['P9','围护改造＋光伏',11.75,.57,2.2,2,2,['window','wall','roof','solar']],
  ['P10','围护＋热泵＋光伏',12.87,.74,2.8,2,2,['window','wall','roof','heatpump','solar']],
  ['P11','外窗＋热泵',2.94,.46,1.6,3,3,['window','heatpump']],
  ['P12','墙面＋屋面＋热泵',9.71,.46,1.8,3,2,['wall','roof','heatpump']],
  ['P13','2024年参考组合',7.54,.53,1.8,2,2,['window','wall','solar']]
];
export const plans=Object.freeze(data.map(([id,name,cost,carbon,comfort,heritage,disturbance,items])=>Object.freeze({id,name,cost,carbon,comfort,heritage,disturbance,measures:Object.freeze(items)})));

export function normalizeWeights(values){
  if(!Array.isArray(values)||values.length!==5||values.some(v=>!Number.isFinite(v)||v<0))throw new TypeError('需要五个非负偏好权重');
  const total=values.reduce((a,b)=>a+b,0);
  if(total<=0)throw new RangeError('至少保留一个偏好权重');
  return values.map(v=>v/total);
}
const ranges=Object.fromEntries(['cost','carbon','comfort','heritage','disturbance'].map(key=>[key,[Math.min(...plans.map(p=>p[key])),Math.max(...plans.map(p=>p[key]))]]));
function performance(plan){
  return ['cost','carbon','comfort','heritage','disturbance'].map(key=>{
    const [min,max]=ranges[key];
    return key==='cost'?(Math.log(max)-Math.log(plan[key]))/(Math.log(max)-Math.log(min)):(plan[key]-min)/(max-min);
  });
}

/** UI constraints are conservative screening assumptions, not legal rulings. */
export function evaluatePlan(plan,settings={}){
  const reasons=[];
  if(Number.isFinite(settings.budget)&&plan.cost>settings.budget)reasons.push('超过预算上限');
  if(settings.facade==='preserve'&&plan.measures.some(k=>['wall','solar'].includes(k)))reasons.push('涉及外墙或屋面外观调整');
  if(settings.roof==='blocked'&&plan.measures.some(k=>['roof','solar'].includes(k)))reasons.push('需要屋顶施工');
  if(settings.coordination==='pending'&&plan.measures.some(k=>['wall','roof','solar'].includes(k)))reasons.push('共有部位需先协调');
  if(settings.disturbance==='low'&&plan.disturbance<3)reasons.push('施工扰动高于所选范围');
  if(settings.equipment==='blocked'&&plan.measures.includes('heatpump'))reasons.push('包含新增热泵设备');
  const w=normalizeWeights(settings.weights||profiles[settings.profile||'S1'].weights);
  const score=performance(plan).reduce((sum,value,i)=>sum+value*w[i],0)*100;
  return {...plan,eligible:reasons.length===0,reasons,score};
}

export function rankPlans(settings={}){
  return plans.map(p=>evaluatePlan(p,settings)).sort((a,b)=>b.score-a.score||Number(a.id.slice(1))-Number(b.id.slice(1)));
}

/** Compare all 13 plans under the four published weight scenarios. */
export function scenarioRanks(){
  const result=Object.fromEntries(plans.map(p=>[p.id,[]]));
  for(const profile of Object.keys(profiles))rankPlans({profile}).forEach((p,i)=>result[p.id].push(i+1));
  return result;
}

export function estimateEconomics(plan,settings={}){
  const price=settings.electricity??defaults.electricity;
  const factor=settings.carbonFactor??defaults.carbonFactor;
  if(!Number.isFinite(price)||price<0||!Number.isFinite(factor)||factor<=0)throw new RangeError('电价须非负，碳排因子须为正数');
  const equivalentKwh=plan.carbon*1000/factor;
  const annualSavings=equivalentKwh*price;
  return {equivalentKwh,annualSavings,payback:annualSavings>0?plan.cost*10000/annualSavings:Infinity};
}
