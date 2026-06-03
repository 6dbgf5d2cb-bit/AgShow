import { BaZiResult, SymptomResult } from '../../utils/health'
import {
  loadHealthSharePayload,
  loadHealthSharePayloadAsync,
  buildHealthSharePath
} from '../../utils/health-usage'

Page({
  data: {
    resultType: 'bazi' as 'bazi' | 'symptom',
    baziResult: {} as BaZiResult,
    symptomResult: {} as SymptomResult,
    shareId: '',
    shareTitle: '',
    fromShare: false,
    loaded: false
  },

  async onLoad(options: Record<string, string | undefined>) {
    const type = (options.type === 'symptom' ? 'symptom' : 'bazi') as 'bazi' | 'symptom'
    let data: BaZiResult | SymptomResult | null = null
    let shareId = ''
    let shareTitle = ''
    let fromShare = false

    if (options.shareId) {
      shareId = decodeURIComponent(options.shareId)
      wx.showLoading({ title: '加载中', mask: true })
      let record = await loadHealthSharePayloadAsync(shareId)
      if (!record) {
        record = loadHealthSharePayload(shareId)
      }
      wx.hideLoading()
      if (record) {
        data = record.data
        shareTitle = record.title
        fromShare = true
      }
    } else if (options.key) {
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

    if (!data) {
      wx.showToast({ title: '结果已失效，请重新检测', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1600)
      return
    }

    this.setData({
      resultType: type,
      shareId,
      shareTitle,
      fromShare,
      loaded: true,
      [type === 'bazi' ? 'baziResult' : 'symptomResult']: data
    })
  },

  onShow() {
    if (!this.data.loaded) return
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    const { resultType, shareId, shareTitle, baziResult, symptomResult } = this.data
    let title = shareTitle
    if (!title) {
      title =
        resultType === 'bazi'
          ? `八字排盘 · ${(baziResult as BaZiResult).originalDate || '命理分析'}`
          : (symptomResult as SymptomResult).patternSummary?.slice(0, 30) || '中医诊断结果'
    }
    const path = shareId
      ? buildHealthSharePath(resultType, shareId)
      : `/pages/health-detection/health-detection?tab=${resultType === 'bazi' ? 'bazi' : 'symptom'}`
    return {
      title,
      path
    }
  },

  onShareTimeline() {
    const { resultType, shareId, shareTitle } = this.data
    const query = shareId
      ? `type=${resultType}&shareId=${encodeURIComponent(shareId)}`
      : `type=${resultType}`
    return {
      title: shareTitle || (resultType === 'bazi' ? '八字排盘结果' : '中医诊断结果'),
      query
    }
  }
})
