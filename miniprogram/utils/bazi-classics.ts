/**
 * 八字典籍详论：《三命通会》《千里命稿》《子平真诠》《穷通宝鉴》
 */
import type { DaYunItem, LiuNianItem } from './health'
import type { BaziPillarResult } from './bazi-pillar'

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const TIANGAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水'
}
const DIZHI_WUXING: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
}
const WUXING_SHENG: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
}
const WUXING_KE: Record<string, string> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木'
}
const SHISHEN: Record<string, string[]> = {
  甲: ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  乙: ['劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印'],
  丙: ['偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官'],
  丁: ['正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀'],
  戊: ['七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财'],
  己: ['正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财'],
  庚: ['偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官'],
  辛: ['正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神'],
  壬: ['食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财'],
  癸: ['伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩']
}

const MONTH_SEASON: Record<string, 'spring' | 'summer' | 'autumn' | 'winter' | 'earth'> = {
  寅: 'spring', 卯: 'spring', 巳: 'summer', 午: 'summer',
  申: 'autumn', 酉: 'autumn', 亥: 'winter', 子: 'winter',
  辰: 'earth', 未: 'earth', 戌: 'earth', 丑: 'earth'
}

export interface DaYunClassicItem {
  ageRange: string
  ganZhi: string
  shiShen: string
  theme: string
  detail: string
  caution: string
}

export interface LiuNianClassicItem {
  year: number
  ganZhi: string
  shiShen: string
  theme: string
  detail: string
  relationToDaYun: string
}

export interface SanMingQianLiAnalysis {
  summary: string
  qiYunTheory: string
  jiaoTuoYun: string
  daYunItems: DaYunClassicItem[]
  liuNianItems: LiuNianClassicItem[]
  decadeTrend: string
  lifeStages: string[]
  cautions: string[]
}

export interface ZiPingZhenQuanAnalysis {
  geJuName: string
  yongShen: string
  xiangShen: string
  tiYong: string
  chengGe: string
  poGeRisk: string
  qingZhuo: string
  shunNi: string
  yunXi: string
  yunJi: string
  social: string
  marriage: string
  classicTheory: string
}

export interface QiongTongBaoJianAnalysis {
  climateDesc: string
  hanNuan: string
  diaoHou: string
  xiJi: string
  wuXingFavor: string
  wuXingAvoid: string
  tiaoHouYao: string
  practical: string[]
  classicQuote: string
}

export interface BaziClassicsBundle {
  sanMingQianLi: SanMingQianLiAnalysis
  ziPingZhenQuan: ZiPingZhenQuanAnalysis
  qiongTongBaoJian: QiongTongBaoJianAnalysis
}

export interface ClassicsAnalysisInput {
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string
  wuxingCount: Record<string, number>
  xiyongShen: string
  startAge: number
  qiYunDesc: string
  daYun: DaYunItem[]
  liuNian: LiuNianItem[]
  pillars: BaziPillarResult
}

function getShiShen(dayGan: string, targetGan: string): string {
  const idx = TIANGAN.indexOf(targetGan)
  if (idx < 0) return '不明'
  return SHISHEN[dayGan]?.[idx] || '不明'
}

function countShenQiang(
  dayGan: string,
  allGans: string[],
  allZhis: string[]
): { score: number; label: string } {
  const dayWx = TIANGAN_WUXING[dayGan]
  let score = 0
  const help = (wx: string) =>
    wx === dayWx || WUXING_SHENG[wx] === dayWx

  allGans.forEach((g) => {
    if (help(TIANGAN_WUXING[g])) score += 1
  })
  allZhis.forEach((z) => {
    const wx = DIZHI_WUXING[z]
    if (wx === dayWx) score += 0.8
    else if (WUXING_SHENG[wx] === dayWx) score += 0.5
  })

  if (score >= 3.5) return { score, label: '身强' }
  if (score >= 2.2) return { score, label: '中和偏强' }
  if (score >= 1.2) return { score, label: '中和偏弱' }
  return { score, label: '身弱' }
}

