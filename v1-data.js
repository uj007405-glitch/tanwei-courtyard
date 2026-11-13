// 面向普通居民的数据：所有名称都用日常说法，专业参数留在后台换算成星级和档位。
// 价格是参考值（元/㎡，含材料与常规人工），不是施工报价。

export const buildingTypes = [
  {
    id: 'heritage', name: '受保护的老宅', tag: '文物建筑',
    desc: '房子本身是文物，动一寸都要审批。',
    plain: '只能在屋里想办法，外面不能动。外墙、屋顶的样子必须保持原样。',
    allow: { outer: false, roofChange: false, window: true },
    rules: ['外墙：只能从屋里加保温', '屋顶：只能修，瓦和外观不能改', '窗户：能换，但分格和颜色要跟原来一样']
  },
  {
    id: 'historic', name: '有年头的老房子', tag: '历史建筑',
    desc: '有保护价值，能改善居住，但外观要守住。',
    plain: '外观基本不动，主要靠屋里加保温、屋里加屋顶保温。',
    allow: { outer: false, roofChange: false, window: true },
    rules: ['外墙：只能从屋里加保温', '屋顶：修缮为主，保温做在屋里', '窗户：能换，样子要协调']
  },
  {
    id: 'vernacular', name: '老城里的普通老院', tag: '风貌建筑',
    desc: '老城最常见的那种院子，可以动手改。',
    plain: '屋里屋外都能加保温，屋顶也能重新做；颜色别跟邻居差太多。',
    allow: { outer: true, roofChange: true, window: true },
    rules: ['外墙：屋里屋外都行', '屋顶：平顶坡顶都能改', '窗户：随便换，颜色协调就行']
  },
  {
    id: 'modern', name: '后来盖的房子', tag: '现代建筑',
    desc: '不是老房子，按现在的节能标准改。',
    plain: '没有风貌限制，怎么保温好就怎么来。',
    allow: { outer: true, roofChange: true, window: true },
    rules: ['外墙：屋里屋外都行', '屋顶：按现行标准做', '窗户：随便换']
  }
];

export const facadeZones = [
  { id: 'f1', name: '就在主街上', sub: '东大街这类临街', plain: '管得最严：不能加高，外墙颜色、材料都要报批。' },
  { id: 'f2', name: '在主街后面的巷子里', sub: '非临街', plain: '管得松一些：保持两三层，材料颜色自己选。' },
  { id: 'f3', name: '不在老城保护范围', sub: '现代片区', plain: '不涉及老城风貌，按现行标准做就行。' }
];

// 院子形状：给普通人看的是图形和一句人话
export const layouts = [
  { id: 'line', name: '一排房', plain: '房子一字排开，前面是院子。', good: '采光最好，施工也最方便。', warn: '两头山墙面积大，冬天两头房间更冷。', warm: 3, path: 'M10 40 L90 40 L90 78 L10 78 Z' },
  { id: 'l', name: '拐个弯', plain: '两排房子拐角接在一起。', good: '转角容易有过堂风，夏天凉快。', warn: '拐角那间有两个方向的外墙，要多做保温。', warm: 4, path: 'M10 12 L46 12 L46 60 L90 60 L90 86 L10 86 Z' },
  { id: 'u', name: '三面围合', plain: '三面有房，一面朝街开口。', good: '挡风好，冬天比一排房暖和。', warn: '开口那侧采光差点，要注意朝向。', warm: 4, path: 'M10 12 L30 12 L30 62 L70 62 L70 12 L90 12 L90 86 L10 86 Z' },
  { id: 'court', name: '四面合院', plain: '四面都是房，中间一个小院。', good: '最保暖，冬天散热最少。', warn: '院子深，一楼采光和通风要靠院子组织。', warm: 5, path: 'M10 10 L90 10 L90 90 L10 90 Z M32 32 L68 32 L68 68 L32 68 Z' }
];

