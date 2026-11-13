import {plans,profiles,measures,materials,normalizeWeights,rankPlans,scenarioRanks,estimateEconomics} from './model.js';
import {cases,caseFilters} from './cases.js';

const icons={
  home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  leaf:'<path d="M20 3c-8-1-15 2-15 9a6 6 0 0 0 6 6c7 0 10-7 9-15ZM4 21l11-11M9 16V9M9 16h7"/>',
  wallet:'<path d="M20 8V5H5a2 2 0 0 0 0 4h15v11H5a2 2 0 0 1-2-2V7M20 12h-6v5h6"/><path d="M16 14.5h.01"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  feather:'<path d="M20 4c-4-4-11 0-13 5s1 8 1 8 3 3 8 1 8-10 4-14ZM3 22 17 8M8 17h6M11 13h6"/>',
  pin:'<path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.01"/>',
  reset:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  compare:'<path d="M3 5h7v14H3zM14 5h7v14h-7zM6 9h1M17 9h1M6 13h1M17 13h1"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  print:'<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6zM17 11h.01"/>',
  window:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16M8 6 6 9"/>',
  wall:'<path d="M3 4h18v16H3zM3 9h18M3 15h18M9 4v5M15 4v5M7 9v6M16 9v6M10 15v5"/>',
  roof:'<path d="m2 13 10-9 10 9H2ZM5 13v8h14v-8M8 11l4-4 4 4"/>',
  heatpump:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="10" cy="12" r="4"/><path d="M10 8v8M6 12h8M17 9h1M17 12h1M17 15h1"/>',
  solar:'<path d="m5 7-3 12h20L19 7H5ZM12 7v12M4 13h16M12 19v3M9 22h6M17 2v2M21 3l-1 1"/>',
  chart:'<path d="M4 3v17h17M8 15v-5M13 15V6M18 15v-3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.home}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const $=s=>document.querySelector(s);
const labels=['省钱','减碳','舒适','风貌','少打扰'];
const profileMeta={S1:{title:'先把钱花在刀刃上',sub:'控制投入，让改造轻一点',icon:'wallet'},S2:{title:'冬暖夏凉更舒服',sub:'愿意为居住舒适多投入',icon:'sun'},S3:{title:'留住老房子的样子',sub:'在意老街与院落的原有风貌',icon:'home'},S4:{title:'少施工，少些打扰',sub:'日常生活尽量不受影响',icon:'feather'}};
const constraintDefs=[
  {key:'facade',title:'外观与街区风貌',hint:'是否希望保留现有外观？',options:[['free','暂不限制'],['preserve','尽量不改变外观']]},
  {key:'roof',title:'屋顶是否方便施工',hint:'包括屋面保温和光伏安装',options:[['allowed','可以考虑'],['blocked','暂不动屋顶']]},
  {key:'coordination',title:'共有部位的协调情况',hint:'涉及邻居时，先确认共同意愿',options:[['private','可自行决定'],['agreed','已经协商'],['pending','尚未协商']]},
  {key:'disturbance',title:'能接受多少施工打扰',hint:'“尽量少”保留少扰动评分≥3的方案',options:[['any','都可以比较'],['low','尽量少打扰']]},
  {key:'equipment',title:'是否考虑增加热泵设备',hint:'还需现场确认安装空间和用电条件',options:[['allowed','可以考虑'],['blocked','暂不加设备']]}
];
const initial={budget:10,profile:'S1',weights:null,facade:'free',roof:'allowed',coordination:'private',disturbance:'any',equipment:'allowed',electricity:0.56,carbonFactor:0.6101};
let settings={...initial};
let selected=[],expanded=false,currentView='configure',toastTimer,formFocus=null;
const storageKey='tanwei-resident-v1';
try{
  const stored=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(stored){
    if([3,5,10,15,20,99].includes(stored.settings?.budget)) settings.budget=stored.settings.budget;
    if(profileMeta[stored.settings?.profile]) settings.profile=stored.settings.profile;
    constraintDefs.forEach(d=>{if(d.options.some(o=>o[0]===stored.settings?.[d.key]))settings[d.key]=stored.settings[d.key];});
    const w=stored.settings?.weights;if(Array.isArray(w)&&w.length===5&&w.every(n=>Number.isFinite(n)&&n>=0&&n<=100)&&w.some(n=>n>0))settings.weights=w;
    if(Array.isArray(stored.selected))selected=[...new Set(stored.selected.filter(id=>plans.some(p=>p.id===id)))].slice(0,3);
  }
}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({settings,selected}));}catch{}}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function measureName(key){return measures[key]?.name||({window:'更换外窗',wall:'外墙保温',roof:'屋面保温',heatpump:'空气源热泵',solar:'屋面光伏'}[key])||key;}
const weights=()=>normalizeWeights(settings.weights||profiles[settings.profile].weights);
const money=n=>Number(n).toFixed(2);
const percent=n=>Math.round(n*100);
function scored(){return rankPlans(settings);}
function findScored(id){return scored().find(p=>p.id===id);}

