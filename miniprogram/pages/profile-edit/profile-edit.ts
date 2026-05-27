import { getCurrentSession, getUserById, updateUser, User } from '../../utils/user'
import { applyResolvedUrl, ensureCloudMediaUrl, resolveMediaUrlMap } from '../../utils/cloud-storage'

Page({
  data: {
    user: null as User | null,
    avatarUrl: '',
    nickname: '',
    gender: 'other' as 'male' | 'female' | 'other',
    birthday: '',
    region: '',
    phone: '',
    email: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    const session = getCurrentSession()
    if (!session) return

    const user = getUserById(session.userId)
    if (!user) return

    const avatar = user.avatarUrl || ''
    const map = await resolveMediaUrlMap(avatar ? [avatar] : [])

    this.setData({
      user,
      avatarUrl: applyResolvedUrl(avatar, map),
      nickname: user.nickname || '',
      gender: user.gender,
      birthday: user.birthday || '',
      region: user.region || '',
      phone: user.phone || '',
      email: user.email || ''
    })
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          avatarUrl: tempFilePath
        })
      },
      fail: (err) => {
        console.error('选择头像失败:', err)
      }
    })
  },

  onNicknameInput(e: any) {
    this.setData({ nickname: e.detail.value })
  },

  onGenderChange(e: any) {
    this.setData({ gender: e.currentTarget.dataset.value })
  },

  onBirthdayChange(e: any) {
    this.setData({ birthday: e.detail.value })
  },

  onRegionChange(e: any) {
    this.setData({ region: e.detail.value })
  },

  onPhoneInput(e: any) {
    this.setData({ phone: e.detail.value })
  },

  onEmailInput(e: any) {
    this.setData({ email: e.detail.value })
  },

  async saveProfile() {
    const session = getCurrentSession()
    if (!session || !this.data.user) return

    wx.showLoading({ title: '保存中', mask: true })
    let avatarUrl = this.data.avatarUrl
    try {
      avatarUrl = await ensureCloudMediaUrl(avatarUrl, 'avatars')
    } catch (e: any) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '头像上传失败', icon: 'none' })
      return
    }

    const updates: Partial<User> = {
      avatarUrl,
      nickname: this.data.nickname,
      gender: this.data.gender,
      birthday: this.data.birthday,
      region: this.data.region,
      phone: this.data.phone,
      email: this.data.email
    }

    const result = await updateUser(session.userId, updates)
    if (result) {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
    wx.hideLoading()
  },

  goBack() {
    wx.navigateBack()
  }
})