function yunXiJi(dayGan: string, shenLabel: string): { xi: string[]; ji: string[] } {
  const dayWx = TIANGAN_WUXING[dayGan]
  const sheng = Object.keys(WUXING_SHENG).find((k) => WUXING_SHENG[k] === dayWx) || ''
  const bei = dayWx
  const xie = WUXING_SHENG[dayWx]
  const cai = WUXING_KE[dayWx]
  const guan = Object.keys(WUXING_KE).find((k) => WUXING_KE[k] === dayWx) || ''

  if (shenLabel.includes('强')) {
    return { xi: [xie, cai, guan].filter(Boolean), ji: [bei, sheng].filter(Boolean) }
  }
  return { xi: [bei, sheng].filter(Boolean), ji: [guan, cai, xie].filter(Boolean) }
}

/** 《穷通宝鉴》调候纲要（按日干×月令季候） */
const QIONGTONG_CORE: Record<string, Record<string, string>> = {
  甲: {
    spring: '春木当令，甲木乘旺。《穷通宝鉴》云：春月之木，渐离寒谷，犹有余寒，非丙火不暖。喜丙火照暖、癸水滋润，忌金重克伐。',
    summer: '夏月木性枯焦，须水滋润、金修剪。《穷通宝鉴》以夏木喜壬癸亥子，忌火炎土燥。',
    autumn: '秋月金旺克木，木气凋零。喜丁火制金、甲木助身，或水木相生；忌独金独土逼迫。',
    winter: '冬月寒木，根冻叶枯。最要丙火解冻、庚金劈甲引丁，佐以戊土制水；忌水多木漂。',
    earth: '季月土厚，木气被埋。喜甲木疏通、癸水润根、丙火泄秀；忌土重金压。'
  },
  乙: {
    spring: '春月乙木，藤萝系甲，柔而能刚。喜丙火暖局、癸水滋根，忌金伐过重。',
    summer: '夏月乙木，火旺木焚。喜湿土培根、壬癸调候，忌炎燥无润。',
    autumn: '秋月乙木，金气当令。喜丙火制金、水木相滋，忌官杀混杂克身。',
    winter: '冬月乙木，寒湿凝滞。喜丙火、戊土，忌水多木寒无火。',
    earth: '季月乙木，土旺木折。喜木疏土、水润，忌财星破印。'
  },
  丙: {
    spring: '春月丙火，木火通明。喜壬水既济、庚金发源，忌木多火塞。',
    summer: '夏月丙火，炎威炽盛。《穷通宝鉴》最重壬水、庚金，所谓“火无西向之辉”。',
    autumn: '秋月丙火，土金泄耗。喜甲木引丁、壬水辅光，忌土晦火光。',
    winter: '冬月丙火，太阳失辉。最要甲木、戊土，忌水多火灭。',
    earth: '季月丙火，土重晦火。喜木疏土、壬水润泽，忌厚土埋光。'
  },
  丁: {
    spring: '春月丁火，木火相生。喜庚金劈甲引丁、壬水既济，忌木盛火塞。',
    summer: '夏月丁火，灯烛易焚。喜壬癸、庚金，忌炎土燥烈。',
    autumn: '秋月丁火，金旺火囚。喜甲木、丙火，忌金多火熄。',
    winter: '冬月丁火，寒凝光弱。最要甲木、庚金，忌水多无木。',
    earth: '季月丁火，土厚火晦。喜木疏土、金生水，忌湿土埋火。'
  },
  戊: {
    spring: '春月戊土，土虚木疏。喜丙火暖土、甲木疏土，忌木重克土。',
    summer: '夏月戊土，火炎土燥。喜壬癸润土、庚金泄秀，忌火土两旺。',
    autumn: '秋月戊土，金泄土虚。喜丙火生土、丁火暖局，忌水多土荡。',
    winter: '冬月戊土，寒湿凝滞。最要丙火、甲木，忌水冷土冻无火。',
    earth: '季月戊土，土旺用事。喜甲木疏劈、金泄水润，忌土重金埋。'
  },
  己: {
    spring: '春月己土，湿泥养木。喜丙火暖局、癸水滋润，忌木重克身。',
    summer: '夏月己土，火炎土燥。喜壬癸、庚金，忌火土亢极。',
    autumn: '秋月己土，金泄土虚。喜丙火、丁火，忌水多土崩。',
    winter: '冬月己土，寒泥冻结。最要丙火解冻，忌水多无火。',
    earth: '季月己土，土旺当权。喜木疏金泄，忌比劫夺财。'
  },
  庚: {
    spring: '春月庚金，金寒木旺。喜丁火炼金、甲木引丁，忌木多金缺。',
    summer: '夏月庚金，火炎金熔。最要壬癸、戊土，忌火土逼金。',
    autumn: '秋月庚金，金气刚锐。喜丁火锻炼、甲木引丁，忌金多无火。',
    winter: '冬月庚金，金寒水冷。喜丙火、戊土，忌水多金沉。',
    earth: '季月庚金，土厚埋金。喜木疏土、水洗淘，忌土重金埋。'
  },
  辛: {
    spring: '春月辛金，金弱木盛。喜己土滋养、壬水淘洗、丙火暖局，忌木重金缺。',
    summer: '夏月辛金，火烈金伤。喜壬癸、己土，忌火炎无润。',
    autumn: '秋月辛金，珠玉当令。喜壬水淘洗、甲木引丁，忌土厚埋金。',
    winter: '冬月辛金，金寒水冷。最要丙火、戊土，忌水多金寒。',
    earth: '季月辛金，土厚金埋。喜木疏土、水洗，忌土重火晦。'
  },
  壬: {
    spring: '春月壬水，水得木泄。喜庚金发源、戊土堤防，忌木多水缩。',
    summer: '夏月壬水，火土当权。喜庚辛金生、壬水助身，忌火土亢燥。',
    autumn: '秋月壬水，金白水清。喜甲木泄秀、丙火既济，忌土重金塞。',
    winter: '冬月壬水，水旺极寒。喜丙火、戊土，忌水多泛滥无制。',
    earth: '季月壬水，土旺克水。喜金生水、木疏土，忌土重水浊。'
  },
  癸: {
    spring: '春月癸水，雨露滋木。喜辛金发源、丙火暖局，忌木多水干。',
    summer: '夏月癸水，火炎水涸。最要庚辛金、壬亥水助，忌土火逼身。',
    autumn: '秋月癸水，金白水清。喜丙火、甲木，忌土厚水浊。',
    winter: '冬月癸水，阴水至旺。喜丙火、戊土，忌水多木漂无火。',
    earth: '季月癸水，土旺水浊。喜金生水、木疏土，忌土重埋金。'
  }
}

