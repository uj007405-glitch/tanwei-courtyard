import { buildingTypes, facadeZones, layouts, wallOptions, windowOptions, roofOptions, baseline, ratios, defaults } from './v1-data.js';
import { cases, caseFilters } from './cases.js';
import { caseMedia } from './case-media.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const wan = (n) => (n / 10000).toFixed(2);

const state = { ...defaults };

const typeById = (id) => buildingTypes.find((t) => t.id === id);
const zoneById = (id) => facadeZones.find((z) => z.id === id);
const layoutById = (id) => layouts.find((l) => l.id === id);
const wallById = (id) => wallOptions.find((w) => w.id === id);
const winById = (id) => windowOptions.find((w) => w.id === id);
const roofById = (id) => roofOptions.find((r) => r.id === id);

/* ---------- 可选性判断 ---------- */
function wallAllowed(opt) {
  const t = typeById(state.typeId);
  return t.walls.includes(opt.side);
}
function roofAllowed(opt) {
  return typeById(state.typeId).roofs.includes(opt.id);
}
function rejectReason(kind, opt) {
  const t = typeById(state.typeId);
  if (kind === 'wall' && opt.side === 'outer') return `${t.name}不得做外保温，只能做内保温`;
  if (kind === 'roof') return `${t.name}屋面以修缮为主，只做内嵌保温`;
  return '当前类型不允许';
}

/* ---------- 步骤一：建筑类型 + 风貌区位 ---------- */
function renderTypes() {
  $('#type-grid').innerHTML = buildingTypes.map((t) => `
    <button class="choice ${state.typeId === t.id ? 'on' : ''}" data-type="${t.id}" aria-pressed="${state.typeId === t.id}">
      <span class="tag">${t.grade === '—' ? '按现行标准' : `${t.grade}管控`}</span>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <p class="why">${t.limit}</p>
    </button>`).join('');
}
function renderZones() {
  $('#zone-grid').innerHTML = facadeZones.map((z) => `
    <button class="choice ${state.zoneId === z.id ? 'on' : ''}" data-zone="${z.id}" aria-pressed="${state.zoneId === z.id}">
      <span class="tag">${z.sub}</span>
      <h3>${z.name}</h3>
      <p>${z.note}</p>
    </button>`).join('');
}
function zoneWarning() {
  const t = typeById(state.typeId);
  const z = zoneById(state.zoneId);
  if ((t.id === 'heritage' || t.id === 'historic') && z.id === 'f3') return '文物或历史建筑不会位于“现代类”区位，请核对选择。';
  if (t.id === 'modern' && z.id === 'f1') return '现代建筑一般不涉及风貌一级管控，请核对选择。';
  return '';
}

/* ---------- 步骤二：空间布局 ---------- */
function renderLayouts() {
  $('#layout-grid').innerHTML = layouts.map((l) => `
    <button class="choice ${state.layoutId === l.id ? 'on' : ''}" data-layout="${l.id}" aria-pressed="${state.layoutId === l.id}">
      <span class="tag">${l.form}</span>
      <h3>${l.name}</h3>
      <p>${l.note}</p>
      <div class="kv"><span>体型系数 <b>${l.shape}</b></span><span>通风 <b>${l.vent}/5</b></span><span>采光 <b>${l.light}/5</b></span></div>
    </button>`).join('');
}

