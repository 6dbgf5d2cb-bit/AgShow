import { getCurrentSession } from '../../utils/user'

Component({
  data: {},
  methods: {},
  onLoad() {
    const session = getCurrentSession()
    if (session) {
      wx.redirectTo({
        url: '/pages/member/member'
      })
      return
    }
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }
})