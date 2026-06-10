import type { ZiweiResult } from '../../utils/ziwei-engine'
import {
  loadHealthSharePayload,
  loadHealthSharePayloadAsync,
  buildZiweiSharePath
} from '../../utils/health-usage'

Page({
  data: {
    result: {} as ZiweiResult,
    shareId: '',
    shareTitle: '',
    loaded: false,
    activeTab: 'chart' as 'chart' | 'classics' | 'summary'
  },

  async onLoad(options: Record<string, string | undefined>) {
    let data: ZiweiResult | null = null
    let shareId = ''
    let shareTitle = ''

    if (options.shareId) {
      shareId = decodeURIComponent(options.shareId)
      wx.showLoading({ title: '加载中', mask: true })
      let record = await loadHealthSharePayloadAsync(shareId)
      if (!record || record.type !== 'ziwei') {
        record = loadHealthSharePayload(shareId)
      }
      wx.hideLoading()
      if (record?.type === 'ziwei' && record.data) {
        data = record.data as ZiweiResult
        shareTitle = record.title
      }
    }

    if (!data) {
      wx.showToast({ title: '结果已失效，请重新排盘', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1600)
      return
    }

    this.setData({
      result: data,
      shareId,
      shareTitle,
      loaded: true
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

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'chart' | 'classics' | 'summary'
    this.setData({ activeTab: tab })
  },

  onShareAppMessage() {
    const { shareId, shareTitle, result } = this.data
    const title = shareTitle || `紫微斗数 · ${result.name || result.lunarDate || '命盘分析'}`
    const path = shareId
      ? buildZiweiSharePath(shareId)
      : '/pages/ziwei/ziwei'
    return { title, path }
  },

  onShareTimeline() {
    const { shareId, shareTitle, result } = this.data
    const query = shareId ? `shareId=${encodeURIComponent(shareId)}` : ''
    return {
      title: shareTitle || `紫微斗数 · ${result.name || '命盘分析'}`,
      query
    }
  }
})
