/**
 * 中医症状诊断：《黄帝内经》《难经》《伤寒杂病论》《神农本草经》
 */

export interface SymptomItem {
  id: string
  category: string
  name: string
  description: string
  organ: string
  pattern: string
}

export interface SymptomResult {
  symptoms: string[]
  analysis: string
  suggestions: string[]
  bodyPartReports: BodyPartReport[]
  organReports: OrganReport[]
  classicAnalysis: ClassicReport[]
  patternSummary: string
  conclusion: string
  lifestyleAdvice: string[]
  dietAdvice: string[]
  caution: string
}

export interface BodyPartReport {
  partId: string
  partName: string
  symptoms: string[]
  meridian: string
  analysis: string
  classicQuote: string
}

export interface OrganReport {
  organ: string
  wuxing: string
  status: string
  relatedSymptoms: string[]
  theory: string
}

export interface ClassicReport {
  book: string
  title: string
  content: string
}

export const SYMPTOM_CATEGORIES = [
  { id: 'head', name: '头面', icon: '🧠' },
  { id: 'eyes', name: '目', icon: '👁' },
  { id: 'ears', name: '耳', icon: '👂' },
  { id: 'nose', name: '鼻', icon: '👃' },
  { id: 'throat', name: '咽喉', icon: '🗣' },
  { id: 'neck', name: '颈项', icon: '🦴' },
  { id: 'chest', name: '胸肺', icon: '🫁' },
  { id: 'heart', name: '心胸', icon: '❤️' },
  { id: 'abdomen', name: '腹部', icon: '🫃' },
  { id: 'loin', name: '腰肾', icon: '🦴' },
  { id: 'limb_upper', name: '上肢', icon: '💪' },
  { id: 'limb_lower', name: '下肢', icon: '🦵' },
  { id: 'skin', name: '肌肤', icon: '✨' },
  { id: 'emotion', name: '情志', icon: '🧘' },
  { id: 'general', name: '全身', icon: '🌡' }
]

const CATEGORY_META: Record<
  string,
  { meridian: string; organ: string; intro: string; huangdi: string }
> = {
  head: {
    meridian: '督脉、膀胱经、胆经',
    organ: '肝、肾',
    intro: '头为诸阳之会，髓海所居。',
    huangdi: '《素问·脉要精微论》："头者，精明之府。"头眩、头痛多与肝阳、肾精、气血相关。'
  },
  eyes: {
    meridian: '肝经、肾经',
    organ: '肝、肾',
    intro: '肝开窍于目，目得血而能视。',
    huangdi: '《灵枢·脉度》："肝气通于目，肝和则目能辨五色矣。"'
  },
  ears: {
    meridian: '胆经、肾经',
    organ: '肾、胆',
    intro: '肾开窍于耳，耳者宗脉之所聚。',
    huangdi: '《素问·金匮真言论》："南方赤色，入通于心，其窍于耳。"（肾主耳，历代注家多从肾论耳病）'
  },
  nose: {
    meridian: '肺经',
    organ: '肺',
    intro: '肺开窍于鼻，鼻为肺之门户。',
    huangdi: '《素问·金匮真言论》："西方白色，入通于肺，其窍于鼻。"'
  },
  throat: {
    meridian: '肺经、胃经、少阴经',
    organ: '肺、胃、肾',
    intro: '咽喉为肺胃之门户，亦与肾脉相关。',
    huangdi: '《灵枢·忧患无言》论及咽喉发声与经脉贯通。'
  },
  neck: {
    meridian: '膀胱经、胆经、小肠经',
    organ: '肝、膀胱',
    intro: '颈项属太阳、少阳，易为风寒湿邪所客。',
    huangdi: '《素问·骨空论》论颈项强痛，多与太阳经气不利有关。'
  },
  chest: {
    meridian: '肺经、任脉',
    organ: '肺',
    intro: '胸为肺之府，主气司呼吸。',
    huangdi: '《素问·咳论》："五脏六腑皆令人咳，非独肺也。"胸满、咳喘须辨表里寒热。'
  },
  heart: {
    meridian: '心经、心包经',
    organ: '心',
    intro: '心主血脉，藏神，为君主之官。',
    huangdi: '《素问·灵兰秘典论》："心者，君主之官也，神明出焉。"'
  },
  abdomen: {
    meridian: '脾胃经、任脉',
    organ: '脾、胃',
    intro: '脾胃为中焦，气血生化之源。',
    huangdi: '《素问·六元正纪大论》："胃者，太仓之官，五味出焉。"腹胀泄泻多责之脾胃。'
  },
  loin: {
    meridian: '肾经、膀胱经',
    organ: '肾',
    intro: '腰为肾之府，肾主骨生髓。',
    huangdi: '《素问·脉要精微论》："腰者，肾之府，转摇不能，肾将惫矣。"'
  },
  limb_upper: {
    meridian: '肺心脾经（手三阴三阳）',
    organ: '肺、心、脾',
    intro: '上肢麻木无力，多从气血、痰湿、肝风论治。',
    huangdi: '《素问·痹论》论痹在于筋、在于肉，与气血运行相关。'
  },
  limb_lower: {
    meridian: '肝肾经（足三阴三阳）',
    organ: '肝、肾、脾',
    intro: '下肢为肝肾所主，易见寒湿、血虚、肾虚。',
    huangdi: '《素问·厥论》论下肢寒厥、热厥，须辨阴阳虚实。'
  },
  skin: {
    meridian: '肺主皮毛',
    organ: '肺、脾',
    intro: '肺主皮毛，脾主肌肉，肌肤病多涉肺脾湿热。',
    huangdi: '《素问·至真要大论》："诸湿肿满，皆属于脾；诸痛痒疮，皆属于心。"（疮痒多从风热湿毒论）'
  },
  emotion: {
    meridian: '肝经、心经',
    organ: '肝、心',
    intro: '七情内伤，直中脏腑。',
    huangdi: '《素问·举痛论》："怒则气上，喜则气缓，悲则气消……"情志失调可致气机紊乱。'
  },
  general: {
    meridian: '全身经络气血',
    organ: '整体',
    intro: '全身症状须四诊合参，辨表里寒热虚实。',
    huangdi: '《素问·生气通天论》："阴平阳秘，精神乃治。"'
  }
}

