Component({
  options: {
    multipleSlots: true
  },
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: true
    },
    theme: {
      type: String,
      value: 'default'
    },
    fixed: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onBackTap() {
      const pages = getCurrentPages()
      this.triggerEvent('back', {}, { bubbles: true, composed: true })
      // 若页面未监听 back 事件，则默认返回上一页
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      }
    }
  }
})
