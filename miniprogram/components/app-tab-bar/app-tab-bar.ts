import { inferTabActive } from '../../utils/tab-bar'

Component({
  properties: {
    /** 可手动指定高亮；留空则按当前路由自动推断 */
    active: {
      type: String,
      value: ''
    }
  },
  data: {
    currentActive: '',
    tabs: [
      { key: 'travel', label: '自驾游', url: '/pages/travel-list/travel-list', icon: '🚗' },
      { key: 'travellog', label: '旅行记', url: '/pages/travellog-list/travellog-list', icon: '🌬️' },
      {
        key: 'health',
        label: '健康',
        url: '/pages/health-detection/health-detection?tab=symptom',
        icon: '💓'
      },
      { key: 'science', label: '科学尽头', url: '/pages/science/science', icon: '🧭' },
      { key: 'member', label: '我的', url: '/pages/member/member', icon: '👤' }
    ]
  },
  lifetimes: {
    attached() {
      this.syncActive()
    }
  },
  pageLifetimes: {
    show() {
      this.syncActive()
    }
  },
  observers: {
    active() {
      this.syncActive()
    }
  },
  methods: {
    syncActive() {
      const pages = getCurrentPages()
      const route = pages[pages.length - 1]?.route || ''
      const inferred = inferTabActive(route)
      const explicit = (this.properties.active || '').trim()
      this.setData({
        currentActive: explicit || inferred
      })
    },
    onTabTap(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string
      const key = e.currentTarget.dataset.key as string
      if (!url || key === this.data.currentActive) return
      wx.reLaunch({ url })
    }
  }
})