function analyzeQiongTongBaoJian(input: ClassicsAnalysisInput): QiongTongBaoJianAnalysis {
  const { dayGan, monthZhi, wuxingCount, xiyongShen } = input
  const season = MONTH_SEASON[monthZhi] || 'earth'
  const core = QIONGTONG_CORE[dayGan]?.[season] || '依月令寒暖燥湿，察日主强弱，以调候为先，用神次之。'

  const sorted = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1])
  const wang = sorted[0]
  const ruo = sorted[sorted.length - 1]

  const hanNuan =
    season === 'winter'
      ? '命局偏寒，寒气未除，宜火暖局为第一要务。'
      : season === 'summer'
        ? '命局偏燥，炎夏当权，宜水润泽、金生发。'
        : season === 'earth'
          ? '季月湿土或燥土交杂，寒暖需看透干之火水而定。'
          : '当令之气尚正，寒暖较为平和，以格局用神为主、调候为辅。'

  const xiElements = xiyongShen ? [xiyongShen] : []
  const jiElement = WUXING_KE[xiyongShen] || ''

  return {
    climateDesc: `日主${dayGan}（${TIANGAN_WUXING[dayGan]}）生于${monthZhi}月，属${season === 'spring' ? '春' : season === 'summer' ? '夏' : season === 'autumn' ? '秋' : season === 'winter' ? '冬' : '四季'}令气候。五行旺者${wang[0]}（${wang[1]}个），弱者${ruo[0]}（${ruo[1]}个）。`,
    hanNuan,
    diaoHou: core,
    xiJi: `《穷通宝鉴》论命以气候调候为先：喜${xiElements.join('、') || '依格局用神'}生助日主、调和寒暖；忌${jiElement || '过旺之五行'}加重偏枯。`,
    wuXingFavor: `宜补${xiElements.join('、') || xiyongShen}：颜色、方位、行业可取对应五行；尤重${season === 'winter' ? '火' : season === 'summer' ? '水' : '木火金水平衡'}调候。`,
    wuXingAvoid: `忌${jiElement}过旺或${wang[0]}再叠，致格局偏枯；过寒过燥之年月须格外留意。`,
    tiaoHouYao:
      season === 'winter'
        ? '冬月先取丙火，无火则木寒金冷、水冻土坚，纵有财官亦难发越。'
        : season === 'summer'
          ? '夏月先取壬水，无水则火炎土燥、金熔木焚，宜润下以济炎上。'
          : '春秋宜察金木交战或木土相制，以火通关、以水润根最为紧要。',
    practical: [
      `日常宜亲近${xiyongShen}属性环境（方位、色彩、行业）`,
      `大运流年见调候用神（${season === 'winter' ? '丙丁' : season === 'summer' ? '壬癸' : '水火既济'}）则运势易开`,
      `忌长期处${wang[0]}过旺之地或从事加重偏枯之行当`,
      '养生上顺应四时：春养肝、夏养心、秋养肺、冬养肾，配合命局寒暖调理'
    ],
    classicQuote:
      '《穷通宝鉴》总论：“五行之气，始于一而终于一，生克循环，皆所以成其变化。论命者以月令为纲领，察气候之寒暖燥湿，然后辨用神之得失。”'
  }
}