export const SYMPTOMS: SymptomItem[] = [
  { id: 'head-1', category: 'head', name: '头痛', description: '前额、两侧或巅顶疼痛', organ: '肝', pattern: '肝阳上扰/气血瘀滞' },
  { id: 'head-2', category: 'head', name: '头晕', description: '头重脚轻、天旋地转', organ: '肝、脾', pattern: '痰湿中阻/肝阳上亢' },
  { id: 'head-3', category: 'head', name: '失眠多梦', description: '入睡困难、易醒多梦', organ: '心、肝', pattern: '心脾两虚/阴虚火旺' },
  { id: 'head-4', category: 'head', name: '健忘', description: '记忆力下降、神疲', organ: '心、肾', pattern: '心肾不交/髓海不足' },
  { id: 'head-5', category: 'head', name: '头胀', description: '头部胀满压迫感', organ: '肝', pattern: '肝郁气滞' },
  { id: 'face-1', category: 'head', name: '面色萎黄', description: '面色无华、萎黄', organ: '脾', pattern: '脾虚血虚' },
  { id: 'face-2', category: 'head', name: '面红潮热', description: '颧红、午后潮热', organ: '肾', pattern: '阴虚内热' },
  { id: 'eyes-1', category: 'eyes', name: '目干涩', description: '眼干少泪、视物模糊', organ: '肝、肾', pattern: '肝肾阴虚' },
  { id: 'eyes-2', category: 'eyes', name: '目赤肿痛', description: '眼红灼热、疼痛', organ: '肝', pattern: '肝火上炎' },
  { id: 'eyes-3', category: 'eyes', name: '视物昏花', description: '视力减退、眼前发黑', organ: '肝、肾', pattern: '精血不足' },
  { id: 'eyes-4', category: 'eyes', name: '迎风流泪', description: '遇风流泪、目痒', organ: '肝、肺', pattern: '风热犯目' },
  { id: 'ears-1', category: 'ears', name: '耳鸣', description: '耳中蝉鸣、嗡嗡作响', organ: '肾、肝', pattern: '肾精亏虚/肝火上扰' },
  { id: 'ears-2', category: 'ears', name: '耳聋', description: '听力下降', organ: '肾', pattern: '肾虚髓亏' },
  { id: 'ears-3', category: 'ears', name: '耳胀闭塞', description: '耳内胀闷、闭塞感', organ: '胆、肝', pattern: '肝胆湿热' },
  { id: 'nose-1', category: 'nose', name: '鼻塞流涕', description: '鼻塞、清涕或浊涕', organ: '肺', pattern: '风寒/风热犯肺' },
  { id: 'nose-2', category: 'nose', name: '鼻干衄血', description: '鼻腔干燥、出血', organ: '肺', pattern: '肺热阴虚' },
  { id: 'nose-3', category: 'nose', name: '嗅觉减退', description: '闻不到气味', organ: '肺、脾', pattern: '肺气虚弱' },
  { id: 'throat-1', category: 'throat', name: '咽痛', description: '咽喉疼痛、吞咽不适', organ: '肺、胃', pattern: '肺胃热毒/阴虚' },
  { id: 'throat-2', category: 'throat', name: '咽干', description: '咽喉干燥、欲饮', organ: '肺、肾', pattern: '阴虚津亏' },
  { id: 'throat-3', category: 'throat', name: '咽痒咳嗽', description: '咽痒即咳、干咳少痰', organ: '肺', pattern: '风邪犯肺' },
  { id: 'throat-4', category: 'throat', name: '声音嘶哑', description: '声低或嘶哑', organ: '肺、肾', pattern: '肺肾阴虚' },
  { id: 'neck-1', category: 'neck', name: '颈项强痛', description: '颈部僵硬疼痛', organ: '膀胱', pattern: '太阳经输不利' },
  { id: 'neck-2', category: 'neck', name: '颈肩酸痛', description: '颈肩沉重酸痛', organ: '肝、脾', pattern: '气血瘀滞' },
  { id: 'chest-1', category: 'chest', name: '胸闷', description: '胸部憋闷、呼吸不畅', organ: '肺', pattern: '气机郁滞/痰阻' },
  { id: 'chest-2', category: 'chest', name: '咳嗽', description: '咳声、有痰或无痰', organ: '肺', pattern: '外感或内伤咳嗽' },
  { id: 'chest-3', category: 'chest', name: '气短', description: '呼吸短促、动则加剧', organ: '肺、肾', pattern: '肺肾气虚' },
  { id: 'chest-4', category: 'chest', name: '痰多', description: '咯痰量多、色白或黄', organ: '脾、肺', pattern: '痰湿蕴肺' },
  { id: 'heart-1', category: 'heart', name: '心悸', description: '心跳不宁、惊惕不安', organ: '心', pattern: '心血不足/痰火扰心' },
  { id: 'heart-2', category: 'heart', name: '怔忡', description: '心悸较重、不能自主', organ: '心', pattern: '心气虚怯' },
  { id: 'heart-3', category: 'heart', name: '胸痛', description: '胸骨后或心前区疼痛', organ: '心', pattern: '心血瘀阻' },
  { id: 'abdomen-1', category: 'abdomen', name: '腹胀', description: '脘腹胀满、嗳气', organ: '脾、胃', pattern: '食滞气滞' },
  { id: 'abdomen-2', category: 'abdomen', name: '腹泻', description: '便溏、次数增多', organ: '脾', pattern: '脾虚湿盛' },
  { id: 'abdomen-3', category: 'abdomen', name: '便秘', description: '大便干结、排便困难', organ: '大肠、脾', pattern: '肠胃燥热/气虚' },
  { id: 'abdomen-4', category: 'abdomen', name: '食欲不振', description: '纳差、不思饮食', organ: '脾、胃', pattern: '脾胃虚弱' },
  { id: 'abdomen-5', category: 'abdomen', name: '胃脘灼痛', description: '胃中灼热疼痛', organ: '胃', pattern: '胃热阴虚' },
  { id: 'abdomen-6', category: 'abdomen', name: '反酸嗳气', description: '酸水上泛、嗳气腐臭', organ: '胃、肝', pattern: '肝胃不和' },
  { id: 'loin-1', category: 'loin', name: '腰痛', description: '腰部酸痛、屈伸不利', organ: '肾', pattern: '肾虚腰痛' },
  { id: 'loin-2', category: 'loin', name: '腰酸膝软', description: '腰膝无力、酸软', organ: '肾', pattern: '肾精不足' },
  { id: 'loin-3', category: 'loin', name: '夜尿频多', description: '夜间小便次数增多', organ: '肾', pattern: '肾阳不足' },
  { id: 'loin-4', category: 'loin', name: '畏寒肢冷', description: '怕冷、手足不温', organ: '肾', pattern: '阳虚寒盛' },
  { id: 'limb_upper-1', category: 'limb_upper', name: '手臂麻木', description: '上肢麻木、感觉减退', organ: '肝、脾', pattern: '气血两虚/风痰' },
  { id: 'limb_upper-2', category: 'limb_upper', name: '肩背酸痛', description: '肩背拘急疼痛', organ: '膀胱', pattern: '经脉痹阻' },
  { id: 'limb_upper-3', category: 'limb_upper', name: '手臂无力', description: '抬举费力、肌肉萎缩', organ: '脾、肺', pattern: '气虚肌痿' },
  { id: 'limb_lower-1', category: 'limb_lower', name: '下肢浮肿', description: '脚踝小腿浮肿', organ: '脾、肾', pattern: '水湿内停' },
  { id: 'limb_lower-2', category: 'limb_lower', name: '膝关节痛', description: '膝部肿痛、屈伸不利', organ: '肝、肾', pattern: '寒湿痹阻' },
  { id: 'limb_lower-3', category: 'limb_lower', name: '足跟疼痛', description: '足跟痛、站立加重', organ: '肾', pattern: '肾虚骨弱' },
  { id: 'limb_lower-4', category: 'limb_lower', name: '下肢沉重', description: '双腿沉重、行走乏力', organ: '脾', pattern: '湿邪困脾' },
  { id: 'skin-1', category: 'skin', name: '皮肤干燥', description: '皮肤干痒脱屑', organ: '肺、血', pattern: '血虚风燥' },
  { id: 'skin-2', category: 'skin', name: '皮肤瘙痒', description: '遍身或局部瘙痒', organ: '肺、脾', pattern: '血虚生风/湿热' },
  { id: 'skin-3', category: 'skin', name: '痤疮粉刺', description: '面部红疹粉刺', organ: '肺、胃', pattern: '肺胃湿热' },
  { id: 'skin-4', category: 'skin', name: '湿疹疮疡', description: '皮疹水疱、渗液', organ: '脾、肝', pattern: '湿热蕴肤' },
  { id: 'emotion-1', category: 'emotion', name: '易怒烦躁', description: '性情急躁、易发火', organ: '肝', pattern: '肝郁化火' },
  { id: 'emotion-2', category: 'emotion', name: '抑郁寡欢', description: '情绪低落、胸闷叹息', organ: '肝', pattern: '肝气郁结' },
  { id: 'emotion-3', category: 'emotion', name: '焦虑不安', description: '紧张多思、心神不宁', organ: '心、脾', pattern: '心脾两虚' },
  { id: 'emotion-4', category: 'emotion', name: '善太息', description: '常叹气、胸胁胀', organ: '肝', pattern: '肝失疏泄' },
  { id: 'general-1', category: 'general', name: '乏力倦怠', description: '神疲乏力、少气懒言', organ: '脾、肺', pattern: '气虚' },
  { id: 'general-2', category: 'general', name: '自汗盗汗', description: '白天汗出或夜间盗汗', organ: '心、肾', pattern: '卫表不固/阴虚' },
  { id: 'general-3', category: 'general', name: '潮热颧红', description: '午后发热、面颊发红', organ: '肾', pattern: '阴虚内热' },
  { id: 'general-4', category: 'general', name: '畏寒喜暖', description: '全身怕冷、喜温', organ: '肾', pattern: '阳虚' },
  { id: 'general-5', category: 'general', name: '身体困重', description: '身重如裹、嗜睡', organ: '脾', pattern: '湿邪困脾' }
]

