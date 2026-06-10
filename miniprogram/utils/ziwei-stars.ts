/**
 * 紫微斗数星曜数据与安星规则（依《紫微斗数全书》）
 */

export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
/** 宫位从寅起：寅=0 … 丑=11 */
export const PALACE_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const
export const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'] as const

export type PalaceName = (typeof PALACE_NAMES)[number]
export type MajorStarName =
  | '紫微' | '天机' | '太阳' | '武曲' | '天同' | '廉贞'
  | '天府' | '太阴' | '贪狼' | '巨门' | '天相' | '天梁' | '七杀' | '破军'

export type Brightness = '庙' | '旺' | '得' | '利' | '平' | '不' | '陷' | ''

const BRIGHTNESS_MAP: Record<string, Brightness> = {
  miao: '庙', wang: '旺', de: '得', li: '利', ping: '平', bu: '不', xian: '陷'
}

/** 亮度表：索引 0=寅宫 … 11=丑宫（iztro 数据） */
export const STAR_BRIGHTNESS: Record<string, string[]> = {
  紫微: ['旺', '旺', '得', '旺', '庙', '庙', '旺', '旺', '得', '旺', '平', '庙'],
  天机: ['得', '旺', '利', '平', '庙', '陷', '得', '旺', '利', '平', '庙', '陷'],
  太阳: ['旺', '庙', '旺', '旺', '旺', '得', '得', '陷', '不', '陷', '陷', '不'],
  武曲: ['得', '利', '庙', '平', '旺', '庙', '得', '利', '庙', '平', '旺', '庙'],
  天同: ['利', '平', '平', '庙', '陷', '不', '旺', '平', '平', '庙', '旺', '不'],
  廉贞: ['庙', '平', '利', '陷', '平', '利', '庙', '平', '利', '陷', '平', '利'],
  天府: ['庙', '得', '庙', '得', '旺', '庙', '得', '旺', '庙', '得', '庙', '庙'],
  太阴: ['旺', '陷', '陷', '陷', '不', '不', '利', '不', '旺', '庙', '庙', '庙'],
  贪狼: ['平', '利', '庙', '陷', '旺', '庙', '平', '利', '庙', '陷', '旺', '庙'],
  巨门: ['庙', '庙', '陷', '旺', '旺', '不', '庙', '庙', '陷', '旺', '旺', '不'],
  天相: ['庙', '陷', '得', '得', '庙', '得', '庙', '陷', '得', '得', '庙', '庙'],
  天梁: ['庙', '庙', '庙', '陷', '庙', '旺', '陷', '得', '庙', '陷', '庙', '旺'],
  七杀: ['庙', '旺', '庙', '平', '旺', '庙', '庙', '庙', '庙', '平', '旺', '庙'],
  破军: ['得', '陷', '旺', '平', '庙', '旺', '得', '陷', '旺', '平', '庙', '旺'],
  文昌: ['陷', '利', '得', '庙', '陷', '利', '得', '庙', '陷', '利', '得', '庙'],
  文曲: ['平', '旺', '得', '庙', '陷', '旺', '得', '庙', '陷', '旺', '得', '庙'],
  火星: ['庙', '利', '陷', '得', '庙', '利', '陷', '得', '庙', '利', '陷', '得'],
  铃星: ['庙', '利', '陷', '得', '庙', '利', '陷', '得', '庙', '利', '陷', '得'],
  擎羊: ['', '陷', '庙', '', '陷', '庙', '', '陷', '庙', '', '陷', '庙'],
  陀罗: ['陷', '', '庙', '陷', '', '庙', '陷', '', '庙', '陷', '', '庙']
}

/** 五虎遁：年干 → 寅宫天干索引 */
export const TIGER_RULE: Record<string, number> = {
  甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0
}

/** 五行局数值 */
export const FIVE_ELEMENTS_VALUE: Record<string, number> = {
  水二局: 2, 木三局: 3, 金四局: 4, 土五局: 5, 火六局: 6
}

/** 年干四化：[禄, 权, 科, 忌] 对应星曜 */
export const YEAR_MUTAGEN: Record<string, [string, string, string, string]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼']
}

const MUTAGEN_LABEL = ['禄', '权', '科', '忌'] as const

export function fixIndex(index: number, max = 12): number {
  let i = index
  while (i < 0) i += max
  return i % max
}