function judgeGeJuZiPing(
  dayGan: string,
  monthZhi: string,
  allGans: string[]
): { name: string; yong: string; xiang: string } {
  const monthGan = allGans[1]
  const mgShen = getShiShen(dayGan, monthGan)
  const touMonth = allGans.filter((g, i) => i !== 2 && getShiShen(dayGan, g) === mgShen)

  if (mgShen === '正官' || mgShen === '七杀') {
    return {
      name: mgShen === '正官' ? '正官格' : '七杀格',
      yong: mgShen === '正官' ? '正官' : '七杀',
      xiang: mgShen === '正官' ? '印星或财星' : '食神或印星'
    }
  }
  if (mgShen === '正财' || mgShen === '偏财') {
    return { name: mgShen === '正财' ? '正财格' : '偏财格', yong: mgShen, xiang: '比劫或食伤' }
  }
  if (mgShen === '正印' || mgShen === '偏印') {
    return { name: mgShen === '正印' ? '正印格' : '偏印格', yong: mgShen, xiang: '官杀或比劫' }
  }
  if (mgShen === '食神' || mgShen === '伤官') {
    return { name: mgShen === '食神' ? '食神格' : '伤官格', yong: mgShen, xiang: '财星或印星' }
  }
  if (touMonth.length > 0) {
    return { name: `${mgShen}格（透干）`, yong: mgShen, xiang: '视强弱取印比或财官' }
  }
  return { name: '杂气格/普通格局', yong: '日主', xiang: '月令所藏透干' }
}