/* ---------- 居民视角：第一页四问、生活场景、材料 ---------- */
const scenes=[
  {img:'courtyard',alt:'AI 示意：青砖院落与新窗，老人坐在门口',title:'院子还是那个院子，先看窗',text:'想改善漏风，可以先检查窗框、玻璃与安装密封。颜色和分格尽量与院落协调。',plan:'P1',hint:'了解外窗更换'},
  {img:'winter',alt:'AI 示意：冬日下午的堂屋，老人坐在窗边',title:'冬日的堂屋，想更舒服一点',text:'更换外窗可以改善保温与气密性；实际室温还受供暖、日照和使用习惯影响。',plan:'P1',hint:'了解外窗更换'},
  {img:'night',alt:'AI 示意：冬夜一家人围坐吃饭',title:'一家人坐下吃顿暖和的饭',text:'围护改造与热泵可以组合考虑。需要同时确认室内末端、供电、运行费用与维护。',plan:'P8',hint:'围护改造＋热泵'},
  {img:'summer',alt:'AI 示意：学生在夏日葡萄架下写作业',title:'夏天，也想少一点闷热',text:'墙面和屋面保温着眼于围护传热。庭院遮阳与通风也值得讨论，但未计入这套组合的效果。',plan:'P6',hint:'外墙＋屋面'},
  {img:'solar',alt:'AI 示意：灰瓦屋面上的光伏板',title:'屋顶发电，先看装不装得下',text:'先核对承载、防水、遮挡与街区风貌。发电可供白天用电，夜间需电网或储能；收益要按接入方式核算。',plan:'P9',hint:'围护改造＋光伏'},
  {img:'insulation',alt:'AI 示意：工人在外墙铺贴保温板',title:'给外墙加保温，先看基层',text:'先检查墙面与潮湿情况，再确定保温、防火和饰面构造。脚手架、进场通道与排期也要谈清楚。',plan:'P2',hint:'了解外墙保温'},
  {img:'heatpump',alt:'AI 示意：院墙旁的空气源热泵外机',title:'热泵放哪里，也是一道选择题',text:'外机要留出换热、检修空间，并考虑邻里噪声、减振和化霜水排放；机型与末端需要配套设计。',plan:'P11',hint:'外窗＋热泵'}
];
function renderEntry(){
  const costs=plans.map(p=>p.cost),carbons=plans.map(p=>p.carbon),comforts=plans.map(p=>p.comfort);
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  set('entry-cost-min',Math.min(...costs).toFixed(2));
  set('entry-cost-max',Math.max(...costs).toFixed(2));
  set('entry-carbon-min',Math.min(...carbons).toFixed(2));
  set('entry-carbon-max',Math.max(...carbons).toFixed(2));
  set('entry-comfort-min','+'+Math.min(...comforts).toFixed(1));
  set('entry-comfort-max','+'+Math.max(...comforts).toFixed(1));
}
function renderScenes(){
  const grid=document.getElementById('scene-grid');if(!grid)return;
  grid.innerHTML=scenes.map(s=>{
    const plan=plans.find(p=>p.id===s.plan);
    return `<article class="scene-card"><div class="scene-image"><img src="assets/scenes/${s.img}.jpg" alt="${s.alt}" loading="lazy" width="1440" height="960"><span class="image-kind">AI 情景示意</span></div><div class="scene-body"><h3>${s.title}</h3><p>${s.text}</p><div class="scene-foot"><span class="scene-price">${plan?money(plan.cost):'—'}<small>万元 · 组合估算</small></span><button class="scene-link" data-detail="${s.plan}">${s.hint} ${icon('arrow-right')}</button></div></div></article>`;
  }).join('');
}
function renderMaterials(){
  const grid=document.getElementById('materials-grid');if(!grid)return;
  grid.innerHTML=Object.entries(materials).map(([key,m])=>`<article class="material-card"><span class="material-icon">${icon(key)}</span><h3>${m.title} · ${m.short}</h3><p class="material-spec">${m.spec}</p><div class="material-facts"><span>排期 <b>${m.duration}</b></span><span>论文估算 <b>${m.price}</b></span></div><p class="material-note">${m.note}</p></article>`).join('');
}
const materialLine=p=>p.id==='P13'?'历史做法：真空玻璃窗＋聚苯乙烯保温板＋光伏':p.measures.map(k=>materials[k].short).join(' ＋ ');

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let caseFilter='all';
function caseImage(src,alt,extra=''){
  return `<div class="case-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" ${extra}><span class="image-fallback" aria-hidden="true">原站图片暂未载入<br>可通过下方来源查看实景与图纸</span></div>`;
}
function renderCases(){
  $('#case-filters').innerHTML=caseFilters.map(([id,label])=>`<button data-case-filter="${id}" aria-pressed="${caseFilter===id}" class="${caseFilter===id?'selected':''}">${label}</button>`).join('');
  const list=cases.filter(c=>caseFilter==='all'||c.categories.includes(caseFilter));
  $('#case-count').textContent=`${list.length} 个建成案例`;
  const srcBox=document.getElementById('case-sources');
  if(srcBox){srcBox.innerHTML='<span>案例原文：</span>'+cases.map(c=>{let host='gooood.cn';try{host=new URL(c.source).hostname.replace(/^www\./,'')}catch{}return `<a href="${c.source}" target="_blank" rel="noopener noreferrer">${c.name}<small>${host} \u2197</small></a>`;}).join('');}
  $('#case-grid').innerHTML=list.map(c=>`<article class="case-card"><button class="case-cover" data-case="${c.id}" aria-label="查看${c.name}案例">${caseImage(c.cover,c.name+'，建成实景；摄影署名见详情','width="472" height="303"')}<span class="case-built">已建成 · ${c.year}</span><span class="case-cover-cta">看实景与图纸 ${icon('arrow-right')}</span></button><div class="case-body"><p class="case-location">${icon('pin')}${c.location}</p><h3><button data-case="${c.id}">${c.name}</button></h3><p class="case-type">${c.type}</p><p class="case-intro">${c.intro}</p><div class="case-tags">${c.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="case-card-footer"><button class="text-button" data-case="${c.id}">了解怎么改 ${icon('arrow-right')}</button><a href="${c.source}" target="_blank" rel="noopener noreferrer">来源 · 谷德 ↗</a></div></div></article>`).join('');
}
function openCase(id){
  const c=cases.find(c=>c.id===id);if(!c)return;
  $('#case-detail-content').innerHTML=`<p class="case-location">${c.location} · ${c.year} 建成</p><h2 id="case-detail-title" class="detail-title">${c.name}</h2><p class="case-type">${c.type}</p><figure class="case-gallery" id="case-gallery">${caseImage(c.cover,c.name+'建成实景')}<figcaption id="case-photo-caption">建成实景 · ${c.credit}</figcaption></figure><div class="case-photo-options" role="group" aria-label="选择案例照片与图纸"><button data-case-photo="${id}" data-photo="-1" aria-pressed="true">建成实景</button>${c.gallery.map((p,i)=>`<button data-case-photo="${id}" data-photo="${i}" aria-pressed="false">${escapeHtml(p.caption.split(/[，,©]/)[0])}</button>`).join('')}</div><dl class="case-facts"><div><dt>设计方</dt><dd>${c.designer}</dd></div><div><dt>建筑面积</dt><dd>${c.area}</dd></div><div><dt>改造造价</dt><dd>公开资料未披露</dd></div><div><dt>实测节能收益</dt><dd>公开资料未披露</dd></div></dl><div class="case-before-after"><section><span>原来的问题</span><h3>改造前</h3><p>${c.before}</p></section><section><span>项目采取的做法</span><h3>改造后</h3><p>${c.after}</p></section></div><section class="case-practice"><h3>具体做了什么</h3>${c.practice.map(([title,text],i)=>`<div><b>0${i+1}</b><p><strong>${title}</strong>${text}</p></div>`).join('')}</section><section class="case-lesson"><h3>对我们改老房，有什么启发？</h3><p>${c.lesson}</p><p class="case-boundary">适用边界：${c.boundary}</p></section><details class="case-evidence"><summary>查看资料完整性与来源</summary><p><b>可查资料：</b>${c.available}。</p><p><b>仍缺数据：</b>${c.missing}。</p><p>根据设计方公开介绍整理，未做独立现场验证。案例未参与住宅方案评分，也不用于推算你家的造价、温升或回收期。</p><p><b>摄影与图纸：</b>${c.credit}。图片由原站提供，权利归原作者。</p><a href="${c.source}" target="_blank" rel="noopener noreferrer">阅读完整原文、照片与图纸 ↗</a><p class="field-note">来源：谷德设计网 · 核对日期 ${c.accessed}</p></details><div class="case-detail-actions"><a class="button outline" href="${c.source}" target="_blank" rel="noopener noreferrer">查看完整项目 ↗</a><button class="button primary" data-case-apply="${c.id}">${c.prompt} ${icon('arrow-right')}</button></div>`;
  if(!$('#case-dialog').open)$('#case-dialog').showModal();
}
function scrollToSection(id){
  if(currentView!=='configure')switchView('configure');
  document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderForm(){
  const active=document.activeElement;
  for(const key of ['budget','profile','constraint']){
    if(active?.dataset[key]){
      formFocus=`[data-${key}="${active.dataset[key]}"]`+(key==='constraint'?`[data-value="${active.dataset.value}"]`:'');
      break;
    }
  }
  $('#budget-options').innerHTML=[3,5,10,15,20,99].map(n=>`<button class="budget-choice ${settings.budget===n?'selected':''}" aria-pressed="${settings.budget===n}" data-budget="${n}"><strong>${n===99?'不限':n}<span>${n===99?'':'万元'}</span></strong><small>${n===99?'先看看所有方案':'预算上限'}</small>${settings.budget===n?icon('check'):''}</button>`).join('');
  $('#profile-options').innerHTML=Object.entries(profileMeta).map(([id,p])=>`<button class="profile-choice ${settings.profile===id?'selected':''}" data-profile="${id}" aria-pressed="${settings.profile===id}"><span class="profile-symbol">${icon(p.icon)}</span><span><span class="profile-title">${p.title}</span><span class="profile-description">${p.sub}</span></span><span class="choice-tick">${settings.profile===id?icon('check'):''}</span></button>`).join('');
  const w=weights();
  $('#weight-sliders').innerHTML=labels.map((name,i)=>`<div class="weight-row"><label for="weight-${i}">${name}<span class="weight-value" id="weight-value-${i}">${percent(w[i])}%</span></label><input id="weight-${i}" data-weight="${i}" type="range" min="0" max="100" step="1" value="${settings.weights?settings.weights[i]:percent(w[i])}" aria-label="${name}偏好强度"></div>`).join('');
  $('#constraint-options').innerHTML=constraintDefs.map(d=>`<div class="constraint-row"><div class="constraint-label"><h4>${d.title}</h4><p>${d.hint}</p></div><div class="segmented" role="group" aria-label="${d.title}">${d.options.map(([value,name])=>`<button data-constraint="${d.key}" data-value="${value}" class="${settings[d.key]===value?'selected':''}" aria-pressed="${settings[d.key]===value}">${name}</button>`).join('')}</div></div>`).join('');
}

function renderSummary(list){
  const fit=list.filter(p=>p.eligible);
  const restrictions=constraintDefs.filter(d=>settings[d.key]!==initial[d.key]).map(d=>d.options.find(o=>o[0]===settings[d.key])[1]);
  $('#summary-content').innerHTML=`<div class="summary-fact"><span class="summary-fact-label">预算上限</span><b>${settings.budget===99?'暂不设限':settings.budget+' 万元'}</b></div><div class="summary-fact"><span class="summary-fact-label">生活偏好</span><b>${settings.weights?'自定义偏好':profiles[settings.profile].name}</b></div><div class="summary-tags">${restrictions.length?restrictions.map(x=>`<span class="summary-tag">${x}</span>`).join(''):'<span class="summary-tag">施工条件暂不限制</span>'}</div>`;
  $('#feasible-count').textContent=fit.length;$('#fit-fill').style.width=(fit.length/13*100)+'%';
  $('#summary-preview').innerHTML=fit.length?`<div class="summary-preview"><span class="preview-icon">${icon('leaf')}</span><div class="preview-copy"><small>当前更贴近你的选择</small><b>${fit[0].name}</b><span>参考估算 ${money(fit[0].cost)} 万元</span></div></div>`:`<div class="summary-preview"><span class="preview-icon">${icon('info')}</span><div class="preview-copy"><b>暂时没有符合的方案</b><span>可调整预算或施工条件</span></div></div>`;
}

function planSketch(p){
  const has=k=>p.measures.includes(k);const roof=has('roof')?'#8faa93':'#aab3a3',wall=has('wall')?'#c7c6a6':'#e5ddcb';
  return `<svg viewBox="0 0 280 120" role="img" aria-label="${p.name}措施示意"><ellipse cx="140" cy="102" rx="96" ry="10" fill="#d3d8c5" opacity=".35"/><path d="m55 61 82-27 85 27-84 28Z" fill="#dcdac7"/><path d="M55 61v27l83 27V89Z" fill="${wall}"/><path d="M138 89v26l84-27V61Z" fill="#cecbb5"/><path d="m42 60 95-36 95 36-94 32Z" fill="${roof}"/><path d="m42 60 96 32v6L42 65Z" fill="#6f7e6c"/><path d="m138 92 94-32v5l-94 33Z" fill="#536b59"/><path d="m137 24 1 68M65 52l95 33M91 42l94 33M115 33l94 33" stroke="#f2f1df" stroke-opacity=".48" fill="none"/>${has('solar')?'<path d="m157 46 32 10-20 8-31-10Z" fill="#385869" stroke="#c3d2d1"/><path d="m149 50 31 10m-15-11-20 8" stroke="#a4bdbd"/>':''}<path d="m72 78 16 5v18l-16-5ZM105 88l16 5v17l-16-5Z" fill="${has('window')?'#b88456':'#6d7c69'}"/><path d="M80 80v18m33-7v17" stroke="#efe6c9"/>${has('heatpump')?'<path d="m190 83 17-6v16l-17 6Z" fill="#ede8da" stroke="#879382"/><ellipse cx="198" cy="88" rx="4" ry="5" fill="none" stroke="#879382"/>':''}<path d="M34 83V62M24 72q10-26 21 0q-10 12-21 0" fill="#8d9c77" stroke="#748568" stroke-width="2"/></svg>`;
}
function renderCards(list){
  const fit=list.filter(p=>p.eligible);
  $('#result-caption').textContent=`${fit.length} 种方案符合当前条件${fit.length?'，先看看与你的偏好更接近的 '+Math.min(3,fit.length)+' 种。':'。可以适当调整限制，再看看其他可能。'}`;
  $('#result-cards').innerHTML=fit.length?fit.slice(0,3).map((p,i)=>`<article class="plan-card ${i===0?'featured':''}"><div class="card-top"><span class="plan-rank">${i===0?icon('leaf'):''}${['更贴近你的偏好','另一种取舍','也值得看看'][i]}</span><span class="plan-id">${p.id}</span></div><div class="plan-visual">${planSketch(p)}</div><h3>${p.name}</h3><p class="plan-subtitle">${p.id==='P13'?'2024年历史参考组合':p.measures.length===1?'从一个部位，开始改善生活':p.measures.length+'项措施组合，兼顾不同需求'}</p><div class="measure-tags">${p.measures.map(k=>`<span>${icon(k)}${measureName(k)}</span>`).join('')}</div><p class="material-line"><b>材料</b>${materialLine(p)}</p><div class="cost-line"><span>估算投入</span><strong>${money(p.cost)}<small> 万元</small></strong></div><div class="plan-metrics"><div><strong>${p.carbon.toFixed(2)}<small> t / 年</small></strong><span>预计减碳</span></div><div><strong>+${p.comfort.toFixed(1)}<small> ℃</small></strong><span>舒适改善参考值</span></div></div><div class="match-row"><span>偏好匹配</span><div class="match-bar"><span style="width:${p.score.toFixed(1)}%"></span></div><b>${Math.round(p.score)}<small>分</small></b></div><div class="card-actions"><button class="button ${i===0?'primary':'outline'}" data-detail="${p.id}">了解这个方案 ${icon('arrow-right')}</button><button class="compare-button ${selected.includes(p.id)?'selected':''}" data-compare="${p.id}" aria-pressed="${selected.includes(p.id)}" aria-label="${selected.includes(p.id)?'移除':'加入'}${p.name}对比">${icon(selected.includes(p.id)?'check':'plus')}</button></div></article>`).join(''):`<div class="empty-state"><div class="empty-icon">${icon('home')}</div><h3>这些条件下，暂时没有合适的组合</h3><p>预算和施工条件仍由你决定。你可以先看看哪些条件影响了选择，再决定是否调整。</p><div class="empty-actions"><button class="button outline" id="relax-budget">暂不限制预算</button><button class="button outline" id="relax-construction">恢复施工条件</button></div></div>`;
  $('#all-plans').hidden=!expanded;
  $('#show-all').innerHTML=(expanded?'收起全部方案':'展开全部13种方案')+' '+icon('chevron-down');
  if(expanded)renderAll(list);
}
function renderAll(list){
  const ordered=[...list.filter(p=>p.eligible),...list.filter(p=>!p.eligible)];
  $('#all-plans').innerHTML=`<div class="table-wrap"><table class="data-table"><caption class="sr-only">全部方案的费用、效果及筛选结果</caption><thead><tr><th>方案</th><th>估算投入</th><th>年减碳</th><th>匹配分</th><th>当前筛选</th><th>操作</th></tr></thead><tbody>${ordered.map(p=>`<tr class="${p.eligible?'':'excluded-row'}"><td><button class="text-button" data-detail="${p.id}">${p.id} · ${p.name}</button></td><td>${money(p.cost)} 万</td><td>${p.carbon.toFixed(2)} t</td><td>${p.score.toFixed(1)}</td><td>${p.eligible?'<span class="status-pill">符合选择</span>':`<span class="filter-reason">${p.reasons.join('；')}</span>`}</td><td><button class="text-button" data-compare="${p.id}">${selected.includes(p.id)?'已加入 ✓':'加入对比 +'}</button></td></tr>`).join('')}</tbody></table></div>`;
}

function renderScatter(list){
  const width=550,height=260,left=48,right=22,top=20,bottom=44;const x=n=>left+n/14*(width-left-right),y=n=>height-bottom-n/.8*(height-top-bottom);
  let grid='';for(let n=0;n<=.8+1e-9;n+=.2)grid+=`<path d="M${left} ${y(n)}H${width-right}" stroke="#e3e7dc" stroke-dasharray="3 5"/><text x="${left-9}" y="${y(n)+4}" text-anchor="end">${n.toFixed(1)}</text>`;
  for(const n of [0,3,6,9,12])grid+=`<text x="${x(n)}" y="${height-bottom+22}" text-anchor="middle">${n}</text>`;
  const fit=list.filter(p=>p.eligible);const topIds=fit.slice(0,3).map(p=>p.id);
  const labelOffset={P1:[8,0],P2:[-22,12],P3:[8,9],P4:[8,-7],P5:[8,10],P6:[8,5],P7:[-22,12],P8:[-23,-12],P9:[7,9],P10:[7,-7],P11:[9,-8],P12:[-24,-8],P13:[8,-8]};
  $('#scatter-chart').innerHTML=`<svg class="scatter-svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="13种改造方案的估算成本与年减碳量散点图"><text x="${left}" y="12">年减碳 / t</text>${grid}<text x="${width-right}" y="${height-3}" text-anchor="end">估算投入 / 万元</text>${list.map(p=>`<g class="chart-dot ${p.eligible?'':'filtered'} ${topIds.includes(p.id)?'selected':''}" data-detail="${p.id}" tabindex="0" role="button" aria-label="${p.id} ${p.name}，${p.cost}万元，年减碳${p.carbon}吨"><title>${p.id} ${p.name}：${p.cost}万元 / ${p.carbon} tCO₂每年</title><circle cx="${x(p.cost)}" cy="${y(p.carbon)}" r="${topIds.includes(p.id)?8:5}"/><text x="${x(p.cost)+labelOffset[p.id][0]}" y="${y(p.carbon)+labelOffset[p.id][1]}">${p.id}</text></g>`).join('')}</svg>`;
}
function renderScenarios(){
  const rankings=scenarioRanks(settings);
  $('#scenario-preview').innerHTML=Object.keys(profileMeta).map(id=>{
    const index=Object.keys(profileMeta).indexOf(id);const winner=plans.find(p=>rankings[p.id][index]===1);
    return `<button class="scenario-row ${settings.profile===id&&!settings.weights?'selected':''}" data-profile="${id}"><span class="scenario-symbol">${icon(profileMeta[id].icon)}</span><span>${profiles[id].name}<small>完整方案集</small></span><strong>${winner.id}<small>${winner.name}</small></strong>${icon('arrow-right')}</button>`;
  }).join('');
}
function renderDock(){
  $('#compare-count').textContent=selected.length;$('#dock-count').textContent=selected.length;
  $('#comparison-dock').hidden=selected.length===0||currentView==='compare';
  document.body.classList.toggle('has-dock',selected.length>0&&currentView!=='compare');
}
function renderComparison(){
  if(!selected.length){$('#comparison-content').innerHTML=`<div class="empty-compare empty-state"><div class="empty-icon">${icon('compare')}</div><h2>先挑几个想了解的方案</h2><p>点击方案卡右下角的“＋”，最多选择3种，再一起比较。</p><button class="button primary" data-view="configure">回到方案选配 ${icon('arrow-right')}</button></div>`;return;}
  $('#comparison-content').innerHTML=`<div class="comparison-grid" style="--compare-count:${selected.length}">${selected.map(id=>{
    const p=findScored(id),e=estimateEconomics(p,settings);
    return `<article class="comparison-card"><div class="comparison-card-top"><span class="mini-label">${p.id}</span><button class="icon-button" data-compare="${p.id}" aria-label="移除${p.name}">${icon('close')}</button></div><div class="plan-visual">${planSketch(p)}</div><h2>${p.name}</h2><p class="comparison-note ${p.eligible?'':'not-eligible'}">${p.eligible?'符合你当前的预算和施工选择':p.reasons.join('；')}</p><div class="comparison-values">${[['估算投入',money(p.cost)+' 万元'],['预计年减碳',p.carbon.toFixed(2)+' tCO₂'],['舒适改善参考值','+'+p.comfort.toFixed(1)+' ℃'],['风貌友好',p.heritage+' / 5'],['少打扰',p.disturbance+' / 5'],['当前偏好匹配',p.score.toFixed(1)+' 分'],['等价年省电费','约 '+Math.round(e.annualSavings)+' 元'],['简单回收期',Number.isFinite(e.payback)?'约 '+e.payback.toFixed(1)+' 年':'不适用']].map(([k,v])=>`<div class="comparison-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div class="measure-tags">${p.measures.map(k=>`<span>${measureName(k)}</span>`).join('')}</div><button class="button outline full-width" data-detail="${p.id}">查看详情与咨询卡 ${icon('arrow-right')}</button></article>`;
  }).join('')}</div><p class="method-note">经济指标为全电力情景等价折算，不含维护、折现和设备更换。风貌与扰动为研究评分，舒适改善为论文参考估值。</p><button class="button primary" id="export-comparison">${icon('download')} 导出本次比较记录</button>`;
}
function renderRanks(){
  const r=scenarioRanks(settings);
  $('#rank-table').innerHTML=`<div class="table-wrap"><table class="data-table rank-table"><thead><tr><th>方案</th>${Object.keys(profileMeta).map(id=>`<th>${profiles[id].name}</th>`).join('')}<th>位次变化</th></tr></thead><tbody>${plans.map(p=>`<tr><td><button class="text-button" data-detail="${p.id}">${p.id} · ${p.name}</button></td>${r[p.id].map(n=>`<td><span class="rank-cell ${n<=3?'top-rank':''}">${n}</span></td>`).join('')}<td>${Math.max(...r[p.id])-Math.min(...r[p.id])} 位</td></tr>`).join('')}</tbody></table></div>`;
}
function renderDynamic(){const list=scored();renderSummary(list);renderCards(list);renderScatter(list);renderScenarios();renderDock();if(currentView==='compare')renderComparison();persist();if(formFocus){document.querySelector(formFocus)?.focus({preventScroll:true});formFocus=null;}}
function switchView(view){
  if(!['configure','compare','research'].includes(view))return;currentView=view;
  for(const v of ['configure','compare','research'])$('#'+v+'-view').hidden=v!==view;
  document.querySelectorAll('.nav-link').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  if(view==='compare')renderComparison();if(view==='research')renderRanks();renderDock();window.scrollTo({top:0,behavior:'smooth'});
}
function toggleCompare(id){
  if(selected.includes(id)){selected=selected.filter(x=>x!==id);toast('已移出对比');}
  else {if(selected.length>=3){toast('最多同时比较3个方案，请先移除一个');return;}selected.push(id);toast('已加入对比，可继续选择其他方案');}
  renderDynamic();
}
function selectionSummary(){return `预算：${settings.budget===99?'不限':settings.budget+'万元以内'}；偏好：${settings.weights?'自定义':profiles[settings.profile].name}；`+constraintDefs.map(d=>d.title+'：'+d.options.find(o=>o[0]===settings[d.key])[1]).join('；');}
function briefHtml(p){
  const e=estimateEconomics(p,settings);
  return `<article class="print-sheet"><div class="print-header"><strong>碳为观止 · 一院一策</strong><span>方案咨询卡 · ${p.id}</span></div><h1>${p.name}</h1><p>${selectionSummary()}</p><div class="print-grid"><div><small>估算投入</small><strong>${money(p.cost)} 万元</strong></div><div><small>预计年减碳</small><strong>${p.carbon.toFixed(2)} tCO₂</strong></div><div><small>舒适改善参考值</small><strong>+${p.comfort.toFixed(1)} ℃</strong></div><div><small>等价年省电费</small><strong>约${Math.round(e.annualSavings)}元</strong></div></div><h2>措施清单</h2><ul>${p.measures.map(k=>`<li>${measureName(k)}</li>`).join('')}</ul><h2>咨询时，确认这几件事</h2><ul><li>现场核对实际面积、现有构造和设备条件。</li><li>确认所涉外观改动及共有部位的要求与协调情况。</li><li>取得包含材料、人工、辅材和拆旧的分项报价。</li><li>核对维护、更换费用及预计使用寿命。</li></ul>${!p.eligible?`<p><b>当前条件未满足：</b>${p.reasons.join('；')}</p>`:''}<h2>估算依据</h2><p>采用论文13方案库中的五户平均值；不代表本户报价或施工后效果。全电力情景按0.6101 kgCO₂/kWh、0.56元/kWh折算，简单回收期约${e.payback.toFixed(1)}年，未计维护、折现、更换、补贴及光伏余电结算。</p><p>本卡用于沟通和比较，不是审批文件或补贴申请书。匹配分仅反映所选权重下的相对排序。</p></article>`;
}
function openDetail(id){
  const p=findScored(id);if(!p)return;
  const e=estimateEconomics(p,settings);
  $('#detail-content').innerHTML=`<span class="detail-id">${p.id} · ${p.id==='P13'?'历史参考方案':'改造方案'}</span><h2 class="detail-title">${p.name}</h2><p class="plan-subtitle">把措施、投入和需要确认的条件，放在一起了解。</p>${!p.eligible?`<p class="detail-note">当前未通过筛选：${p.reasons.join('；')}</p>`:''}<div class="detail-grid">${[['估算投入',money(p.cost)+' 万元'],['预计年减碳',p.carbon.toFixed(2)+' t'],['舒适改善参考值','+'+p.comfort.toFixed(1)+' ℃'],['偏好匹配',p.score.toFixed(1)+' 分']].map(([k,v])=>`<div class="detail-stat"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div class="detail-columns"><div><h3>这套方案，改些什么</h3><ul>${p.measures.map(k=>`<li>${icon(k)}${measureName(k)}</li>`).join('')}</ul><h3>用能与经济参考</h3><p>等价年省电费约 <b>${Math.round(e.annualSavings)} 元</b>，简单回收期约 <b>${e.payback.toFixed(1)} 年</b>。</p><p class="field-note">按论文全电力情景折算；不含维护、折现、更换和补贴，不能替代实际账单分析。</p></div><div><h3>动工之前，先确认</h3><ul class="check-list"><li>住宅的实际面积和现有构造</li><li>外观、屋面及共有部位的改造条件</li>${p.measures.includes('heatpump')?'<li>热泵安装空间、供电与噪声影响</li>':''}${p.measures.includes('solar')?'<li>屋面承载、遮挡和光伏接入条件</li>':''}<li>包含人工、辅材、拆旧的完整报价</li></ul></div></div><section class="detail-materials-block"><h3>可讨论的材料与论文估算单价</h3><table class="detail-materials"><thead><tr><th>部位</th><th>做法与材料</th><th>排期</th><th>论文估算单价</th></tr></thead><tbody>${p.measures.map(k=>{const m=materials[k];const spec=p.id==='P13'?(k==='window'?'历史做法：真空玻璃窗':k==='wall'?'历史做法：聚苯乙烯保温板':m.spec):m.spec;return `<tr><td>${m.title}</td><td>${spec}</td><td>${m.duration}</td><td>${m.price}</td></tr>`;}).join('')}</tbody></table><p class="field-note">单价来自论文表1，未取得本户报价；材料是可讨论做法。实际选材、工程量、工期与费用需现场核定。</p></section><div class="detail-note">数据来自论文代表户平均估算。舒适温升、风貌和扰动均为情景指标；匹配分随你的偏好变化。</div><div class="detail-actions"><button class="button outline" data-compare="${p.id}">${icon('compare')}${selected.includes(id)?'移出对比':'加入对比'}</button><button class="button outline" data-download="${p.id}">${icon('download')}下载咨询卡</button><button class="button primary" data-print="${p.id}">${icon('print')}打印 / 存为PDF</button></div>`;
  if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
}
function download(filename,content,type){const url=URL.createObjectURL(new Blob(['\uFEFF',content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportBrief(id){const p=findScored(id);const css='body{font:16px/1.7 system-ui,sans-serif;color:#253a2d;max-width:800px;margin:40px auto;padding:24px}.print-header{display:flex;justify-content:space-between;border-bottom:2px solid #234d3c;padding-bottom:16px}.print-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;background:#f4f5ec;padding:20px}.print-grid small,.print-grid strong{display:block}h1{font-size:30px}h2{font-size:19px}p{font-size:14px}@media print{body{margin:0}}';download(`碳为观止_${p.id}_方案咨询卡.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${p.name} · 方案咨询卡</title><style>${css}</style><body>${briefHtml(p)}</body></html>`,'text/html;charset=utf-8');toast('已下载可独立打开、打印的方案咨询卡');}
function exportCsv(ids=plans.map(p=>p.id),name='方案数据'){
  const header=['方案编号','方案名称','估算成本(万元)','年减碳(tCO2)','舒适改善参考值(℃)','风貌评分','少扰动评分','当前匹配分','符合当前选择','未满足条件','等价年省电费(元)','简单回收期(年)','数据说明'];
  const rows=ids.map(id=>{const p=findScored(id),e=estimateEconomics(p,settings);return[p.id,p.name,p.cost,p.carbon,p.comfort,p.heritage,p.disturbance,p.score.toFixed(3),p.eligible?'是':'否',p.reasons.join('；'),e.annualSavings.toFixed(2),e.payback.toFixed(2),'论文情景估算；五代表户均值；经济指标为全电力折算，非本户实测'];});
  download(`碳为观止_${name}.csv`,[header,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('已导出比较数据');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button,a,[data-detail]');if(!button)return;
  if(button.dataset.caseFilter){caseFilter=button.dataset.caseFilter;renderCases();document.querySelector(`[data-case-filter="${caseFilter}"]`)?.focus({preventScroll:true});return;}
  if(button.dataset.case){openCase(button.dataset.case);return;}
  if(button.dataset.casePhoto){
    const c=cases.find(c=>c.id===button.dataset.casePhoto);const n=Number(button.dataset.photo);
    const photo=n===-1?{src:c.cover,caption:'建成实景 · '+c.credit}:c.gallery[n];if(!photo)return;
    $('#case-gallery').innerHTML=caseImage(photo.src,photo.caption)+`<figcaption>${escapeHtml(photo.caption)}</figcaption>`;
    document.querySelectorAll('[data-case-photo]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));return;
  }
  if(button.dataset.caseApply){
    const c=cases.find(c=>c.id===button.dataset.caseApply);if(!c)return;$('#case-dialog').close();
    if(c.profile){settings.profile=c.profile;settings.weights=null;renderForm();renderDynamic();scrollToSection('workspace');toast('已切换生活偏好；预算和施工条件可继续选择');}
    else scrollToSection(c.target);return;
  }
  if(button.dataset.preset){
    if(button.dataset.preset==='heritage'){settings.facade='preserve';settings.profile='S3';settings.weights=null;}
    if(button.dataset.preset==='pending')settings.coordination='pending';
    if(button.dataset.preset==='quiet'){settings.disturbance='low';settings.profile='S4';settings.weights=null;}
    renderForm();renderDynamic();scrollToSection('workspace');toast('已应用这项条件，其他选择保持当前设置');return;
  }
  if(button.dataset.view){switchView(button.dataset.view);return;}
  if(button.dataset.budget){settings.budget=Number(button.dataset.budget);renderForm();renderDynamic();return;}
  if(button.dataset.profile){settings.profile=button.dataset.profile;settings.weights=null;renderForm();renderDynamic();return;}
  if(button.dataset.constraint){settings[button.dataset.constraint]=button.dataset.value;renderForm();renderDynamic();return;}
  if(button.dataset.detail){openDetail(button.dataset.detail);return;}
  if(button.dataset.compare){toggleCompare(button.dataset.compare);if($('#detail-dialog').open)openDetail(button.dataset.compare);return;}
  if(button.dataset.download){exportBrief(button.dataset.download);return;}
  if(button.dataset.print){$('#print-area').innerHTML=briefHtml(findScored(button.dataset.print));$('#detail-dialog').close();window.print();return;}
  switch(button.id){
    case 'reset': settings={...initial};selected=[];expanded=false;renderForm();renderDynamic();toast('已恢复初始选择');break;
    case 'restore-weights':settings.weights=null;renderForm();renderDynamic();toast('已恢复当前偏好权重');break;
    case 'show-all':expanded=!expanded;renderCards(scored());break;
    case 'open-compare':switchView('compare');break;
    case 'clear-compare':selected=[];renderDynamic();break;
    case 'close-dialog':$('#detail-dialog').close();break;
    case 'close-case':$('#case-dialog').close();break;
    case 'relax-budget':settings.budget=99;renderForm();renderDynamic();break;
    case 'relax-construction':constraintDefs.forEach(d=>settings[d.key]=initial[d.key]);renderForm();renderDynamic();break;
    case 'export-data':exportCsv();break;
    case 'export-comparison':exportCsv(selected,'本次比较记录');break;
  }
});
document.addEventListener('input',event=>{
  if(event.target.dataset.weight===undefined)return;
  const values=[...document.querySelectorAll('[data-weight]')].map(el=>Number(el.value));
  if(values.every(v=>v===0)){event.target.value=1;values[Number(event.target.dataset.weight)]=1;}
  settings.weights=values;const w=weights();w.forEach((v,i)=>$('#weight-value-'+i).textContent=percent(v)+'%');renderDynamic();
});
document.addEventListener('keydown',event=>{const el=event.target;if(el.matches('.chart-dot')&&['Enter',' '].includes(event.key)){event.preventDefault();openDetail(el.dataset.detail);}});
$('#detail-dialog').addEventListener('click',event=>{if(event.target===$('#detail-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
$('#case-dialog').addEventListener('click',event=>{if(event.target===$('#case-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
document.addEventListener('error',event=>{if(event.target.matches?.('.case-image img')){event.target.parentElement.classList.add('image-failed');event.target.parentElement.querySelector('.image-fallback')?.setAttribute('aria-hidden','false');}},true);
document.querySelectorAll('.nav-anchor').forEach(a=>a.addEventListener('click',event=>{
  const target=document.querySelector(a.getAttribute('href'));if(!target)return;
  if(currentView!=='configure'){event.preventDefault();switchView('configure');setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),90);}
  else {event.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
}));
renderForm();renderEntry();renderScenes();renderMaterials();renderCases();renderDynamic();