/** 地支 → 以寅为 0 的宫位索引 */
export function branchToPalaceIndex(branch: string): number {
  const idx = DIZHI.indexOf(branch as (typeof DIZHI)[number])
  return fixIndex(idx - 2)
}

export function palaceIndexToBranch(index: number): string {
  return PALACE_BRANCHES[fixIndex(index)]
}

/** 定五行局 */
export function getFiveElementsClass(heavenlyStem: string, earthlyBranch: string): string {
  const table = ['木三局', '金四局', '水二局', '火六局', '土五局']
  const ganIdx = TIANGAN.indexOf(heavenlyStem as (typeof TIANGAN)[number])
  const zhiIdx = DIZHI.indexOf(earthlyBranch as (typeof DIZHI)[number])
  const ganNum = Math.floor(ganIdx / 2) + 1
  const zhiNum = Math.floor(fixIndex(zhiIdx, 6) / 2) + 1
  let sum = ganNum + zhiNum
  while (sum > 5) sum -= 5
  return table[sum - 1]
}

export function getBrightness(starName: string, palaceIndex: number): Brightness {
  const row = STAR_BRIGHTNESS[starName]
  if (!row) return ''
  return (row[fixIndex(palaceIndex)] || '') as Brightness
}

export function getMutagen(starName: string, yearGan: string): string {
  const mutagens = YEAR_MUTAGEN[yearGan]
  if (!mutagens) return ''
  const idx = mutagens.indexOf(starName)
  return idx >= 0 ? MUTAGEN_LABEL[idx] : ''
}

/** 起紫微、天府（寅宫为索引 0） */
export function getZiweiTianfuIndex(lunarDay: number, fiveElementsClass: string): { ziweiIndex: number; tianfuIndex: number } {
  const bureau = FIVE_ELEMENTS_VALUE[fiveElementsClass] || 5
  let offset = -1
  let quotient = 0
  let remainder = -1
  do {
    offset++
    const divisor = lunarDay + offset
    quotient = Math.floor(divisor / bureau)
    remainder = divisor % bureau
  } while (remainder !== 0)
  quotient %= 12
  let ziweiIndex = quotient - 1
  if (offset % 2 === 0) {
    ziweiIndex += offset
  } else {
    ziweiIndex -= offset
  }
  ziweiIndex = fixIndex(ziweiIndex)
  const tianfuIndex = fixIndex(12 - ziweiIndex)
  return { ziweiIndex, tianfuIndex }
}

export interface StarSlot {
  name: string
  brightness: Brightness
  mutagen: string
  type: 'major' | 'minor' | 'sha'
}

function emptyPalaces(): StarSlot[][] {
  return Array.from({ length: 12 }, () => [])
}

function addStar(palaces: StarSlot[][], index: number, star: StarSlot) {
  palaces[fixIndex(index)].push(star)
}

/** 安十四主星 */
export function placeMajorStars(
  ziweiIndex: number,
  tianfuIndex: number,
  yearGan: string
): StarSlot[][] {
  const palaces = emptyPalaces()
  const ziweiGroup: (MajorStarName | '')[] = ['紫微', '天机', '', '太阳', '武曲', '天同', '', '', '廉贞']
  const tianfuGroup: (MajorStarName | '')[] = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '', '', '', '破军']

  ziweiGroup.forEach((name, i) => {
    if (!name) return
    const idx = fixIndex(ziweiIndex - i)
    addStar(palaces, idx, {
      name,
      brightness: getBrightness(name, idx),
      mutagen: getMutagen(name, yearGan),
      type: 'major'
    })
  })
  tianfuGroup.forEach((name, i) => {
    if (!name) return
    const idx = fixIndex(tianfuIndex + i)
    addStar(palaces, idx, {
      name,
      brightness: getBrightness(name, idx),
      mutagen: getMutagen(name, yearGan),
      type: 'major'
    })
  })
  return palaces
}

