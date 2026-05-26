import { solarToLunar, lunarToSolar, formatLunarDate } from '../../utils/lunar'

Page({
  data: {
    solarYear: '',
    solarMonth: '',
    solarDay: '',
    lunarYear: '',
    lunarMonth: '',
    lunarDay: '',
    solarToLunarResult: '',
    lunarToSolarResult: '',
    testResults: [] as Array<{ date: string; expected: string; actual: string; isCorrect: boolean }>
  },

  onLoad() {
    this.runTests()
  },

  onSolarInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  onLunarInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  convertSolarToLunar() {
    const { solarYear, solarMonth, solarDay } = this.data
    
    if (!solarYear || !solarMonth || !solarDay) {
      wx.showToast({ title: '请输入完整的阳历日期', icon: 'none' })
      return
    }

    try {
      const result = solarToLunar(
        parseInt(solarYear),
        parseInt(solarMonth),
        parseInt(solarDay)
      )
      this.setData({
        solarToLunarResult: `${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日${result.isLeapMonth ? '(闰月)' : ''}`
      })
    } catch (e: any) {
      this.setData({
        solarToLunarResult: `错误: ${e.message}`
      })
    }
  },

  convertLunarToSolar() {
    const { lunarYear, lunarMonth, lunarDay } = this.data
    
    if (!lunarYear || !lunarMonth || !lunarDay) {
      wx.showToast({ title: '请输入完整的农历日期', icon: 'none' })
      return
    }

    try {
      const result = lunarToSolar(
        parseInt(lunarYear),
        parseInt(lunarMonth),
        parseInt(lunarDay)
      )
      this.setData({
        lunarToSolarResult: `${result.year}年${result.month}月${result.day}日`
      })
    } catch (e: any) {
      this.setData({
        lunarToSolarResult: `错误: ${e.message}`
      })
    }
  },

  runTests() {
    const tests = [
      { solar: { year: 2024, month: 2, day: 10 }, expected: '2024年1月1日' },
      { solar: { year: 2023, month: 1, day: 22 }, expected: '2023年1月1日' },
      { solar: { year: 2023, month: 1, day: 21 }, expected: '2022年12月30日' },
      { solar: { year: 2020, month: 1, day: 25 }, expected: '2020年1月1日' },
      { solar: { year: 2019, month: 12, day: 31 }, expected: '2019年12月6日' },
      { solar: { year: 2019, month: 2, day: 5 }, expected: '2019年1月1日' },
      { solar: { year: 2007, month: 12, day: 12 }, expected: '2007年10月23日' },
      { solar: { year: 1976, month: 12, day: 19 }, expected: '1976年10月29日' }
    ]

    const results = tests.map(test => {
      try {
        const result = solarToLunar(test.solar.year, test.solar.month, test.solar.day)
        const actual = `${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日`
        return {
          date: `${test.solar.year}-${test.solar.month}-${test.solar.day}`,
          expected: test.expected,
          actual,
          isCorrect: actual === test.expected
        }
      } catch (e: any) {
        return {
          date: `${test.solar.year}-${test.solar.month}-${test.solar.day}`,
          expected: test.expected,
          actual: `错误: ${e.message}`,
          isCorrect: false
        }
      }
    })

    this.setData({ testResults: results })
    
    const allPassed = results.every(r => r.isCorrect)
    wx.showToast({
      title: allPassed ? '所有测试通过！' : '部分测试失败',
      icon: allPassed ? 'success' : 'none'
    })
  }
})
