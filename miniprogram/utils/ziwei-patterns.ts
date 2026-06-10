/**
 * 紫微斗数格局判定
 */
import type { PalaceName, StarSlot } from './ziwei-stars'
import { fixIndex } from './ziwei-stars'

export interface PatternResult {
  name: string
  type: '吉格' | '凶格' | '特殊格'
  description: string
  source: string
}

interface PalaceData {
  name: PalaceName
  index: number
  majorStars: StarSlot[]
  minorStars: StarSlot[]
}

function allStars(p: PalaceData): string[] {
  return [...p.majorStars, ...p.minorStars].map((s) => s.name)
}

function hasStar(p: PalaceData, ...names: string[]): boolean {
  const stars = allStars(p)
  return names.every((n) => stars.includes(n))
}

function hasAnyStar(p: PalaceData, ...names: string[]): boolean {
  const stars = allStars(p)
  return names.some((n) => stars.includes(n))
}

function getPalace(palaces: PalaceData[], name: PalaceName): PalaceData | undefined {
  return palaces.find((p) => p.name === name)
}

function getOpposite(palaces: PalaceData[], palace: PalaceData): PalaceData {
  return palaces[fixIndex(palace.index + 6)]
}

/** 三方四正宫位 */
function getSurrounded(palaces: PalaceData[], palace: PalaceData): PalaceData[] {
  const idx = palace.index
  return [
    palace,
    palaces[fixIndex(idx + 4)],
    palaces[fixIndex(idx + 8)],
    palaces[fixIndex(idx + 6)]
  ]
}