/** 安辅星、煞星 */
export function placeMinorStars(
  yearGan: string,
  yearZhi: string,
  lunarMonth: number,
  timeBranchIndex: number,
  yearGanForMutagen: string
): StarSlot[][] {
  const palaces = emptyPalaces()
  const tIdx = fixIndex(timeBranchIndex)

  const zuoIndex = fixIndex(branchToPalaceIndex('辰') + lunarMonth - 1)
  const youIndex = fixIndex(branchToPalaceIndex('戌') - (lunarMonth - 1))
  addStar(palaces, zuoIndex, { name: '左辅', brightness: '', mutagen: getMutagen('左辅', yearGanForMutagen), type: 'minor' })
  addStar(palaces, youIndex, { name: '右弼', brightness: '', mutagen: getMutagen('右弼', yearGanForMutagen), type: 'minor' })

  const changIndex = fixIndex(branchToPalaceIndex('戌') - tIdx)
  const quIndex = fixIndex(branchToPalaceIndex('辰') + tIdx)
  addStar(palaces, changIndex, { name: '文昌', brightness: getBrightness('文昌', changIndex), mutagen: getMutagen('文昌', yearGanForMutagen), type: 'minor' })
  addStar(palaces, quIndex, { name: '文曲', brightness: getBrightness('文曲', quIndex), mutagen: getMutagen('文曲', yearGanForMutagen), type: 'minor' })

  const kuiYue = getKuiYueIndex(yearGan)
  addStar(palaces, kuiYue.kui, { name: '天魁', brightness: '', mutagen: '', type: 'minor' })
  addStar(palaces, kuiYue.yue, { name: '天钺', brightness: '', mutagen: '', type: 'minor' })

  const luYangTuoMa = getLuYangTuoMaIndex(yearGan, yearZhi)
  addStar(palaces, luYangTuoMa.lu, { name: '禄存', brightness: '', mutagen: '', type: 'minor' })
  addStar(palaces, luYangTuoMa.ma, { name: '天马', brightness: '', mutagen: '', type: 'minor' })
  addStar(palaces, luYangTuoMa.yang, { name: '擎羊', brightness: getBrightness('擎羊', luYangTuoMa.yang), mutagen: '', type: 'sha' })
  addStar(palaces, luYangTuoMa.tuo, { name: '陀罗', brightness: getBrightness('陀罗', luYangTuoMa.tuo), mutagen: '', type: 'sha' })

  const huoLing = getHuoLingIndex(yearZhi, tIdx)
  addStar(palaces, huoLing.huo, { name: '火星', brightness: getBrightness('火星', huoLing.huo), mutagen: '', type: 'sha' })
  addStar(palaces, huoLing.ling, { name: '铃星', brightness: getBrightness('铃星', huoLing.ling), mutagen: '', type: 'sha' })

  const kongJie = getKongJieIndex(tIdx)
  addStar(palaces, kongJie.kong, { name: '地空', brightness: '', mutagen: '', type: 'sha' })
  addStar(palaces, kongJie.jie, { name: '地劫', brightness: '', mutagen: '', type: 'sha' })

  return palaces
}

function getKuiYueIndex(yearGan: string): { kui: number; yue: number } {
  switch (yearGan) {
    case '甲': case '戊': case '庚':
      return { kui: branchToPalaceIndex('丑'), yue: branchToPalaceIndex('未') }
    case '乙': case '己':
      return { kui: branchToPalaceIndex('子'), yue: branchToPalaceIndex('申') }
    case '辛':
      return { kui: branchToPalaceIndex('午'), yue: branchToPalaceIndex('寅') }
    case '丙': case '丁':
      return { kui: branchToPalaceIndex('亥'), yue: branchToPalaceIndex('酉') }
    case '壬': case '癸':
      return { kui: branchToPalaceIndex('卯'), yue: branchToPalaceIndex('巳') }
    default:
      return { kui: 0, yue: 0 }
  }
}

function getLuYangTuoMaIndex(yearGan: string, yearZhi: string): { lu: number; yang: number; tuo: number; ma: number } {
  const luMap: Record<string, string> = {
    甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子'
  }
  const luBranch = luMap[yearGan] || '寅'
  const lu = branchToPalaceIndex(luBranch)
  const maMap: Record<string, string> = {
    寅: '申', 午: '申', 戌: '申', 申: '寅', 子: '寅', 辰: '寅',
    巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳'
  }
  const ma = branchToPalaceIndex(maMap[yearZhi] || '申')
  return { lu, ma, yang: fixIndex(lu + 1), tuo: fixIndex(lu - 1) }
}

