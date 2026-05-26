import { MemberLevelConfig } from '../../utils/user'

Page({
  data: {
    levels: [] as typeof MemberLevelConfig[]
  },

  onLoad() {
    this.loadLevels()
  },

  loadLevels() {
    const levels = Object.values(MemberLevelConfig)
    this.setData({ levels })
  },

  goBack() {
    wx.navigateBack()
  }
})