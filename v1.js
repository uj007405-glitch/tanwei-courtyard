import { buildingTypes, facadeZones, layouts, wallOptions, windowOptions, roofOptions, baseline, ratios, defaults, houseModels } from './v1-data.js?v=20261113b';
import { cases } from './cases.js?v=20261113b';
import { caseMedia } from './case-media.js';

const $ = (s) => document.querySelector(s);
const wan = (n) => (n / 10000).toFixed(2);
const stars = (n) => '★★★★★'.slice(0, Math.max(1, Math.round(n))) + '☆☆☆☆☆'.slice(0, 5 - Math.max(1, Math.round(n)));
const money = (n) => Math.round(n).toLocaleString('zh-CN');

const state = { ...defaults };
const by = (arr, id) => arr.find((x) => x.id === id);

function allows() {
  const t = by(buildingTypes, state.typeId);
  return t.allow;
}
function wallOk(o) { return o.side === 'outer' ? allows().outer : true; }
function roofOk(o) { return allows().roofChange ? true : o.id === 'roof-inner'; }

function wallReason(o) {
  const t = by(buildingTypes, state.typeId);
  return o.side === 'outer' ? `${t.name}不能动外墙，只能从屋里加保温` : '这种情况不适合';
}
function roofReason() {
  const t = by(buildingTypes, state.typeId);
  return `${t.name}的屋顶只能修，保温做在屋里`;
}

/* ---------- 第一步 ---------- */
function renderTypes() {
  $('#types').innerHTML = buildingTypes.map((t) => `
    <button class="opt ${state.typeId === t.id ? 'on' : ''}" data-type="${t.id}">
      ${state.typeId === t.id ? '<span class="pick">已选</span>' : ''}
      <span class="k">${t.tag}</span>
      <h3>${t.name}</h3>
      <p class="d">${t.desc}</p>
      <p class="d" style="color:#8b958b;font-size:13px">${t.plain}</p>
    </button>`).join('');
}
function renderZones() {
  $('#zones').innerHTML = facadeZones.map((z) => `
    <button class="opt ${state.zoneId === z.id ? 'on' : ''}" data-zone="${z.id}">
      ${state.zoneId === z.id ? '<span class="pick">已选</span>' : ''}
      <span class="k">${z.sub}</span>
      <h3>${z.name}</h3>
      <p class="d">${z.plain}</p>
    </button>`).join('');
}

/* ---------- 第二步 ---------- */
function renderLayouts() {
  $('#layouts').innerHTML = layouts.map((l) => `
    <button class="opt ${state.layoutId === l.id ? 'on' : ''}" data-layout="${l.id}">
      ${state.layoutId === l.id ? '<span class="pick">已选</span>' : ''}
      <span class="svg"><svg viewBox="0 0 100 100" fill="none" stroke="#b9cdb6" stroke-width="3" stroke-linejoin="round"><path d="${l.path}"/></svg></span>
      <h3>${l.name}</h3>
      <p class="d">${l.plain}</p>
      <span class="tag ${l.warm >= 4 ? 'p' : ''}">保暖 ${'★'.repeat(l.warm)}${'☆'.repeat(5 - l.warm)}</span>
    </button>`).join('');
}

/* ---------- 第三步 ---------- */
function pick(kind, o, allowed, hot) {
  const key = kind === 'wall' ? 'wallId' : kind === 'window' ? 'windowId' : 'roofId';
  const on = state[key] === o.id;
  const attr = kind === 'wall' ? 'data-wall' : kind === 'window' ? 'data-window' : 'data-roof';
  return `
    <button class="opt ${on ? 'on' : ''} ${allowed ? '' : 'off'}" ${attr}="${o.id}">
      ${on && allowed ? '<span class="pick">已选</span>' : ''}
      ${hot && allowed && !on ? '<span class="tag w" style="position:absolute;top:15px;right:15px">最常选</span>' : ''}
      <h3>${o.name}</h3>
      <div class="row">
        <span class="tag p">保暖 ${'★'.repeat(o.stars)}${'☆'.repeat(5 - o.stars)}</span>
        <span class="tag">${money(o.price)} 元/㎡</span>
        <span class="tag">${o.life}</span>
      </div>
      <p class="d"><span style="color:#3f7a55">好：</span>${o.good}<br><span style="color:#a05a2c">注意：</span>${o.bad}</p>
      <div class="row"><span class="tag">工期 ${o.days}</span>${o.fire ? `<span class="tag">${o.fire}</span>` : ''}</div>
      ${allowed ? '' : `<p class="why">${kind === 'wall' ? wallReason(o) : roofReason()}</p>`}
    </button>`;
}
function renderParts() {
  const outer = allows().outer;
  $('#walls').innerHTML = wallOptions.map((o) => pick('wall', o, wallOk(o), o.id === (outer ? 'outer-eps' : 'inner-gypsum'))).join('');
  $('#windows').innerHTML = windowOptions.map((o) => pick('window', o, true, o.id === 'w2lowe')).join('');
  $('#roofs').innerHTML = roofOptions.map((o) => pick('roof', o, roofOk(o), o.id === (allows().roofChange ? 'roof-flat' : 'roof-inner'))).join('');
  $('#types-note').textContent = allows().window
    ? (by(buildingTypes, state.typeId).id === 'heritage' || by(buildingTypes, state.typeId).id === 'historic'
      ? '能换窗，但分格和颜色要跟原来一样。'
      : '窗户样式比较自由，颜色跟邻居协调就行。')
    : '窗户不能换。';
}