const SYMPTOM_DETAIL: Record<string, { analysis: string; shanghan?: string; bencao?: string; nanjing?: string }> = {
  'head-1': {
    analysis: '头痛可因外感风寒风热，或内伤肝阳、血虚、瘀血。巅顶痛多肝，前额痛多胃，两侧痛多肝，后脑痛多肾。',
    shanghan: '《伤寒论》辨头痛与太阳、阳明、少阳经证相关，须分经论治。',
    nanjing: '《难经》论头痛与经络气血运行有关。'
  },
  'head-2': {
    analysis:
      '头晕因于痰湿中阻则头重如裹；肝阳上亢则眩晕易怒；气血亏虚则晕而乏力。《灵枢·卫气》："邪气中人……清湿之气，命曰濡，首如裹。"',
    nanjing: '《难经》以经络气血论眩晕。'
  },
  'head-3': {
    analysis: '失眠多梦，心血不足则易惊多梦；阴虚火旺则心烦不眠；肝郁化火则梦多纷纭。',
    shanghan: '《金匮要略》酸枣仁汤、黄连阿胶汤等可为辨证参考。'
  },
  'chest-2': {
    analysis: '咳嗽为肺系主症。《素问》有五脏六腑皆令人咳之论，须辨寒热虚实、痰饮燥火。',
    shanghan: '《伤寒论》论太阳伤寒、少阳、饮停等咳嗽治法。'
  },
  'abdomen-2': {
    analysis: '腹泻多因脾虚湿盛，或肾阳不足，或食滞胃肠。暴泻多实，久泻多虚。',
    shanghan: '《伤寒论》葛根芩连汤、四逆汤等，当辨寒热下利。'
  },
  'loin-1': {
    analysis:
      '腰痛，《内经》以肾虚为本，亦可因寒湿、瘀血、劳损。《素问·脉要精微论》："腰者，肾之府，转摇不能，肾将惫矣。"'
  },
  'emotion-1': {
    analysis:
      '怒则气上，肝气上逆则易怒头痛、面红目赤。《素问·举痛论》："怒则气上，喜则气缓，悲则气消，恐则气下……"'
  },
  'general-1': {
    analysis: '乏力倦怠为气虚主症，肺脾气虚则少气懒言、食少便溏。《素问·通评虚实论》："精气夺则虚。"'
  }
}