function analyzeZiPingZhenQuan(input: ClassicsAnalysisInput): ZiPingZhenQuanAnalysis {
  const { dayGan, monthZhi, monthGan, yearGan, hourGan, wuxingCount } = input
  const allGans = [yearGan, monthGan, dayGan, hourGan]
  const allZhis = [input.yearZhi, monthZhi, input.dayZhi, input.hourZhi]
  const { label: shenLabel } = countShenQiang(dayGan, allGans, allZhis)
  const { xi, ji } = yunXiJi(dayGan, shenLabel)
  const ge = judgeGeJuZiPing(dayGan, monthZhi, allGans)

  const chengGe =
    shenLabel.includes('强') && (ge.yong === '食神' || ge.yong === '伤官' || ge.yong.includes('财'))
      ? '身强能任财官食伤，格局有发越之机；若透印比过多则成格不纯。'
      : shenLabel.includes('弱') && (ge.yong.includes('印') || ge.yong === '比肩')
        ? '身弱得印比生扶，格局可成；最忌财星坏印、官杀攻身无制。'
        : '中和之命，成格与否全看用神是否得力、是否受冲克合害。'

  const poGe =
    ji.some((j) => wuxingCount[j] >= 3)
      ? `忌神${ji.filter((j) => wuxingCount[j] >= 3).join('、')}偏旺，易破格或减福。`
      : '破格之险在于大运流年冲克用神、或忌神叠见。'

  return {
    geJuName: ge.name,
    yongShen: `用神取「${ge.yong}」：${ge.yong.includes('官') ? '以官星立名分、规范行事' : ge.yong.includes('财') ? '以财星养命、务实进取' : ge.yong.includes('印') ? '以印星护身、学识贵人' : ge.yong.includes('食') || ge.yong.includes('伤') ? '以食伤泄秀、才华外露' : '扶抑日主'}。`,
    xiangShen: `相神取「${ge.xiang}」：辅佐用神，使格局流通有情；无相神则用神孤露，层次受限。`,
    tiYong: `《子平真诠》论体用：以日主为体，月令${ge.yong}为用。当前日主${shenLabel}，体用${shenLabel.includes('强') ? '宜泄耗' : '宜生扶'}。`,
    chengGe,
    poGeRisk: poGe,
    qingZhuo:
      allGans.filter((g) => getShiShen(dayGan, g) === ge.yong).length >= 2
        ? '清气：用神透干有根，格局清纯。'
        : '浊气：官杀混杂、财印相战或食伤见官，宜取其一为用，余者制化。',
    shunNi: shenLabel.includes('强')
      ? '顺用：身强顺泄耗（食伤、财星、官杀），不宜再助。'
      : '逆用：身弱逆生扶（印比），不宜再克泄。',
    yunXi: `行运喜${xi.join('、')}：大运流年见印星、比劫（身弱）或食伤财官（身强）则顺。`,
    yunJi: `行运忌${ji.join('、')}：忌神当道则阻滞，宜守不宜攻。`,
    social: ge.yong.includes('官')
      ? '官星为用：宜公职、管理、法律、体制内有发展；为人重名誉责任。'
      : ge.yong.includes('财')
        ? '财星为用：宜商业、金融、实业；重实际利益与资源配置。'
        : '印绶为用：宜学术、教育、文化、咨询；贵人多在师长上级。',
    marriage:
      ge.yong.includes('财')
        ? '男命以财为妻星，女命以官为夫星；财旺身弱则因财致累，宜先固本。'
        : '官印相生主贵气，夫荣妻贵；伤官见官则感情易有波折，宜修性养德。',
    classicTheory:
      '《子平真诠》云：“八字用神，专求月令，以日干配月令地支，而生克不同，格局遂分。”又云：“用神既立，则凡生助用神者皆为相神；克害用神者皆为忌神。”故格局之成，在用神之得力与否。'
  }
}