export function detectPatterns(palaces: PalaceData[]): PatternResult[] {
  const patterns: PatternResult[] = []
  const ming = getPalace(palaces, '命宫')
  const guan = getPalace(palaces, '官禄')
  const cai = getPalace(palaces, '财帛')
  const qian = getPalace(palaces, '迁移')

  if (!ming) return patterns

  const mingMajors = ming.majorStars.map((s) => s.name)

  // 杀破狼：命宫/身宫/三方有七杀、破军、贪狼会聚
  const surrounded = getSurrounded(palaces, ming)
  const shaPoLang = ['七杀', '破军', '贪狼']
  const shaPoCount = surrounded.filter((p) => hasAnyStar(p, ...shaPoLang)).length
  if (shaPoCount >= 2 && surrounded.some((p) => hasAnyStar(p, '七杀', '破军', '贪狼'))) {
    patterns.push({
      name: '杀破狼格',
      type: '特殊格',
      description: '七杀、破军、贪狼会于命宫三方，主变动开拓，性格果敢，一生多经历重大转折与开创事业之机。',
      source: '《紫微斗数全书》'
    })
  }

  // 机月同梁：天机、太阴、天同、天梁会于寅申宫或命三方
  const jiYueTongLiang = ['天机', '太阴', '天同', '天梁']
  const jytlInSurrounded = jiYueTongLiang.filter((star) =>
    surrounded.some((p) => hasStar(p, star) || hasAnyStar(p, star))
  )
  if (jytlInSurrounded.length >= 3) {
    patterns.push({
      name: '机月同梁格',
      type: '吉格',
      description: '天机、太阴、天同、天梁会聚，主聪明稳重，宜公职、教育、文化、策划类工作，行事有条理。',
      source: '《紫微斗数全书》'
    })
  }

  // 紫府同宫 / 紫府朝垣
  if (hasStar(ming, '紫微', '天府')) {
    patterns.push({
      name: '紫府同宫',
      type: '吉格',
      description: '紫微天府同坐命宫，为「帝王之格」，主尊贵稳重，有领导统御之能，一生多得贵人扶持。',
      source: '《紫微斗数全书》'
    })
  } else if (
    hasStar(ming, '紫微') &&
    getOpposite(palaces, ming).majorStars.some((s) => s.name === '天府')
  ) {
    patterns.push({
      name: '紫府朝垣',
      type: '吉格',
      description: '紫微坐命，天府在迁移朝垣，主格局清贵，外出易得机遇，事业有上升空间。',
      source: '《紫微斗数全书》'
    })
  }

  // 日月并明 / 日月照壁
  if (hasStar(ming, '太阳', '太阴')) {
    patterns.push({
      name: '日月并明',
      type: '吉格',
      description: '太阳太阴同宫坐命，主聪明俊秀，男女皆利，事业财运两相宜，夜生人尤佳。',
      source: '《斗数宣微》'
    })
  }

  // 廉贞七杀
  if (hasStar(ming, '廉贞', '七杀')) {
    patterns.push({
      name: '廉杀同宫',
      type: '特殊格',
      description: '廉贞七杀同宫，主刚毅果决，有威权魄力，宜军警、法律、外科、竞争性行业，须防刚烈过激。',
      source: '《紫微斗数全书》'
    })
  }

  // 火铃夹命
  const prev = palaces[fixIndex(ming.index - 1)]
  const next = palaces[fixIndex(ming.index + 1)]
  const prevSha = [...prev.majorStars, ...prev.minorStars].map((s) => s.name)
  const nextSha = [...next.majorStars, ...next.minorStars].map((s) => s.name)
  if (
    (prevSha.includes('火星') || prevSha.includes('铃星')) &&
    (nextSha.includes('火星') || nextSha.includes('铃星'))
  ) {
    patterns.push({
      name: '火铃夹命',
      type: '凶格',
      description: '火星铃星夹命宫，主急躁焦虑，人生多突发波折，宜修身养性、谨慎决策。',
      source: '《斗数宣微》'
    })
  }

  // 羊陀夹命
  if (
    (prevSha.includes('擎羊') || prevSha.includes('陀罗')) &&
    (nextSha.includes('擎羊') || nextSha.includes('陀罗'))
  ) {
    patterns.push({
      name: '羊陀夹命',
      type: '凶格',
      description: '擎羊陀罗夹命宫，主阻滞是非，做事易遇阻碍，须防口舌纠纷与意外伤害。',
      source: '《斗数宣微》'
    })
  }

  // 空劫夹命
  if (
    (prevSha.includes('地空') || prevSha.includes('地劫')) &&
    (nextSha.includes('地空') || nextSha.includes('地劫'))
  ) {
    patterns.push({
      name: '空劫夹命',
      type: '凶格',
      description: '地空地劫夹命，主理想高远而现实多变，财来财去，宜精神修养、技艺专精。',
      source: '《斗数宣微》'
    })
  }

  // 府相朝垣
  if (guan && cai && hasStar(ming, '天府') && hasStar(guan, '天相')) {
    patterns.push({
      name: '府相朝垣',
      type: '吉格',
      description: '天府坐命，天相在官禄朝垣，主官运亨通，事业稳健，得人相助。',
      source: '《紫微斗数全书》'
    })
  }

  // 马头带箭（天马与禄存/擎羊同宫于命三方）
  if (surrounded.some((p) => hasStar(p, '天马', '擎羊') || hasStar(p, '天马', '禄存'))) {
    patterns.push({
      name: '马头带箭',
      type: '特殊格',
      description: '天马与禄存或擎羊同宫，主奔波劳碌中得财，宜外出发展、贸易交通行业。',
      source: '《紫微斗数全集》'
    })
  }

  // 命无正曜（空宫借对宫）
  if (mingMajors.length === 0) {
    const opposite = getOpposite(palaces, ming)
    const borrow = opposite.majorStars.map((s) => s.name).join('、') || '无主星'
    patterns.push({
      name: '命无正曜',
      type: '特殊格',
      description: `命宫无主星，借对宫（迁移）${borrow}安星。主性格受环境与对宫星曜影响较大，宜借外力发展。`,
      source: '《斗数宣微》'
    })
  }

  // 禄马交驰
  if (surrounded.some((p) => hasStar(p, '禄存', '天马'))) {
    patterns.push({
      name: '禄马交驰',
      type: '吉格',
      description: '禄存天马同宫，主财源活跃，动中求财，利商贸、物流、跨地域事业。',
      source: '《紫微斗数全集》'
    })
  }

  if (qian && hasAnyStar(qian, '紫微', '天府', '太阳', '太阴')) {
    patterns.push({
      name: '三方有贵',
      type: '吉格',
      description: '迁移宫见紫府日月等贵星，主外出吉利，异地发展有贵人，宜开阔视野。',
      source: '《斗数宣微》'
    })
  }

  return patterns
}