const ORGAN_WUXING: Record<string, string> = {
  心: '火',
  肝: '木',
  脾: '土',
  肺: '金',
  肾: '水',
  胃: '土（腑）',
  胆: '木（腑）',
  膀胱: '水（腑）',
  大肠: '金（腑）',
  整体: '—'
}

function getSymptomById(id: string): SymptomItem | undefined {
  return SYMPTOMS.find((s) => s.id === id)
}

function buildSymptomLine(s: SymptomItem): string {
  const detail = SYMPTOM_DETAIL[s.id]
  let line = `• ${s.name}：${s.description}。病位${s.organ}，辨证倾向「${s.pattern}」。`
  if (detail?.analysis) line += detail.analysis
  if (detail?.shanghan) line += detail.shanghan
  return line + '\n'
}

function countOrgans(selected: SymptomItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  selected.forEach((s) => {
    s.organ.split('、').forEach((o) => {
      const key = o.trim()
      if (key) counts[key] = (counts[key] || 0) + 1
    })
  })
  return counts
}

function inferMainPattern(selected: SymptomItem[]): string {
  const patterns = selected.map((s) => s.pattern)
  const text = patterns.join(' ')
  if (/虚|不足|气虚|血虚|阴虚|阳虚|肾虚|脾虚/.test(text)) {
    if (/火|热|阳亢|湿热/.test(text)) return '虚实夹杂（本虚标实）'
    return '以虚证为主（正气不足）'
  }
  if (/湿|痰|困|滞/.test(text)) return '以痰湿、气机阻滞为主'
  if (/火|热|阳亢|湿热/.test(text)) return '以实热、湿热为主'
  if (/瘀|痹|阻/.test(text)) return '以瘀血、经络痹阻为主'
  if (/风|外感|寒/.test(text)) return '以外感或风邪相关为主'
  return '气机失调，须结合四诊进一步辨证'
}

