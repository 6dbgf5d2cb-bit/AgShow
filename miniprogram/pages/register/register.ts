import { register, RegisterRequest, getCurrentSession } from '../../utils/user'
import { syncAllFromCloud } from '../../utils/cloud-sync'

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nickname: '',
    email: '',
    realName: '',
    gender: 'other' as 'male' | 'female' | 'other',
    birthday: '',
    region: '',
    loading: false,
    errorMessage: '',
    showPassword: false,
    showConfirmPassword: false
  },

  onInputChange(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value,
      errorMessage: ''
    })
  },

  onGenderChange(e: any) {
    this.setData({
      gender: e.currentTarget.dataset.value as 'male' | 'female' | 'other'
    })
  },

  onBirthdayChange(e: any) {
    this.setData({
      birthday: e.detail.value
    })
  },

  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  validateForm(): boolean {
    const { username, password, confirmPassword, phone } = this.data

    if (!username.trim()) {
      this.setData({ errorMessage: '请输入用户名' })
      return false
    }

    if (username.length < 3 || username.length > 20) {
      this.setData({ errorMessage: '用户名长度需在3-20个字符之间' })
      return false
    }

    if (!password.trim()) {
      this.setData({ errorMessage: '请输入密码' })
      return false
    }

    if (password.length < 6) {
      this.setData({ errorMessage: '密码长度需不少于6个字符' })
      return false
    }

    if (password !== confirmPassword) {
      this.setData({ errorMessage: '两次输入的密码不一致' })
      return false
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      this.setData({ errorMessage: '请输入有效的手机号' })
      return false
    }

    return true
  },

  async onRegister() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      const request: RegisterRequest = {
        username: this.data.username.trim(),
        password: this.data.password.trim(),
        phone: this.data.phone.trim(),
        nickname: this.data.nickname.trim() || this.data.username.trim(),
        email: this.data.email.trim() || '',
        realName: this.data.realName.trim() || '',
        gender: this.data.gender,
        birthday: this.data.birthday || undefined,
        region: this.data.region || undefined
      }

      await register(request)
      try {
        await syncAllFromCloud()
      } catch {
        // 注册已成功写入云端，拉取失败不阻断
      }

      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }, 1500)

    } catch (error: any) {
      this.setData({
        errorMessage: error.message || '注册失败',
        loading: false
      })
    }
  },

  goToLogin() {
    wx.navigateBack()
  },

  onLoad() {
    const session = getCurrentSession()
    if (session) {
      wx.redirectTo({
        url: '/pages/member/member'
      })
    }
  }
})