// 外墙：外面加 / 屋里加
export const wallOptions = [
  { id: 'outer-eps', side: 'outer', name: '外面包一层泡沫板（5 厘米）', price: 220, k: 0.55, fire: '不易燃', life: '约 25 年', days: '10–15 天', good: '最常见、最便宜', bad: '要搭架子，外墙颜色要跟邻居商量', stars: 4 },
  { id: 'outer-xps', side: 'outer', name: '外面包挤塑板（3 厘米，更薄）', price: 265, k: 0.50, fire: '不易燃', life: '约 30 年', days: '10–15 天', good: '同样保暖，占的厚度更小', bad: '要求墙面平整，价格略高', stars: 4 },
  { id: 'outer-rock', side: 'outer', name: '外面包岩棉（8 厘米，防火最好）', price: 305, k: 0.45, fire: '不燃', life: '约 25 年', days: '12–18 天', good: '防火最放心，适合连片木结构老院', bad: '重、怕水，价格最高', stars: 5 },
  { id: 'inner-gypsum', side: 'inner', name: '屋里贴一层保温板（3 厘米）', price: 155, k: 0.70, fire: '不易燃', life: '约 20 年', days: '7–10 天', good: '不动外墙，可以一间一间做', bad: '屋里每面墙薄 3 厘米，墙角容易返潮', stars: 3 },
  { id: 'inner-rock', side: 'inner', name: '屋里贴岩棉板（5 厘米）', price: 195, k: 0.65, fire: '不燃', life: '约 25 年', days: '8–12 天', good: '防火好，老宅里常用', bad: '占空间，还要做好防潮', stars: 3 },
  { id: 'inner-aerogel', side: 'inner', name: '屋里刷气凝胶保温砂浆（1 厘米）', price: 285, k: 0.75, fire: '不燃', life: '约 25 年', days: '5–8 天', good: '几乎不占地方，屋子不变小', bad: '价格贵，会做的师傅少', stars: 3 }
];

// 外窗：按玻璃分三档
export const windowOptions = [
  { id: 'w2', name: '普通双层玻璃', price: 620, k: 2.8, life: '约 20 年', days: '7–10 天', good: '便宜、到处都有', bad: '保暖一般，西晒房间夏天还是热', stars: 3 },
  { id: 'w2lowe', name: '隔热玻璃（Low-E）', price: 790, k: 2.0, life: '约 20 年', days: '7–10 天', good: '冬天保暖、夏天挡热，性价比最高', bad: '比普通玻璃贵一点', stars: 4 },
  { id: 'w3', name: '三层隔热玻璃', price: 1060, k: 1.5, life: '约 25 年', days: '10–14 天', good: '最保暖，靠街的房子还安静', bad: '贵、玻璃重，窗框要加固', stars: 5 }
];

// 屋顶
export const roofOptions = [
  { id: 'roof-flat', name: '平屋顶：顶上铺保温和防水', price: 210, k: 0.40, life: '约 25 年', days: '10–15 天', good: '一次把漏雨和保暖一起解决', bad: '要先查结构和排水，雨季不能做', stars: 5 },
  { id: 'roof-slope', name: '坡屋顶：换瓦时一起加保温', price: 250, k: 0.42, life: '约 25 年', days: '12–18 天', good: '灰瓦样子保留，保暖防水一起做', bad: '要先看木头梁和檩条，烂的要先换', stars: 5 },
  { id: 'roof-inner', name: '坡屋顶：只在屋里加，不动瓦', price: 180, k: 0.55, life: '约 25 年', days: '7–10 天', good: '屋顶外观完全不变，适合老宅', bad: '檐口、墙根容易有冷桥，收口要细', stars: 4 }
];

export const baseline = { wall: 1.5, window: 4.5, roof: 1.2 };
export const ratios = { wall: 0.85, window: 0.15, roofPerFloor: 0.9, contingency: 0.12 };
export const defaults = { area: 120, floors: 2, typeId: 'vernacular', zoneId: 'f2', layoutId: 'court', wallId: 'outer-eps', windowId: 'w2lowe', roofId: 'roof-slope' };
