import type { ZiweiResult } from '../../utils/ziwei-engine'
import {
  loadHealthSharePayload,
  loadHealthSharePayloadAsync,
  buildZiweiSharePath
} from '../../utils/health-usage'

/** 地支宫位在方盘上的位置（南在上，寅左下起） */
const PALACE_GRID_POS: Record<number, { row: number; col: number }> = {
  3: { row: 1, col: 1 },
  4: { row: 1, col: 2 },
  5: { row: 1, col: 3 },
  6: { row: 1, col: 4 },
  2: { row: 2, col: 1 },
  7: { row: 2, col: 4 },
  1: { row: 3, col: 1 },
  8: { row: 3, col: 4 },
  0: { row: 4, col: 1 },
  11: { row: 4, col: 2 },
  10: { row: 4, col: 3 },
  9: { row: 4, col: 4 }
}

export interface ChartPalaceCell {
  gridRow: number
  gridCol: number
  branch: string
  name: string
  ganZhi: string
  isSoul: boolean
  isBody: boolean
  majorLabels: string[]
  minorLabels: string[]
  hasStars: boolean
}

function starLabel(s: { name: string; brightness?: string; mutagen?: string }): string {
  let t = s.name
  if (s.brightness) t += `·${s.brightness}`
  if (s.mutagen) t += `·化${s.mutagen}`
  return t
}

function buildChartPalaces(result: ZiweiResult): ChartPalaceCell[] {
  return result.palaces.map((p) => {
    const pos = PALACE_GRID_POS[p.index]
    return {
      gridRow: pos.row,
      gridCol: pos.col,
      branch: p.branch,
      name: p.name,
      ganZhi: p.ganZhi,
      isSoul: p.isSoul,
      isBody: p.isBody,
      majorLabels: p.majorStars.map(starLabel),
      minorLabels: p.minorStars.map(starLabel),
      hasStars: p.starLines.length > 0
    }
  })
}

Page({
  data: {
    result: {} as ZiweiResult,
    chartPalaces: [] as ChartPalaceCell[],
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
      chartPalaces: buildChartPalaces(data),
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