/* ---------- 步骤三：分部位选型 ---------- */
function optionRow(kind, opt, allowed, priceUnit) {
  const on = kind === 'wall' ? state.wallId === opt.id : kind === 'window' ? state.windowId === opt.id : state.roofId === opt.id;
  const attr = kind === 'wall' ? 'data-wall' : kind === 'window' ? 'data-window' : 'data-roof';
  return `
    <button class="choice ${on ? 'on' : ''} ${allowed ? '' : 'off'}" ${attr}="${opt.id}" aria-pressed="${on}" ${allowed ? '' : 'aria-disabled="true"'}>
      <span class="tag">${priceUnit} · 传热系数 ${opt.k} W/(㎡·K)</span>
      <h3>${opt.name}</h3>
      <p><b>优点：</b>${opt.pros}<br><b>不足：</b>${opt.cons}</p>
      <div class="kv"><span>单价 <b>${opt.price} 元/㎡</b></span><span>防火 <b>${opt.fire || '—'}</b></span>${opt.life ? `<span>年限 <b>${opt.life}</b></span>` : ''}</div>
      ${allowed ? '' : `<p class="why">${rejectReason(kind, opt)}</p>`}
    </button>`;
}
function renderParts() {
  $('#wall-grid').innerHTML = wallOptions.map((o) => optionRow('wall', o, wallAllowed(o), o.side === 'outer' ? '外保温' : '内保温')).join('');
  $('#window-grid').innerHTML = windowOptions.map((o) => optionRow('window', o, true, '断桥铝型材')).join('');
  $('#roof-grid').innerHTML = roofOptions.map((o) => optionRow('roof', o, roofAllowed(o), '屋面')).join('');
  $('#window-note').textContent = typeById(state.typeId).facadeLocked
    ? '外窗可更换，分格与颜色需与现状一致。'
    : '外窗样式较自由，颜色需与街区协调。';
}

/* ---------- 参数 ---------- */
function renderParams() {
  $('#area').value = state.area;
  $('#floors').value = state.floors;
}

/* ---------- 计算 ---------- */
function compute() {
  const wallA = state.area * ratios.wall;
  const winA = state.area * ratios.window;
  const roofA = (state.area / state.floors) * ratios.roofPerFloor;
  const wall = wallById(state.wallId), win = winById(state.windowId), roof = roofById(state.roofId);
  const items = [
    { name: '外墙', detail: wall.name, area: wallA, price: wall.price, k: wall.k, base: baseline.wall },
    { name: '外窗', detail: win.name, area: winA, price: win.price, k: win.k, base: baseline.window },
    { name: '屋面', detail: roof.name, area: roofA, price: roof.price, k: roof.k, base: baseline.roof }
  ].map((it) => ({ ...it, cost: it.area * it.price }));
  const subtotal = items.reduce((s, i) => s + i.cost, 0);
  const contingency = subtotal * ratios.contingency;
  const total = subtotal + contingency;
  const uBefore = items.reduce((s, i) => s + i.base * i.area, 0) / items.reduce((s, i) => s + i.area, 0);
  const uAfter = items.reduce((s, i) => s + i.k * i.area, 0) / items.reduce((s, i) => s + i.area, 0);
  const drop = (1 - uAfter / uBefore) * 100;
  return { items, subtotal, contingency, total, perM2: total / state.area, uBefore, uAfter, drop, wallA, winA, roofA };
}

function conclusion(r) {
  const t = typeById(state.typeId), z = zoneById(state.zoneId), l = layoutById(state.layoutId);
  const wall = wallById(state.wallId), win = winById(state.windowId), roof = roofById(state.roofId);
  const lines = [];
  lines.push(`<b>管控底线：</b>${t.name}（${z.name}）。${t.limit}`);
  lines.push(`<b>本次做法：</b>外墙 - ${wall.name}；外窗 - ${win.name}；屋面 - ${roof.name}。围护平均传热系数由 ${r.uBefore.toFixed(2)} 降到 ${r.uAfter.toFixed(2)} W/(㎡·K)，降幅约 ${Math.round(r.drop)}%。`);
  lines.push(`<b>布局提示：</b>${l.name}体型系数 ${l.shape}，${l.id === 'court' ? '围合紧密、冬季失热少，但底层采光依赖庭院，建议优先处理北向与东西向房间。' : l.id === 'line' ? '进深小、采光好，两端山墙面积大，建议加强东西山墙保温。' : l.id === 'l' ? '转角房间有两个方向外墙，需加强保温与气密。' : '开口朝向影响院内通风与采光，建议结合院落开口方向安排窗位。'}`);
  const order = state.typeId === 'heritage' || state.typeId === 'historic'
    ? '文物与历史建筑优先做外窗与屋面内嵌保温，外墙内保温需先做防潮与冷桥处理。'
    : '一般改造可先换外窗（见效快、工期短），再做屋面与外墙保温。';
  lines.push(`<b>施工顺序：</b>${order}`);
  lines.push(`<b>还要现场确认：</b>实际面积与构造层次、外墙基层与潮湿情况、屋面木基层与檩条、门窗洞口尺寸与开启方式，以及外观改动是否需要报批。`);
  return lines.map((x) => `<p>${x}</p>`).join('');
}