function buildOrganReports(selected: SymptomItem[]): OrganReport[] {
  const counts = countOrgans(selected)
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const organTheory: Record<string, string> = {
    心: '《素问·灵兰秘典论》："心者，君主之官也，神明出焉。"主血脉、藏神。心悸失眠等多涉于心。',
    肝: '《素问·灵兰秘典论》："肝者，将军之官，谋虑出焉。"主疏泄、藏血、开窍于目。情志、头眩、胁痛多涉肝。',
    脾: '《素问·灵兰秘典论》："脾者，谏议之官，五味出焉。"主运化、统血。腹胀泄泻、乏力多涉脾。',
    肺: '《素问·灵兰秘典论》："肺者，相傅之官，治节出焉。"主气、司呼吸、通调水道。咳喘、鼻塞多涉肺。',
    肾: '《素问·灵兰秘典论》："肾者，作强之官，伎巧出焉。"主藏精、主骨生髓、开窍于耳及二阴。腰痛耳鸣、畏寒多涉肾。',
    胃: '《素问》胃为太仓，与脾同居中焦。胃脘痛、呕恶、纳差多涉胃。',
    膀胱: '太阳膀胱经，主表。颈项强痛、小便异常可涉膀胱经气。'
  }

  return sorted.map(([organ, count]) => {
    const related = selected.filter((s) => s.organ.includes(organ)).map((s) => s.name)
    let status = '受累较轻'
    if (count >= 4) status = '受累较重，宜重点调治'
    else if (count >= 2) status = '受累中等，需兼顾调理'

    return {
      organ,
      wuxing: ORGAN_WUXING[organ] || '—',
      status,
      relatedSymptoms: related,
      theory: organTheory[organ] || `《黄帝内经》脏腑相关理论指出，${organ}与所选症状相关，宜结合四诊合参。`
    }
  })
}

