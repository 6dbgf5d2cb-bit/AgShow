/**
 * 紫微斗数典籍详论（Phase 1 MVP）
 * 《紫微斗数全书》《斗数宣微》《紫微斗数全集》《紫微斗数源流探微》
 */
import type { PatternResult } from './ziwei-patterns'
import type { PalaceName, StarSlot, Brightness } from './ziwei-stars'
import { YEAR_MUTAGEN } from './ziwei-stars'

interface PalaceBrief {
  name: PalaceName
  majorStars: StarSlot[]
  minorStars: StarSlot[]
}

/** 十四主星在十二宫基本含义（精简） */
const STAR_IN_PALACE: Partial<Record<string, Partial<Record<PalaceName, string>>>> = {
  紫微: {
    命宫: '帝王之星坐命，气度不凡，有统御欲与自尊心，一生多遇贵人，宜担任管理与决策角色。',
    官禄: '事业宫见紫微，主权威显赫，宜政商领导、企业管理，职位易升。',
    财帛: '财源稳厚，理财保守而有效，宜长线投资与不动产。',
    夫妻: '配偶条件佳，有贵气，感情需互相尊重，防强势争执。'
  },
  天机: {
    命宫: '机智灵敏，善谋略，心思细密，宜策划、咨询、技术研发。',
    官禄: '事业多变，宜动脑工作，企划、教育、交通行业较利。',
    财帛: '财来财去，宜以智慧生财，投机需谨慎。',
    夫妻: '配偶聪明善变，感情需多沟通，防思虑过多。'
  },
  太阳: {
    命宫: '光明磊落，热心公益，男命主贵，女命宜注意夫妻协调。',
    官禄: '事业公开明朗，宜公职、传播、能源、教育行业。',
    财帛: '正财为主，花钱大方，宜见好就收。',
    夫妻: '配偶外向积极，男命主得妻助，女命夫缘宜晚。'
  },
  武曲: {
    命宫: '刚毅果断，重实际，有执行力，宜金融、军警、工程。',
    官禄: '事业以财技并重，宜财务、制造、五金行业。',
    财帛: '正财星，善理财，宜稳健投资与实业经营。',
    夫妻: '配偶务实，感情表达直接，宜互相包容。'
  },
  天同: {
    命宫: '温和享福，人缘佳，宜服务、餐饮、休闲产业。',
    官禄: '事业平顺，宜合作型工作，不宜过度竞争。',
    财帛: '财路温和，宜合作求财，防安逸懈怠。',
    夫妻: '感情和谐，配偶温和，宜共同经营生活。'
  },
  廉贞: {
    命宫: '感情丰富，个性倔强，宜艺术、公关、行政工作。',
    官禄: '事业多竞争，宜政治、娱乐、美容行业。',
    财帛: '偏财机会多，宜谨慎理财，防桃花破财。',
    夫妻: '感情浓烈，桃花旺，宜专一守礼。'
  },
  天府: {
    命宫: '稳重保守，有财库之象，一生衣食不缺，宜管理财务。',
    官禄: '事业稳健，宜金融、地产、后勤管理。',
    财帛: '财库丰盈，储蓄能力强，宜多元化配置。',
    夫妻: '配偶敦厚，重视家庭，婚姻较稳定。'
  },
  太阴: {
    命宫: '温柔内敛，富同情心，女命尤吉，宜文艺、护理、教育。',
    官禄: '事业宜夜间或室内工作，房产、女性产业较利。',
    财帛: '暗财渐积，宜不动产与稳健理财。',
    夫妻: '配偶温柔，感情细腻，宜浪漫经营。'
  },
  贪狼: {
    命宫: '多才多艺，欲望强，社交广，宜娱乐、销售、外交。',
    官禄: '事业宜竞争行业，公关、餐饮、艺术较利。',
    财帛: '偏财旺，花销亦大，宜设预算防享乐过度。',
    夫妻: '桃花旺，感情丰富，宜专一以免波折。'
  },
  巨门: {
    命宫: '口才好，善辩，宜法律、讲师、传媒，防口舌是非。',
    官禄: '事业靠口才与专业，宜教育、司法、研究。',
    财帛: '财由言商而来，宜技术、咨询生财。',
    夫妻: '夫妻易争执，宜少言多谅，防冷战。'
  },
  天相: {
    命宫: '忠厚正直，有辅佐之才，宜行政、秘书、中介服务。',
    官禄: '事业宜辅佐型角色，人事、公务、顾问较利。',
    财帛: '正财平稳，宜合作理财，忌担保借贷。',
    夫妻: '配偶贤良，重信义，婚姻平和。'
  },
  天梁: {
    命宫: '老成持重，有长者之风，宜医疗、宗教、教育、监察。',
    官禄: '事业宜稳定型，公职、医药、慈善较利。',
    财帛: '财来缓慢，宜守成，晚年财较佳。',
    夫妻: '配偶成熟，宜年长或稳重型，重精神交流。'
  },
  七杀: {
    命宫: '果断勇猛，独立性强，宜军警、外科、竞争性行业。',
    官禄: '事业多挑战，宜开创型工作，能独当一面。',
    财帛: '财来波动，宜技术专精，防冲动投资。',
    夫妻: '感情直接，配偶个性强，宜互相尊重。'
  },
  破军: {
    命宫: '开创变动，不喜守成，宜改革、科技、运输行业。',
    官禄: '事业多变化，宜创业或转型，破旧立新。',
    财帛: '财耗较大，宜分散投资，防大起大落。',
    夫妻: '婚姻宜晚，感情多波折，宜包容沟通。'
  }
}