function renderResult() {
  const r = compute();
  $('#sum-total').textContent = wan(r.total);
  $('#sum-per').textContent = `按建筑面积 ${state.area} ㎡ 计，约 ${Math.round(r.perM2)} 元/㎡（含 ${Math.round(ratios.contingency * 100)}% 不可预见费）`;
  $('#cost-body').innerHTML = r.items.map((i) => `
    <tr>
      <td>${i.name}</td>
      <td>${i.detail}</td>
      <td class="num">${Math.round(i.area)} ㎡</td>
      <td class="num">${i.price} 元/㎡</td>
      <td class="num">${wan(i.cost)} 万元</td>
    </tr>`).join('');
  $('#cost-foot').innerHTML = `
    <tr><td colspan="4">小计</td><td class="num">${wan(r.subtotal)} 万元</td></tr>
    <tr><td colspan="4">不可预见费（${Math.round(ratios.contingency * 100)}%）</td><td class="num">${wan(r.contingency)} 万元</td></tr>
    <tr><td colspan="4"><b>合计</b></td><td class="num"><b>${wan(r.total)} 万元</b></td></tr>`;
  $('#conclusion').innerHTML = conclusion(r);
  $('#param-line').textContent = `${typeById(state.typeId).name} · ${zoneById(state.zoneId).name} · ${layoutById(state.layoutId).name} · 建筑面积 ${state.area} ㎡ · ${state.floors} 层`;
}

function refresh() {
  renderTypes(); renderZones(); renderLayouts(); renderParts(); renderParams(); renderResult();
  $('#zone-warn').textContent = zoneWarning();
}

/* ---------- 案例 ---------- */
function caseSrc(id) {
  const m = caseMedia[id];
  return (m && m.cover) || '';
}
function renderCases() {
  $('#case-grid').innerHTML = cases.map((c) => `
    <article class="case-card">
      <img src="${caseSrc(c.id)}" alt="${c.name}实景" loading="lazy" referrerpolicy="no-referrer">
      <div class="case-body">
        <span class="loc">${c.location} · ${c.year} 年</span>
        <h3>${c.name}</h3>
        <p>${c.type}</p>
        <button class="go" data-case="${c.id}">看做法与图纸 →</button>
      </div>
    </article>`).join('');
}
function openCase(id) {
  const c = cases.find((x) => x.id === id);
  const m = caseMedia[id] || {};
  const gal = [{ src: m.cover, caption: '建成实景' }, ...(m.gallery || [])];
  const dlg = $('#case-dialog');
  $('#case-dialog-body').innerHTML = `
    <button class="close" data-close>关闭 ✕</button>
    <h2>${c.name}</h2>
    <p class="loc">${c.location} · ${c.year} 年建成 · ${c.designer}</p>
    <div class="gal" id="case-gal">${gal.map((g, i) => `<button data-gal="${i}" class="${i === 0 ? 'on' : ''}">${g.caption.split(/[，,©]/)[0]}</button>`).join('')}</div>
    <figure><img id="case-img" src="${gal[0].src}" alt="${c.name}" referrerpolicy="no-referrer"><figcaption id="case-cap">${gal[0].caption} · ${c.credit || ''}</figcaption></figure>
    <dl class="facts">
      <div><dt>建筑面积</dt><dd>${c.area}</dd></div>
      <div><dt>改造造价</dt><dd>公开资料未披露</dd></div>
      <div><dt>实测节能</dt><dd>公开资料未披露</dd></div>
      <div><dt>资料来源</dt><dd><a href="${c.source || '#'}" target="_blank" rel="noopener noreferrer">谷德设计网 ↗</a></dd></div>
    </dl>
    <h3>改之前</h3><p>${c.before}</p>
    <h3>改之后</h3><p>${c.after}</p>
    <h3>具体做法</h3><p>${c.practice.map(([t, x]) => `<b>${t}：</b>${x}`).join('<br>')}</p>
    <h3>可以借鉴什么</h3><p>${c.lesson}</p>
    <h3>适用边界</h3><p>${c.boundary}</p>`;
  dlg.showModal();
  $('#case-gal').addEventListener('click', (e) => {
    const b = e.target.closest('[data-gal]');
    if (!b) return;
    const i = Number(b.dataset.gal);
    $('#case-img').src = gal[i].src;
    $('#case-cap').textContent = `${gal[i].caption} · ${c.credit || ''}`;
    [...$('#case-gal').children].forEach((x) => x.classList.toggle('on', x === b));
  });
}

