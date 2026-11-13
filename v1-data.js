// 1.0 数据：建筑分级、风貌管控、空间布局、部位材料
// 价格为单位面积参考价（元/㎡，含材料与常规人工），用于估算，不作为报价。

export const buildingTypes = [
  {
    id: 'heritage', name: '文物建筑', grade: '一级',
    desc: '本体受保护，改造以修缮为主，不动外观。',
    limit: '外墙与屋面外观不可改动；外窗可更换，但分格、颜色需与现状一致。',
    walls: ['inner'], roofs: ['roof-inner'], windowsAllowed: true, facadeLocked: true
  },
  {
    id: 'historic', name: '历史建筑', grade: '二级',
    desc: '有保护价值，可做性能提升，不改变风貌特征。',
    limit: '外墙不做外保温；屋面以修缮为前提做内嵌保温；外窗可换，样式需协调。',
    walls: ['inner'], roofs: ['roof-inner'], windowsAllowed: true, facadeLocked: true
  },
  {
    id: 'vernacular', name: '风貌建筑', grade: '—',
    desc: '老城常见院落住宅，允许改造外观，需与街区协调。',
    limit: '内外保温均可；屋面、外窗限制较少；材料颜色需与街区协调。',
    walls: ['inner', 'outer'], roofs: ['roof-flat', 'roof-slope', 'roof-inner'], windowsAllowed: true, facadeLocked: false
  },
  {
    id: 'modern', name: '现代建筑', grade: '—',
    desc: '非传统形制，按现行节能标准改造。',
    limit: '无历史风貌限制，按现行建筑节能标准选择做法。',
    walls: ['inner', 'outer'], roofs: ['roof-flat', 'roof-slope', 'roof-inner'], windowsAllowed: true, facadeLocked: false
  }
];

export const facadeZones = [
  { id: 'f1', name: '风貌一级', sub: '东大街等核心沿街', note: '严格管控层高、立面与材料类型，檐口高度不超过现状。' },
  { id: 'f2', name: '风貌二级', sub: '非核心沿街、远离主街', note: '维持 2–3 层，材料与颜色选择较自由。' },
  { id: 'f3', name: '现代类', sub: '不在历史管控范围', note: '不涉及老城历史风貌管控，按现行标准执行。' }
];

export const layouts = [
  { id: 'line', name: '一字型', form: '单排房间，前院后房', shape: 0.62, vent: 3, light: 4, note: '体形简单、施工方便，南北向进深小，采光好；东西山墙面积大，两端房间温差明显。' },
  { id: 'l', name: 'L 型', form: '两翼相接，转角围合', shape: 0.58, vent: 4, light: 4, note: '转角处易形成穿堂风，通风较好；转角房间有两个方向的外墙，需加强保温。' },
  { id: 'u', name: 'U 型', form: '三面围合，开口朝街', shape: 0.52, vent: 4, light: 3, note: '围合感强、体形系数较低；凹口处采光受遮挡，需注意开口朝向。' },
  { id: 'court', name: '口字型（合院）', form: '四面围合，中间庭院', shape: 0.48, vent: 3, light: 3, note: '体形系数最低，冬季失热少；庭院进深大，底层采光与自然通风依赖院内组织。' }
];

// 外墙：内保温 / 外保温
export const wallOptions = [
  { id: 'outer-eps', side: 'outer', name: '外保温 · 石墨聚苯板 50mm', price: 220, k: 0.55, fire: 'B1 级', life: '25 年', pros: '造价低、做法成熟、施工队伍多', cons: '需做防护与饰面，颜色要与街区协调' },
  { id: 'outer-xps', side: 'outer', name: '外保温 · 挤塑板 XPS 30mm', price: 265, k: 0.50, fire: 'B1 级', life: '30 年', pros: '保温性能好、厚度薄、强度高', cons: '透气性差，基层须平整干燥' },
  { id: 'outer-rock', side: 'outer', name: '外保温 · 岩棉板 80mm', price: 305, k: 0.45, fire: 'A 级', life: '25 年', pros: '防火性能最好，适合连片木构街区', cons: '吸水率高、自重大、单价高' },
  { id: 'inner-gypsum', side: 'inner', name: '内保温 · 复合石膏板 + 聚苯板 30mm', price: 155, k: 0.70, fire: 'B1 级', life: '20 年', pros: '不改变外观，施工快，可分层施工', cons: '占室内净空约 30mm，梁柱与楼板处有冷桥' },
  { id: 'inner-rock', side: 'inner', name: '内保温 · 岩棉板 50mm + 隔汽层', price: 195, k: 0.65, fire: 'A 级', life: '25 年', pros: '防火好，适合文物与历史建筑', cons: '占室内空间，需做好防潮隔汽' },
  { id: 'inner-aerogel', side: 'inner', name: '内保温 · 气凝胶保温砂浆 10mm', price: 285, k: 0.75, fire: 'A 级', life: '25 年', pros: '极薄，几乎不占室内空间', cons: '单价高，能施工的队伍较少' }
];

// 外窗：以断桥铝型材为基准，比较玻璃配置
export const windowOptions = [
  { id: 'w2', name: '双层中空玻璃 5+12A+5', price: 620, k: 2.8, pros: '常规配置，造价低、供货快', cons: '保温一般，西向房间夏季易过热' },
  { id: 'w2lowe', name: '双层中空 Low-E 玻璃 5+12A+5', price: 790, k: 2.0, pros: '保温与遮阳兼顾，性价比高', cons: 'Low-E 膜面朝向需按朝向确定' },
  { id: 'w3', name: '三玻两腔 Low-E 玻璃 5+9A+5+9A+5', price: 1060, k: 1.5, pros: '保温最好，临近主街隔声也好', cons: '单价高、自重较大，对窗洞与五金要求高' }
];

export const roofOptions = [
  { id: 'roof-flat', name: '平屋顶 · XPS 60mm + 防水层', price: 210, k: 0.40, pros: '做法成熟，可与屋面防水一次完成', cons: '需先查结构与排水，雨季不宜施工' },
  { id: 'roof-slope', name: '坡屋顶 · 挂瓦 + 保温层 60mm', price: 250, k: 0.42, pros: '保留灰瓦外观，保温与防水一并处理', cons: '需检查木基层与檩条，糟朽处先更换' },
  { id: 'roof-inner', name: '坡屋顶 · 屋架内嵌保温（修缮前提）', price: 180, k: 0.55, pros: '不改变瓦面外观，适合文物与历史建筑', cons: '檐口与山墙处易形成冷桥，需细致收口' }
];

// 现状基准（估算用）：单玻木窗、无保温青砖墙、无保温瓦屋面
export const baseline = { wall: 1.5, window: 4.5, roof: 1.2 };

// 面积估算比例（相对建筑面积）
export const ratios = { wall: 0.85, window: 0.15, roofPerFloor: 0.9, contingency: 0.12 };

export const defaults = { area: 120, floors: 2, typeId: 'vernacular', zoneId: 'f2', layoutId: 'court', wallId: 'outer-eps', windowId: 'w2lowe', roofId: 'roof-slope' };