function buildClassicReports(selected: SymptomItem[], pattern: string): ClassicReport[] {
  const reports: ClassicReport[] = [
    {
      book: '黄帝内经',
      title: '四诊合参与整体观念',
      content:
        '《素问·脉要精微论》："夫病之将生也，必先见于色脉。"望闻问切合参，不可单凭症状臆断。《素问·生气通天论》："阴平阳秘，精神乃治。"调理当求阴阳平衡。您当前症状倾向：' +
        pattern +
        '。'
    },
    {
      book: '难经',
      title: '经络与脏腑相关',
      content:
        '《难经》阐发经络、脏腑、脉诊要旨。所选调护部位涉及多经，说明气血运行或有所滞，宜疏通经脉、调和脏腑。一难论脉，二难论尺寸，临床可参脉象以印证。'
    },
    {
      book: '伤寒杂病论',
      title: '辨证论治与方药思路',
      content:
        '《伤寒论》《金匮要略》立六经辨证、脏腑辨证之基。外感宜辨太阳阳明少阳；内伤宜辨虚实寒热。咳嗽、下利、胸痹、失眠等，书中均有相应治法可参考，须由医师据证选方。'
    },
    {
      book: '神农本草经',
      title: '药食同源与调养',
      content:
        '《神农本草经》载药物性味归经。上药养命，中药养性，下药治病。调养宜遵"药食同源"：气虚用甘温，阴虚用甘润，湿热用苦寒淡渗，痰湿用辛温燥湿（须在专业指导下应用）。'
    }
  ]

  if (selected.some((s) => s.category === 'chest' || s.id.startsWith('chest'))) {
    reports.push({
      book: '伤寒杂病论',
      title: '肺系症状补充',
      content:
        '《金匮要略·肺痿肺痈咳嗽上气病脉证治》论咳嗽、上气、胸满。若痰白清稀多寒饮，痰黄黏稠多热痰，宜分证施治。'
    })
  }

  return reports
}

function buildLifestyleAndDiet(selected: SymptomItem[], pattern: string): {
  lifestyle: string[]
  diet: string[]
  caution: string
} {
  const lifestyle: string[] = [
    '作息规律，子时（23点前）入睡以养肝胆，午时小憩以养心',
    '适度运动如八段锦、散步，以微汗为度，勿过劳',
    '保持情绪舒畅，怒伤肝、思伤脾，宜疏泄有度'
  ]
  const diet: string[] = []
  const organs = countOrgans(selected)

  if (organs['脾'] >= 2 || /湿|痰|腹胀|腹泻/.test(pattern)) {
    diet.push('健脾祛湿：薏米、山药、茯苓、扁豆；少食生冷油腻甜食')
  }
  if (organs['肝'] >= 2 || /肝|郁|怒|晕/.test(pattern)) {
    diet.push('疏肝理气：玫瑰花、陈皮、佛手代茶饮；忌酗酒、熬夜')
  }
  if (organs['肾'] >= 2 || /肾|腰酸|畏寒|夜尿/.test(pattern)) {
    diet.push('补肾益精：黑芝麻、核桃、枸杞、山药；畏寒者可适量羊肉、生姜（阴虚火旺者慎用）')
  }
  if (organs['肺'] >= 2 || /咳|鼻|咽/.test(pattern)) {
    diet.push('润肺护肺：百合、银耳、梨；戒烟，避风寒粉尘')
  }
  if (organs['心'] >= 2 || /心悸|失眠|焦虑/.test(pattern)) {
    diet.push('养心安神：莲子、百合、酸枣仁；晚餐不宜过饱，睡前少饮茶咖啡')
  }
  if (diet.length === 0) {
    diet.push('饮食有节，五谷为养，五果为助，五畜为益，五菜为充')
    diet.push('寒热适中，勿偏嗜一味，以护脾胃为要')
  }

  const caution =
    '本分析依据《黄帝内经》《难经》《伤寒杂病论》《神农本草经》等典籍理论，结合您所选症状归纳，仅供养生参考，不能替代医师面诊与处方。症状持续、加重或出现胸痛、高热、便血等，请及时就医。'

  return { lifestyle, diet, caution }
}

