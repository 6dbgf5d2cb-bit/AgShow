import { BaZiResult, SymptomResult } from '../../utils/health'

Page({
  data: {
    resultType: 'bazi' as 'bazi' | 'symptom',
    baziResult: {} as BaZiResult,
    symptomResult: {} as SymptomResult
  },

  onLoad(options: any) {
    const type = (options.type as 'bazi' | 'symptom') || 'bazi'
    let data: BaZiResult | SymptomResult | null = null

    if (options.key) {
      data = wx.getStorageSync(options.key) as BaZiResult | SymptomResult
      if (data) {
        wx.removeStorageSync(options.key)
      }
    } else if (options.data) {
      try {
        data = JSON.parse(decodeURIComponent(options.data))
      } catch {
        data = null
      }
    }

    if (data) {
      this.setData({
        resultType: type,
        [type === 'bazi' ? 'baziResult' : 'symptomResult']: data
      })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})