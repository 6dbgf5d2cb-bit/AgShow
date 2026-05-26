import { solarToLunar, formatLunarDate, getHuangLi } from './miniprogram/utils/lunar'

async function testDate() {
  const year = 2007
  const month = 12
  const day = 12
  
  try {
    const lunar = await solarToLunar(year, month, day)
    console.log(`阳历 ${year}年${month}月${day}日`)
    console.log(`农历: ${formatLunarDate(lunar)}`)
    console.log(`年干支: ${lunar.yearGanZhi}`)
    console.log(`月干支: ${lunar.monthGanZhi}`)
    console.log(`日干支: ${lunar.dayGanZhi}`)
    console.log(`生肖: ${lunar.zodiac}`)
    console.log(`节气: ${lunar.term || '无'}`)
    
    const huangli = await getHuangLi(year, month, day)
    console.log(`\n黄历信息:`)
    console.log(`宜: ${huangli.yi.join('、')}`)
    console.log(`忌: ${huangli.ji.join('、')}`)
    console.log(`吉神: ${huangli.yiShen}`)
    console.log(`凶神: ${huangli.xiongShen}`)
    console.log(`冲煞: ${huangli.chongSha}`)
  } catch (error) {
    console.error('转换失败:', error)
  }
}

testDate()