/* ---------- 算钱 ---------- */
function compute() {
  const wallA = state.area * ratios.wall;
  const winA = state.area * ratios.window;
  const roofA = (state.area / state.floors) * ratios.roofPerFloor;
  const w = by(wallOptions, state.wallId), wn = by(windowOptions, state.windowId), rf = by(roofOptions, state.roofId);
  const items = [
    { part: '外墙', o: w, area: wallA, base: baseline.wall },
    { part: '窗户', o: wn, area: winA, base: baseline.window },
    { part: '屋顶', o: rf, area: roofA, base: baseline.roof }
  ].map((x) => ({ ...x, cost: x.area * x.o.price }));
  const sub = items.reduce((s, i) => s + i.cost, 0);
  const extra = sub * ratios.contingency;
  const total = sub + extra;
  const u0 = items.reduce((s, i) => s + i.base * i.area, 0) / items.reduce((s, i) => s + i.area, 0);
  const u1 = items.reduce((s, i) => s + i.o.k * i.area, 0) / items.reduce((s, i) => s + i.area, 0);
  const days = items.reduce((s, i) => s + Number((i.o.days.match(/(\d+)\s*天\s*$/) || [0, 10])[1]), 0);
  const outerChanged = (w.side === 'outer') || rf.id !== 'roof-inner';
  return { items, sub, extra, total, per: total / state.area, drop: (1 - u1 / u0) * 100, days, outerChanged };
}

function renderResult() {
  const r = compute();
  const t = by(buildingTypes, state.typeId), z = by(facadeZones, state.zoneId), l = by(layouts, state.layoutId);
  $('#total').textContent = wan(r.total);
  $('#per').textContent = `按 ${state.area} ㎡ 算，每平米约 ${money(r.per)} 元（已含 12% 的意外预留）`;
  $('#chips').innerHTML = `
    <span class="chip">保暖提升约 ${Math.round(r.drop)}%</span>
    <span class="chip">施工合计约 ${r.days} 天</span>
    <span class="chip ${r.outerChanged ? 'b' : ''}">${r.outerChanged ? '会动外观，需要报批' : '外观基本不变'}</span>
    <span class="chip">${l.name} · ${l.warm >= 4 ? '本身就比较保暖' : '本身散热偏多'}</span>`;
  $('#rows').innerHTML = r.items.map((i) => `
    <div class="r">
      <span class="n">${i.part}</span>
      <span class="t">${i.o.name}<br><span style="font-size:12.5px;color:#93a094">约 ${Math.round(i.area)} ㎡ · ${i.o.price} 元/㎡</span></span>
      <span class="m">${wan(i.cost)} 万</span>
    </div>`).join('') + `
    <div class="r sum"><span class="n"></span><span class="t">小计</span><span class="m">${wan(r.sub)} 万</span></div>
    <div class="r"><span class="n"></span><span class="t">意外预留（12%，留着应付临时加项）</span><span class="m">${wan(r.extra)} 万</span></div>
    <div class="r sum"><span class="n"></span><span class="t">合计</span><span class="m" style="font-size:19px">${wan(r.total)} 万</span></div>`;

  const bullets = [];
  bullets.push(`你家是「${t.name}」，${z.name}。${z.plain}`);
  bullets.push(t.id === 'heritage' || t.id === 'historic'
    ? '外墙和屋顶不能动，钱主要花在换窗户和屋里加保温上。这两项做完，冬天屋里明显不一样。'
    : `${r.outerChanged ? '这次会动外观' : '这次不动外观'}，${r.outerChanged ? '施工前先去街道或主管部门问清楚要不要报批。' : '邻居基本看不出来，阻力小。'}`);
  bullets.push(`保暖提升约 ${Math.round(r.drop)}%：冬天屋里没那么阴冷，夏天顶层没那么闷。取暖费一般能省两三成。`);
  bullets.push(`工期合计约 ${r.days} 天，可以分开做：先换窗，再做屋顶，最后做外墙，中间不影响住人。`);
  $('#clist').innerHTML = bullets.map((b) => `<li>${b}</li>`).join('');

  $('#dockTotal').textContent = wan(r.total);
  $('#dockTip').textContent = `${t.name} · ${l.name} · ${state.area} ㎡`;
}

