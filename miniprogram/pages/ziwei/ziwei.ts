import { generateZiwei } from '../../utils/ziwei-engine'
import {
  getHealthUsageStats,
  incrementZiweiUsage,
  saveHealthSharePayloadAsync
} from '../../utils/health-usage'

interface ZiweiForm {
  name: string
  gender: string
  calendarType: string
  birthDate: string
  birthTime: string
}

Page({
  data: {
    ziweiUsageCount: 0,
    form: {
      name: '',
      gender: '',
      calendarType: 'solar',
      birthDate: '',
      birthTime: ''
    } as ZiweiForm
  },

  onShow() {
    this.refreshUsageStats()
  },

  refreshUsageStats() {
    const stats = getHealthUsageStats()
    this.setData({ ziweiUsageCount: stats.ziwei || 0 })
  },

  goBack() {
    wx.navigateBack()
  },

  onInputChange(e: WechatMiniprogram.Input) {
    const field = e.currentTarget.dataset.field as keyof ZiweiForm
    const { form } = this.data
    this.setData({
      form: { ...form, [field]: e.detail.value }
    })
  },

  selectGender(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string
    const { form } = this.data
    this.setData({ form: { ...form, gender: value } })
  },

  selectCalendarType(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string
    const { form } = this.data
    this.setData({ form: { ...form, calendarType: value } })
  },

  onBirthDateChange(e: WechatMiniprogram.PickerChange) {
    const { form } = this.data
    this.setData({ form: { ...form, birthDate: e.detail.value as string } })
  },

  onBirthTimeChange(e: WechatMiniprogram.PickerChange) {
    const { form } = this.data
    this.setData({ form: { ...form, birthTime: e.detail.value as string } })
  },

  async submitZiwei() {
    const { form } = this.data

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!form.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    if (!form.birthDate) {
      wx.showToast({ title: '请选择出生日期', icon: 'none' })
      return
    }
    if (!form.birthTime) {
      wx.showToast({ title: '请选择出生时分', icon: 'none' })
      return
    }

    wx.showLoading({ title: '排盘中...', mask: true })

    try {
      const result = await generateZiwei(
        form.name,
        form.birthDate,
        form.birthTime,
        form.gender,
        form.calendarType
      )
      wx.hideLoading()

      incrementZiweiUsage()
      this.refreshUsageStats()

      const shareId = await saveHealthSharePayloadAsync(
        'ziwei',
        result,
        `${form.name.trim()}的紫微斗数`
      )
      wx.navigateTo({
        url: `/pages/ziwei-result/ziwei-result?shareId=${encodeURIComponent(shareId)}`
      })
    } catch (error: unknown) {
      wx.hideLoading()
      const msg = error instanceof Error ? error.message : '排盘失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  }
})