export function analyzeSymptoms(symptomIds: string[]): SymptomResult {
  const selected = symptomIds
    .map(getSymptomById)
    .filter((s): s is SymptomItem => !!s)

  if (selected.length === 0) {
    return {
      symptoms: [],
      analysis: '请选择症状以便进行分析。',
      suggestions: [],
      bodyPartReports: [],
      organReports: [],
      classicAnalysis: [],
      patternSummary: '',
      conclusion: '',
      lifestyleAdvice: [],
      dietAdvice: [],
      caution: ''
    }
  }

  const symptomNames = selected.map((s) => s.name)
  const patternSummary = inferMainPattern(selected)
  const bodyPartReports: BodyPartReport[] = []

  SYMPTOM_CATEGORIES.forEach((cat) => {
    const partSymptoms = selected.filter((s) => s.category === cat.id)
    if (partSymptoms.length === 0) return

    const meta = CATEGORY_META[cat.id]
    let analysis = `${meta.intro}\n${meta.huangdi}\n\n【所选症状辨析】\n`
    partSymptoms.forEach((s) => {
      analysis += buildSymptomLine(s)
    })

    bodyPartReports.push({
      partId: cat.id,
      partName: cat.name,
      symptoms: partSymptoms.map((s) => s.name),
      meridian: meta.meridian,
      analysis,
      classicQuote: meta.huangdi
    })
  })

  const organReports = buildOrganReports(selected)
  const classicAnalysis = buildClassicReports(selected, patternSummary)
  const { lifestyle, diet, caution } = buildLifestyleAndDiet(selected, patternSummary)

  let analysisText = '【中医四部经典合参分析】\n\n'
  analysisText += `《黄帝内经》整体审察：您共选取 ${selected.length} 项症状，涉及 ${bodyPartReports.length} 个部位，辨证概要：${patternSummary}。\n\n`

  bodyPartReports.forEach((p) => {
    analysisText += `▶ ${p.partName}（${p.meridian}）\n${p.analysis}\n`
  })

  analysisText += '\n【脏腑相关】\n'
  organReports.forEach((o) => {
    analysisText += `• ${o.organ}（${o.wuxing}）：${o.status}。${o.theory}\n`
  })

  const suggestions: string[] = [...lifestyle.slice(0, 2), ...diet.slice(0, 2)]

  let conclusion = ''
  const n = selected.length
  if (n <= 2) {
    conclusion =
      '《素问·上古天真论》强调顺应自然、饮食有节。您当前所选症状较少，整体偏颇不显，宜保持良好作息，顺应四时节气调养。'
  } else if (n <= 6) {
    conclusion =
      `据四诊合参思路，您的情况以「${patternSummary}」为主。宜在专业中医师指导下，结合脉象舌象进一步辨证选方，勿自行长期服药。`
  } else {
    conclusion =
      `症状涉及多部位、多脏腑，属「${patternSummary}」之复杂证候。《伤寒论》强调辨证论治，建议尽早就医，系统调理，勿延误。`
  }

  conclusion +=
    '\n\n《神农本草经》云："上药养命，中药养性，下药治病。"日常以养为先，病重则治，标本兼治方为善治。'

  return {
    symptoms: symptomNames,
    analysis: analysisText,
    suggestions,
    bodyPartReports,
    organReports,
    classicAnalysis,
    patternSummary,
    conclusion,
    lifestyleAdvice: lifestyle,
    dietAdvice: diet,
    caution
  }
}