function analyzeDaYunItem(
  dy: DaYunItem,
  dayGan: string,
  shenLabel: string,
  xi: string[],
  ji: string[]
): { theme: string; detail: string; caution: string } {
  const shen = getShiShen(dayGan, dy.gan)
  const ganWx = TIANGAN_WUXING[dy.gan]
  const zhiWx = DIZHI_WUXING[dy.zhi]
  const isXi = xi.includes(ganWx) || xi.includes(zhiWx)
  const isJi = ji.includes(ganWx) || ji.includes(zhiWx)

  let theme = ''
  if (isXi) theme = '吉运'
  else if (isJi) theme = '慎运'
  else theme = '平运'

  let detail = `《千里命稿》论大运：${dy.gan}${dy.zhi}，天干${shen}。`
  if (shen.includes('印') || shen.includes('比')) {
    detail += shenLabel.includes('弱')
      ? '印比助身，利于学习、积累、得贵人，宜进取。'
      : '印比过旺，易惰性、竞争多，宜防比劫夺财。'
  } else if (shen.includes('财')) {
    detail += shenLabel.includes('强')
      ? '财星当运，宜经商投资、把握财源。'
      : '财多身弱，劳而无功，宜合作谨慎投资。'
  } else if (shen.includes('官') || shen.includes('杀')) {
    detail += shenLabel.includes('强')
      ? '官杀制身，宜职位晋升、担当重任。'
      : '官杀攻身，压力大是非多，宜守成修身。'
  } else if (shen.includes('食') || shen.includes('伤')) {
    detail += '食伤泄秀，宜技艺表达、创作开拓；忌伤官见官。'
  }

  detail += `《三命通会》以大运干支纳音与日主五行生克参断：${ganWx}${zhiWx}运，${isXi ? '生助喜用' : isJi ? '助长忌神' : '中性'}。`

  const caution = isJi
    ? '此运忌冲动重大决策、诉讼投资；注意健康与人际。'
    : isXi
      ? '虽为吉运，亦忌骄躁；交运前后两年宜稳。'
      : '平运守成，宜充实内功，待机而动。'

  return { theme, detail, caution }
}

function analyzeLiuNianClassic(
  ln: LiuNianItem,
  dayGan: string,
  currentDy: DaYunItem | undefined,
  shenLabel: string
): { theme: string; detail: string; relation: string } {
  const shen = ln.shiShen || getShiShen(dayGan, ln.gan)
  const yearWx = TIANGAN_WUXING[ln.gan]
  let theme = `${ln.year}年 · ${shen}`

  let detail = `流年${ln.gan}${ln.zhi}，十神${shen}。`
  if (shen === '比肩' || shen === '劫财') detail += '主竞争合作、变动破财，宜分财合伙。'
  else if (shen.includes('财')) detail += '主财缘机遇、务实奔波，宜理财。'
  else if (shen.includes('官')) detail += '主事业名声、责任压力，宜守法。'
  else if (shen.includes('印')) detail += '主学习贵人、房产文书，宜进修。'
  else if (shen.includes('食') || shen.includes('伤')) detail += '主表达创作、感情波动，宜低调。'

  if (shenLabel.includes('弱') && (shen.includes('印') || shen.includes('比'))) {
    detail += '身弱逢印比，为扶身之年，可积极争取。'
  } else if (shenLabel.includes('强') && (shen.includes('财') || shen.includes('官'))) {
    detail += '身强逢财官，为发越之年，可拓展事业。'
  }

  let relation = ''
  if (currentDy) {
    const dyShen = getShiShen(dayGan, currentDy.gan)
    if (ln.gan === currentDy.gan) relation = '流年天干与大运天干同，力量叠见，该年事机明显。'
    else if (WUXING_SHENG[yearWx] === TIANGAN_WUXING[currentDy.gan]) {
      relation = '流年生助大运，运势顺遂。'
    } else if (WUXING_KE[yearWx] === TIANGAN_WUXING[currentDy.gan]) {
      relation = '流年克制大运，该年易有转折。'
    } else relation = `大运${currentDy.gan}${currentDy.zhi}（${dyShen}）与流年${ln.gan}${ln.zhi}（${shen}）配合，宜结合喜忌细断。`
  }

  return { theme, detail, relation }
}