function getHuoLingIndex(yearZhi: string, timeBranchIndex: number): { huo: number; ling: number } {
  const t = fixIndex(timeBranchIndex)
  const groups: Record<string, { huo: string; ling: string }> = {
    寅: { huo: '丑', ling: '卯' }, 午: { huo: '丑', ling: '卯' }, 戌: { huo: '丑', ling: '卯' },
    申: { huo: '寅', ling: '戌' }, 子: { huo: '寅', ling: '戌' }, 辰: { huo: '寅', ling: '戌' },
    巳: { huo: '卯', ling: '戌' }, 酉: { huo: '卯', ling: '戌' }, 丑: { huo: '卯', ling: '戌' },
    亥: { huo: '酉', ling: '戌' }, 卯: { huo: '酉', ling: '戌' }, 未: { huo: '酉', ling: '戌' }
  }
  const g = groups[yearZhi] || { huo: '寅', ling: '戌' }
  return {
    huo: fixIndex(branchToPalaceIndex(g.huo) + t),
    ling: fixIndex(branchToPalaceIndex(g.ling) + t)
  }
}

function getKongJieIndex(timeBranchIndex: number): { kong: number; jie: number } {
  const hai = branchToPalaceIndex('亥')
  const t = fixIndex(timeBranchIndex)
  return { kong: fixIndex(hai - t), jie: fixIndex(hai + t) }
}

export function mergeStarPalaces(a: StarSlot[][], b: StarSlot[][]): StarSlot[][] {
  return a.map((stars, i) => [...stars, ...(b[i] || [])])
}

/** 命宫、身宫索引（寅宫=0） */
export function getSoulAndBody(lunarMonth: number, timeBranchIndex: number): { soulIndex: number; bodyIndex: number } {
  const monthIndex = fixIndex(lunarMonth + 1 - 2)
  const soulIndex = fixIndex(monthIndex - timeBranchIndex)
  const bodyIndex = fixIndex(monthIndex + timeBranchIndex)
  return { soulIndex, bodyIndex }
}

export function getPalaceNames(soulIndex: number): PalaceName[] {
  const names: PalaceName[] = []
  for (let i = 0; i < 12; i++) {
    names.push(PALACE_NAMES[fixIndex(i - soulIndex)])
  }
  return names
}

export function getPalaceGanZhi(soulIndex: number, yearGan: string): { gan: string; zhi: string }[] {
  const startGanIdx = TIGER_RULE[yearGan] ?? 0
  return Array.from({ length: 12 }, (_, i) => ({
    gan: TIANGAN[fixIndex(startGanIdx + soulIndex + i, 10)],
    zhi: PALACE_BRANCHES[i]
  }))
}

/** 起大限 */
export function getDaXian(
  soulIndex: number,
  yearGan: string,
  yearZhi: string,
  gender: 'male' | 'female',
  fiveElementsClass: string,
  palaceNames: PalaceName[]
): { palaceIndex: number; palaceName: PalaceName; ageRange: string; gan: string; zhi: string }[] {
  const bureau = FIVE_ELEMENTS_VALUE[fiveElementsClass] || 5
  const yangGan = [0, 2, 4, 6, 8].includes(TIANGAN.indexOf(yearGan as (typeof TIANGAN)[number]))
  const yangZhi = [0, 2, 4, 6, 8, 10].includes(DIZHI.indexOf(yearZhi as (typeof DIZHI)[number]))
  const yearYinYang = yangZhi ? 'yang' : 'yin'
  const forward = (gender === 'male' && yearYinYang === 'yang') || (gender === 'female' && yearYinYang === 'yin')
  const startGanIdx = TIGER_RULE[yearGan] ?? 0
  const items: { palaceIndex: number; palaceName: PalaceName; ageRange: string; gan: string; zhi: string }[] = []

  for (let i = 0; i < 12; i++) {
    const palaceIndex = forward ? fixIndex(soulIndex + i) : fixIndex(soulIndex - i)
    const start = bureau + 10 * i
    const gan = TIANGAN[fixIndex(startGanIdx + palaceIndex, 10)]
    const zhi = PALACE_BRANCHES[palaceIndex]
    items.push({
      palaceIndex,
      palaceName: palaceNames[palaceIndex],
      ageRange: `${start}–${start + 9}`,
      gan,
      zhi
    })
  }
  return items.sort((a, b) => parseInt(a.ageRange, 10) - parseInt(b.ageRange, 10))
}

/** 时辰字符串 → 地支索引（子=0） */
export function birthTimeToBranchIndex(birthTime: string): number {
  const map: Record<string, number> = {
    '23-01': 0, '01-03': 1, '03-05': 2, '05-07': 3, '07-09': 4, '09-11': 5,
    '11-13': 6, '13-15': 7, '15-17': 8, '17-19': 9, '19-21': 10, '21-23': 11
  }
  return map[birthTime] ?? 0
}