const BRIGHTNESS_NOTE: Record<Brightness, string> = {
  庙: '星曜庙旺，力量最强，吉星更吉，凶星稍减。',
  旺: '星曜当旺，发挥良好，主顺遂有力。',
  得: '星曜得地，尚可发挥，吉凶参半看组合。',
  利: '星曜有利，平稳向好。',
  平: '星曜平和，无大起伏。',
  不: '星曜不得地，力量减弱，宜谨慎行事。',
  陷: '星曜落陷，力量最弱，吉星减力，凶星更凶。',
  '': ''
}

export interface DaXianClassicItem {
  ageRange: string
  palaceName: string
  ganZhi: string
  theme: string
  detail: string
}

export interface ZiweiClassicsBundle {
  quanShu: {
    mingGongSummary: string
    starNature: string
    geJuSummary: string
    palaceBriefs: { palace: PalaceName; text: string }[]
  }
  xuanWei: {
    sanFang: string
    huiZhao: string
    borrowStar: string
  }
  quanJi: {
    daXianItems: DaXianClassicItem[]
    shenShaNote: string
  }
  yuanLiu: {
    schoolNote: string
    modernRead: string
  }
  summary: {
    character: string
    career: string
    marriage: string
    health: string
    wealth: string
  }
}

function palaceStarText(p: PalaceBrief): string {
  const majors = p.majorStars
  if (majors.length === 0) return '无主星，须借对宫之力。'
  return majors
    .map((s) => {
      const base = STAR_IN_PALACE[s.name]?.[p.name] || `${s.name}坐${p.name}，须参三方四正而论。`
      const bright = s.brightness ? `【${s.brightness}】${BRIGHTNESS_NOTE[s.brightness]}` : ''
      const muta = s.mutagen ? `化${s.mutagen}` : ''
      return `${s.name}${muta ? `（${muta}）` : ''}${bright ? ' ' + bright : ''} ${base}`
    })
    .join('\n')
}

function getMingStars(palaces: PalaceBrief[]): StarSlot[] {
  const ming = palaces.find((p) => p.name === '命宫')
  return ming?.majorStars || []
}