function refresh() {
  renderTypes(); renderZones(); renderLayouts(); renderParts(); renderResult();
  $('#area').value = state.area;
  $('#floors').value = state.floors;
}

/* ---------- 案例 ---------- */
function renderCases() {
  $('#cases-grid').innerHTML = cases.map((c) => `
    <article class="case">
      <img src="${(caseMedia[c.id] || {}).cover || ''}" alt="${c.name}" loading="lazy" referrerpolicy="no-referrer">
      <div class="b">
        <small>${c.location} · ${c.year} 年</small>
        <b>${c.name}</b>
        <p>${c.type}</p>
        <button class="go" data-case="${c.id}">看看怎么改的 →</button>
      </div>
    </article>`).join('');
}
function openCase(id) {
  const c = cases.find((x) => x.id === id);
  const m = caseMedia[id] || {};
  const gal = [{ src: m.cover, caption: '建成实景' }].concat(m.gallery || []);
  $('#dlgBody').innerHTML = `
    <button class="x" data-close>关闭 ✕</button>
    <h2>${c.name}</h2>
    <p class="loc">${c.location} · ${c.year} 年建成 · 设计：${c.designer}</p>
    <div class="gal" id="gal">${gal.map((g, i) => `<button data-gal="${i}" class="${i ? '' : 'on'}">${g.caption.split(/[，,©]/)[0]}</button>`).join('')}</div>
    <figure><img id="galImg" src="${gal[0].src}" alt="${c.name}" referrerpolicy="no-referrer"><figcaption id="galCap">${gal[0].caption} · ${c.credit || ''}</figcaption></figure>
    <dl class="kv">
      <div><dt>面积</dt><dd>${c.area}</dd></div>
      <div><dt>花了多少钱</dt><dd>没公开</dd></div>
      <div><dt>省了多少能</dt><dd>没公开</dd></div>
      <div><dt>资料出处</dt><dd><a href="${c.source || '#'}" target="_blank" rel="noopener noreferrer">谷德设计网 ↗</a></dd></div>
    </dl>
    <h3>改之前</h3><p>${c.before}</p>
    <h3>改之后</h3><p>${c.after}</p>
    <h3>具体做了哪几件事</h3><p>${c.practice.map(([a, b]) => `<b>${a}：</b>${b}`).join('<br>')}</p>
    <h3>哪些能抄，哪些不能</h3><p>${c.lesson}</p><p style="color:#8a958a">${c.boundary}</p>`;
  $('#dlg').showModal();
  $('#gal').addEventListener('click', (e) => {
    const b = e.target.closest('[data-gal]');
    if (!b) return;
    const i = Number(b.dataset.gal);
    $('#galImg').src = gal[i].src;
    $('#galCap').textContent = `${gal[i].caption} · ${c.credit || ''}`;
    Array.from($('#gal').children).forEach((x) => x.classList.toggle('on', x === b));
  });
}

/* ---------- 花钱参考 ---------- */
function renderMoney() {
  const row = (part, o) => `<tr><td>${part}</td><td>${o.name}</td><td>${money(o.price)}</td><td class="st">${'★'.repeat(o.stars)}</td><td>${o.life}</td></tr>`;
  $('#money-body').innerHTML = [
    ...wallOptions.map((o) => row('外墙', o)),
    ...windowOptions.map((o) => row('窗户', o)),
    ...roofOptions.map((o) => row('屋顶', o))
  ].join('');
}