/* ---------- 材料库 ---------- */
function renderMaterials() {
  const rows = [
    ...wallOptions.map((o) => ['外墙', o.side === 'outer' ? '外保温' : '内保温', o.name.replace(/^.*· /, ''), o.price, o.fire, o.life, o.k]),
    ...windowOptions.map((o) => ['外窗', '断桥铝 + 玻璃', o.name, o.price, '—', '20 年', o.k]),
    ...roofOptions.map((o) => ['屋面', '保温 + 防水', o.name.replace(/^.*· /, ''), o.price, 'B1 级', '25 年', o.k])
  ];
  $('#mat-body').innerHTML = rows.map((r) => `
    <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="num">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="num">${r[6]}</td></tr>`).join('');
}

/* ---------- 导出 ---------- */
function exportCsv() {
  const r = compute();
  const head = ['部位', '做法', '面积(㎡)', '单价(元/㎡)', '金额(万元)'];
  const rows = r.items.map((i) => [i.name, i.detail, Math.round(i.area), i.price, wan(i.cost)]);
  rows.push(['小计', '', '', '', wan(r.subtotal)]);
  rows.push(['不可预见费', '', '', '', wan(r.contingency)]);
  rows.push(['合计', '', '', '', wan(r.total)]);
  const csv = [head, ...rows].map((x) => x.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  download('碳为观止_改造估算.csv', csv, 'text/csv;charset=utf-8');
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob(['\ufeff', content], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- 事件 ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;
  if (el.dataset.type) { state.typeId = el.dataset.type; keepValid(); refresh(); return; }
  if (el.dataset.zone) { state.zoneId = el.dataset.zone; refresh(); return; }
  if (el.dataset.layout) { state.layoutId = el.dataset.layout; refresh(); return; }
  if (el.dataset.wall) { if (el.classList.contains('off')) return; state.wallId = el.dataset.wall; refresh(); return; }
  if (el.dataset.window) { state.windowId = el.dataset.window; refresh(); return; }
  if (el.dataset.roof) { if (el.classList.contains('off')) return; state.roofId = el.dataset.roof; refresh(); return; }
  if (el.dataset.case) { openCase(el.dataset.case); return; }
  if (el.hasAttribute('data-close')) { $('#case-dialog').close(); return; }
  if (el.id === 'do-print') { window.print(); return; }
  if (el.id === 'do-csv') { exportCsv(); return; }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'area') {
    const v = Math.max(20, Math.min(2000, Number(e.target.value) || 0));
    state.area = v; renderResult();
  }
  if (e.target.id === 'floors') {
    const v = Math.max(1, Math.min(4, Number(e.target.value) || 1));
    state.floors = v; renderResult();
  }
});

function keepValid() {
  const t = typeById(state.typeId);
  if (!wallAllowed(wallById(state.wallId))) {
    state.wallId = wallOptions.find((o) => t.walls.includes(o.side)).id;
  }
  if (!roofAllowed(roofById(state.roofId))) {
    state.roofId = t.roofs[0];
  }
}

refresh();
renderCases();
renderMaterials();
