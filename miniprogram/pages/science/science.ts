Page({
  data: {
    items: [
      {
        id: 'bazi',
        title: '四柱八字',
        desc: '根据生辰八字推算人生运势、性格特征与命理分析',
        icon: '📖',
        url: '/pages/health-detection/health-detection?tab=bazi'
      },
      {
        id: 'ziwei',
        title: '紫微斗数',
        desc: '紫微十二宫位排盘，揭示人生轨迹与发展方向',
        icon: '🧭',
        url: '/pages/ziwei/ziwei'
      },
      {
        id: 'liuyao',
        title: '六爻金钱课',
        desc: '传统六爻起卦，预测吉凶与决策指引',
        icon: '🪙',
        url: '/pages/liuyao/liuyao'
      },
      {
        id: 'fengshui',
        title: '风水堪舆',
        desc: '宅向布局与环境气场分析（开发中）',
        icon: '🏔️',
        url: '/pages/fengshui/fengshui'
      }
    ]
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    if (url) wx.navigateTo({ url })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