/* ---------- 事件 ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.type) { state.typeId = b.dataset.type; keep(); refresh(); return; }
  if (b.dataset.zone) { state.zoneId = b.dataset.zone; refresh(); return; }
  if (b.dataset.layout) { state.layoutId = b.dataset.layout; refresh(); return; }
  if (b.dataset.wall) { if (b.classList.contains('off')) return; state.wallId = b.dataset.wall; refresh(); return; }
  if (b.dataset.window) { state.windowId = b.dataset.window; refresh(); return; }
  if (b.dataset.roof) { if (b.classList.contains('off')) return; state.roofId = b.dataset.roof; refresh(); return; }
  if (b.dataset.case) { openCase(b.dataset.case); return; }
  if (b.dataset.house) { showHouse(b.dataset.house); return; }
  if (b.id === 'btn-spin') {
    if (!mvEl) return;
    const on = mvEl.hasAttribute('auto-rotate');
    if (on) mvEl.removeAttribute('auto-rotate'); else mvEl.setAttribute('auto-rotate', '');
    b.classList.toggle('on', !on);
    b.textContent = on ? '自动旋转' : '停下旋转';
    return;
  }
  if (b.id === 'btn-reset') {
    if (!mvEl) return;
    mvEl.removeAttribute('camera-target');
    mvEl.setAttribute('camera-orbit', '35deg 62deg auto');
    return;
  }
  if (b.hasAttribute('data-close')) { $('#dlg').close(); return; }
  if (b.id === 'print') { window.print(); return; }
  if (b.id === 'csv') { exportCsv(); return; }
  if (b.id === 'goResult') { document.getElementById('result').scrollIntoView({ behavior: 'smooth' }); return; }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'area') {
    state.area = Math.max(20, Math.min(2000, Number(e.target.value) || 20));
    renderResult();
  }
  if (e.target.id === 'floors') {
    state.floors = Math.max(1, Math.min(4, Number(e.target.value) || 1));
    renderResult();
  }
});

function keep() {
  if (!wallOk(by(wallOptions, state.wallId))) state.wallId = allows().outer ? 'outer-eps' : 'inner-gypsum';
  if (!roofOk(by(roofOptions, state.roofId))) state.roofId = 'roof-inner';
}

window.addEventListener('scroll', () => {
  const r = document.getElementById('result').getBoundingClientRect();
  const show = window.scrollY > 500 && r.top > window.innerHeight * 0.6;
  document.querySelector('.dock').classList.toggle('show', show);
  document.body.classList.toggle('has-dock', show);
});

function exportCsv() {
  const r = compute();
  const rows = [['项目', '选的做法', '面积(㎡)', '单价(元/㎡)', '金额(万元)']];
  r.items.forEach((i) => rows.push([i.part, i.o.name, Math.round(i.area), i.o.price, wan(i.cost)]));
  rows.push(['小计', '', '', '', wan(r.sub)]);
  rows.push(['意外预留', '', '', '', wan(r.extra)]);
  rows.push(['合计', '', '', '', wan(r.total)]);
  const csv = rows.map((x) => x.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = '改造费用估算.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}



/* ---------- 三维模型 ---------- */
let mvEl = null, mvScriptLoaded = false, currentHouse = null;

function renderHouseChips() {
  $('#house-chips').innerHTML = houseModels.map((h) => `
    <button class="chip-btn ${currentHouse === h.code ? 'on' : ''}" data-house="${h.code}">${h.name}</button>`).join('');
}

function ensureMVScript(done) {
  if (mvScriptLoaded) { done(); return; }
  const s = document.createElement('script');
  s.type = 'module';
  s.src = 'assets/lib/model-viewer.min.js';
  s.onload = () => { mvScriptLoaded = true; done(); };
  s.onerror = () => { $('#viewerHint').textContent = '三维组件没加载出来，刷新一次试试'; };
  document.head.appendChild(s);
}

function buildViewer() {
  if (mvEl) return;
  mvEl = document.createElement('model-viewer');
  mvEl.setAttribute('camera-controls', '');
  mvEl.setAttribute('touch-action', 'pan-y');
  mvEl.setAttribute('shadow-intensity', '1');
  mvEl.setAttribute('shadow-softness', '1');
  mvEl.setAttribute('environment-image', 'neutral');
  mvEl.setAttribute('exposure', '0.95');
  mvEl.setAttribute('camera-orbit', '35deg 62deg auto');
  mvEl.setAttribute('interaction-prompt', 'none');
  mvEl.addEventListener('load', () => { const h = $('#viewerHint'); if (h) h.style.display = 'none'; });
  mvEl.addEventListener('error', () => {
    const h = $('#viewerHint');
    if (h) { h.style.display = 'grid'; h.textContent = '这个模型没加载出来，换一个看看'; }
  });
  $('#stage').appendChild(mvEl);
}

function showHouse(code) {
  const h = houseModels.find((x) => x.code === code) || houseModels[0];
  currentHouse = h.code;
  renderHouseChips();
  $('#viewerNote').textContent = h.note ? `${h.name}（${h.note}）· 模型由 SketchUp 文件导出` : `${h.name} · 模型由 SketchUp 文件导出`;
  const hint = $('#viewerHint');
  hint.style.display = 'grid';
  hint.textContent = '正在载入' + h.name + '…';
  ensureMVScript(() => {
    buildViewer();
    mvEl.removeAttribute('auto-rotate');
    $('#btn-spin').classList.remove('on');
    mvEl.setAttribute('camera-orbit', '35deg 62deg auto');
    mvEl.setAttribute('src', `assets/models/${h.code}.glb`);
  });
}

function initViewer() {
  renderHouseChips();
  const section = document.getElementById('models');
  if (!section) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !currentHouse) { showHouse('h11'); io.disconnect(); }
    });
  }, { rootMargin: '200px' });
  io.observe(section);
}

/* ---------- 启动 ---------- */
refresh();
renderCases();
renderMoney();
initViewer();