export function analyzeZiweiClassics(params: {
  palaces: PalaceBrief[]
  patterns: PatternResult[]
  yearGan: string
  fiveElementsClass: string
  gender: 'male' | 'female'
  daXian: { ageRange: string; palaceName: PalaceName; gan: string; zhi: string }[]
}): ZiweiClassicsBundle {
  const { palaces, patterns, yearGan, fiveElementsClass, gender, daXian } = params
  const ming = palaces.find((p) => p.name === '命宫')!
  const guan = palaces.find((p) => p.name === '官禄')!
  const cai = palaces.find((p) => p.name === '财帛')!
  const fu = palaces.find((p) => p.name === '夫妻')!
  const ji = palaces.find((p) => p.name === '疾厄')!

  const mingStars = getMingStars(palaces)
  const mingStarNames = mingStars.map((s) => s.name).join('、') || '空宫（借迁移宫主星）'
  const mutagens = YEAR_MUTAGEN[yearGan]
  const sihuaText = mutagens
    ? `生年${yearGan}干四化：${mutagens.map((s, i) => `${s}化${['禄', '权', '科', '忌'][i]}`).join('、')}。`
    : ''

  const focusPalaces: PalaceName[] = ['命宫', '官禄', '财帛', '夫妻', '疾厄']
  const palaceBriefs = focusPalaces.map((name) => {
    const p = palaces.find((x) => x.name === name)!
    return { palace: name, text: palaceStarText(p) }
  })

  const geJuSummary =
    patterns.length > 0
      ? patterns.map((p) => `【${p.name}】${p.description}`).join('\n')
      : '未见显著格局，以命宫主星与三方四正综合论断。'

  const borrowStar =
    mingStars.length === 0
      ? `《斗数宣微》云：「空宫借对宫」。命宫无主星，当以迁移宫正曜为外在表现，以福德宫为内在根基。`
      : '命宫有正曜，以本宫主星为性格根本，迁移宫为外缘际遇。'

  const daXianItems: DaXianClassicItem[] = daXian.map((d) => {
    const palace = palaces.find((p) => p.name === d.palaceName)
    const stars = palace?.majorStars.map((s) => s.name).join('、') || '空宫'
    return {
      ageRange: d.ageRange,
      palaceName: d.palaceName,
      ganZhi: `${d.gan}${d.zhi}`,
      theme: `${d.ageRange}岁行${d.palaceName}大限`,
      detail: `大限${d.gan}${d.zhi}，${d.palaceName}见${stars}。此十年运势以${d.palaceName}所主事项为重心，须参大限四化与流年叠并。`
    }
  })

  const characterBase = palaceStarText(ming)
  const careerBase = palaceStarText(guan)
  const wealthBase = palaceStarText(cai)
  const marriageBase = palaceStarText(fu)
  const healthBase = palaceStarText(ji)

  return {
    quanShu: {
      mingGongSummary: `命宫主星：${mingStarNames}。五行局：${fiveElementsClass}。${sihuaText}\n${characterBase}`,
      starNature: mingStars
        .map((s) => {
          const nature = STAR_IN_PALACE[s.name]?.命宫 || ''
          return nature ? `${s.name}：${nature}` : ''
        })
        .filter(Boolean)
        .join('\n') || '空宫之命，性格多受对宫与三方影响。',
      geJuSummary,
      palaceBriefs
    },
    xuanWei: {
      sanFang: '命宫三方四正为命、财、官、迁四宫，统论一生格局与际遇。命三方见吉星则格局提升，见煞星则须防波折。',
      huiZhao: '会照：对宫、三合宫之星曜互相影响。命宫与迁移相对，官禄与夫妻相对，须综合会照星情而定吉凶。',
      borrowStar
    },
    quanJi: {
      daXianItems,
      shenShaNote: `大限依${fiveElementsClass}起运，${gender === 'male' ? '男命' : '女命'}顺逆依年支阴阳与性别而定。辅星煞星如羊陀火铃空劫，须于大限流年叠见时加强防范。`
    },
    yuanLiu: {
      schoolNote: '本排盘依《紫微斗数全书》安星法（通用派），以农历生月生日生时安命身，以命宫干支定五行局。与八字子平术不同，紫微重星曜宫位与四化飞星。',
      modernRead: '现代诠释：可将十二宫理解为人生不同面向的心理与际遇模型，宜结合个人努力与环境因素，作为自我认知与规划参考，非宿命论断。'
    },
    summary: {
      character: characterBase.slice(0, 200) + (characterBase.length > 200 ? '…' : ''),
      career: careerBase.slice(0, 200) + (careerBase.length > 200 ? '…' : ''),
      marriage: marriageBase.slice(0, 200) + (marriageBase.length > 200 ? '…' : ''),
      health: healthBase.slice(0, 200) + (healthBase.length > 200 ? '…' : ''),
      wealth: wealthBase.slice(0, 200) + (wealthBase.length > 200 ? '…' : '')
    }
  }
}