function analyzeSanMingQianLi(input: ClassicsAnalysisInput): SanMingQianLiAnalysis {
  const { dayGan, daYun, liuNian, startAge, qiYunDesc, pillars } = input
  const allGans = [input.yearGan, input.monthGan, dayGan, input.hourGan]
  const allZhis = [input.yearZhi, input.monthZhi, input.dayZhi, input.hourZhi]
  const { label: shenLabel } = countShenQiang(dayGan, allGans, allZhis)
  const { xi, ji } = yunXiJi(dayGan, shenLabel)

  const nowYear = new Date().getFullYear()
  const birthYear = nowYear - (daYun[0]?.startAge || startAge || 1) + 1
  const currentAge = nowYear - birthYear + 1
  const currentDy = daYun.find((d) => currentAge >= d.startAge && currentAge <= d.endAge)

  const daYunItems: DaYunClassicItem[] = daYun.map((dy) => {
    const { theme, detail, caution } = analyzeDaYunItem(dy, dayGan, shenLabel, xi, ji)
    return {
      ageRange: `${dy.startAge}-${dy.endAge}岁`,
      ganZhi: `${dy.gan}${dy.zhi}`,
      shiShen: getShiShen(dayGan, dy.gan),
      theme,
      detail,
      caution
    }
  })

  const liuNianItems: LiuNianClassicItem[] = liuNian.map((ln) => {
    const { theme, detail, relation } = analyzeLiuNianClassic(ln, dayGan, currentDy, shenLabel)
    return {
      year: ln.year,
      ganZhi: `${ln.gan}${ln.zhi}`,
      shiShen: ln.shiShen || getShiShen(dayGan, ln.gan),
      theme,
      detail,
      relationToDaYun: relation
    }
  })

  const goodDy = daYunItems.filter((d) => d.theme === '吉运').length
  const lifeStages = [
    `童年至青年（1-${daYun[2]?.startAge || 25}岁）：根基阶段，受家庭与早期大运影响最深。`,
    `壮年（${daYun[2]?.startAge || 25}-${daYun[6]?.endAge || 55}岁）：事业财富主运期，宜把握吉运开拓。`,
    `中老年（${daYun[6]?.endAge || 55}岁后）：宜守成传承，注重健康与名望。`
  ]

  return {
    summary: `依《三命通会》纳音生克与《千里命稿》大运法则：日主${dayGan}命造${shenLabel}，${qiYunDesc}。十步大运中约${goodDy}步为喜用方向，流年当随大运喜忌而断，不可单流年独论。`,
    qiYunTheory:
      `《千里命稿》云：“命好不如运好。”起运${startAge}岁前后，${pillars.qiYun.forward ? '顺行' : '逆行'}大运，交运前后三年多波动，宜稳慎。${qiYunDesc}`,
    jiaoTuoYun:
      '交脱大运之年，旧气未脱、新气初交，常有环境、职业、心境之变。《三命通会》亦强调“运限相逢，须看冲合”。交运年宜：少重大投资、少诉讼、多修身、注意父母健康。',
    daYunItems,
    liuNianItems,
    decadeTrend: currentDy
      ? `当前${currentAge}岁行${currentDy.gan}${currentDy.zhi}大运（${currentDy.startAge}-${currentDy.endAge}岁），${analyzeDaYunItem(currentDy, dayGan, shenLabel, xi, ji).detail}`
      : '请结合当前年龄对应大运论断。',
    lifeStages,
    cautions: [
      '大运吉时仍忌骄躁冒进；大运凶时宜蛰伏进修',
      '流年冲克日主或用神之年，注意健康与是非',
      '财旺之年防投资过度；官杀之年宜守法守分',
      '《千里命稿》：命虽好，运不顺，亦主沉浮'
    ]
  }
}

export function analyzeBaziClassics(input: ClassicsAnalysisInput): BaziClassicsBundle {
  return {
    sanMingQianLi: analyzeSanMingQianLi(input),
    ziPingZhenQuan: analyzeZiPingZhenQuan(input),
    qiongTongBaoJian: analyzeQiongTongBaoJian(input)
  }
}
