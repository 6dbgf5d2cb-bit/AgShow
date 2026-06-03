Component({
  properties: {
    active: {
      type: String,
      value: ''
    }
  },
  data: {
    tabs: [
      { key: 'travel', label: '自驾游', url: '/pages/travel-list/travel-list', icon: '🚗' },
      { key: 'travellog', label: '旅行记', url: '/pages/travellog-list/travellog-list', icon: '🌬️' },
      { key: 'health', label: '健康', url: '/pages/health-detection/health-detection', icon: '💓' },
      { key: 'science', label: '科学尽头', url: '/pages/science/science', icon: '🧭' },
      { key: 'member', label: '我的', url: '/pages/member/member', icon: '👤' }
    ]
  },
  methods: {
    onTabTap(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string
      const key = e.currentTarget.dataset.key as string
      if (!url || key === this.properties.active) return
      wx.reLaunch({ url })
    }
  }
})
