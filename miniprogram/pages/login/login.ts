import { login, getCurrentSession, LoginRequest, loginWithWeChat, loginWithPhoneNumber } from '../../utils/user'
import {
  wxLoginAsync,
  getUserProfileAsync,
  getLocalWechatOpenId,
  getLocalPhoneFromCode,
  fetchWechatSession,
  fetchPhoneNumber,
  ensurePrivacyAuthorized,
  parsePhoneAuthError,
  isPhoneAuthSuccess
} from '../../utils/auth'
import { API_CONFIG } from '../../config/api'

Page({
  data: {
    username: '',
    password: '',
    rememberMe: false,
    loading: false,
    wxLoading: false,
    phoneLoading: false,
    errorMessage: '',
    privacyTip: '',
    showPassword: false,
    showAccountLogin: false,
    showPhoneModal: false,
    manualPhone: ''
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value, errorMessage: '' })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value, errorMessage: '' })
  },

  onManualPhoneInput(e: any) {
    this.setData({ manualPhone: e.detail.value, errorMessage: '' })
  },

  onRememberMeChange() {
    this.setData({ rememberMe: !this.data.rememberMe })
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  toggleAccountLogin() {
    this.setData({
      showAccountLogin: !this.data.showAccountLogin,
      errorMessage: ''
    })
  },

  noop() {},

  onAgreePrivacy() {
    this.setData({ privacyTip: '', errorMessage: '' })
  },

  navigateAfterLogin() {
    wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/member/member' })
    }, 1500)
  },

  async onLoad() {
    const session = getCurrentSession()
    if (session) {
      wx.redirectTo({ url: '/pages/member/member' })
      return
    }

    const hasServer = !!API_CONFIG.auth?.baseUrl?.trim()
    if (!hasServer) {
      this.setData({
        privacyTip: '未配置服务端时，一键登录在真机需企业认证；模拟器请用「手机号登录」'
      })
    }

    const ok = await ensurePrivacyAuthorized()
    if (!ok) {
      this.setData({
        privacyTip: '请先阅读并同意《用户隐私保护指引》后再使用一键登录'
      })
    }
  },

  async onWeChatLogin() {
    if (this.data.wxLoading || this.data.phoneLoading) return

    this.setData({ wxLoading: true, errorMessage: '' })

    try {
      const wxCode = await wxLoginAsync()
      let openId = getLocalWechatOpenId()
      let nickname = '微信用户'
      let avatarUrl = ''

      try {
        const profile = await getUserProfileAsync()
        nickname = profile.nickName
        avatarUrl = profile.avatarUrl
      } catch {
        // 可拒绝头像昵称
      }

      try {
        const server = await fetchWechatSession(wxCode)
        if (server?.openId) openId = server.openId
      } catch {
        // 未配置或请求失败则用本机 openId
      }

      await loginWithWeChat({ wxCode, openId, nickname, avatarUrl })
      this.setData({ wxLoading: false })
      this.navigateAfterLogin()
    } catch (error: any) {
      this.setData({
        wxLoading: false,
        errorMessage: error.message || '微信登录失败'
      })
    }
  },

  /** 本机号码一键登录（微信组件回调） */
  async onGetPhoneNumber(e: any) {
    if (this.data.phoneLoading) return

    const detail = e.detail || {}

    if (!isPhoneAuthSuccess(detail)) {
      const msg = parsePhoneAuthError(detail)
      this.setData({ errorMessage: msg })
      wx.showModal({
        title: '一键登录不可用',
        content: msg + '。是否改用手机号登录？',
        confirmText: '手机号登录',
        success: (res) => {
          if (res.confirm) this.onManualPhoneLogin()
        }
      })
      return
    }

    await this.doPhoneLogin(detail.code)
  },

  async doPhoneLogin(phoneCode: string) {
    this.setData({ phoneLoading: true, errorMessage: '' })

    try {
      let phone = ''
      let openId = getLocalWechatOpenId()
      const hasServer = !!API_CONFIG.auth?.baseUrl?.trim()

      if (hasServer) {
        const server = await fetchPhoneNumber(phoneCode)
        if (server?.phone) {
          phone = server.phone
          if (server.openId) openId = server.openId
        }
      } else {
        // 无服务端：演示模式用 code 映射本机号（非真实号码）
        phone = getLocalPhoneFromCode(phoneCode)
        wx.showToast({
          title: '演示模式已登录',
          icon: 'none',
          duration: 2000
        })
      }

      if (!phone) {
        throw new Error('未能获取手机号，请配置服务端或使用手机号登录')
      }

      await loginWithPhoneNumber({ phone, openId })
      this.setData({ phoneLoading: false })
      this.navigateAfterLogin()
    } catch (error: any) {
      this.setData({
        phoneLoading: false,
        errorMessage: error.message || '手机号登录失败'
      })
    }
  },

  onManualPhoneLogin() {
    const cached = wx.getStorageSync('device_bound_phone') as string
    this.setData({
      showPhoneModal: true,
      manualPhone: cached || '',
      errorMessage: ''
    })
  },

  closePhoneModal() {
    this.setData({ showPhoneModal: false })
  },

  async confirmManualPhoneLogin() {
    const phone = (this.data.manualPhone || '').trim()
    const phoneRegex = /^1[3-9]\d{9}$/

    if (!phoneRegex.test(phone)) {
      this.setData({ errorMessage: '请输入正确的11位手机号' })
      return
    }

    wx.setStorageSync('device_bound_phone', phone)
    this.setData({ phoneLoading: true, showPhoneModal: false, errorMessage: '' })

    try {
      const openId = getLocalWechatOpenId()
      await loginWithPhoneNumber({ phone, openId })
      this.setData({ phoneLoading: false })
      this.navigateAfterLogin()
    } catch (error: any) {
      this.setData({
        phoneLoading: false,
        errorMessage: error.message || '登录失败'
      })
    }
  },

  async onLogin() {
    const { username, password, rememberMe } = this.data

    if (!username.trim()) {
      this.setData({ errorMessage: '请输入用户名' })
      return
    }
    if (!password.trim()) {
      this.setData({ errorMessage: '请输入密码' })
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      await login({
        username: username.trim(),
        password: password.trim(),
        rememberMe
      })
      this.setData({ loading: false })
      this.navigateAfterLogin()
    } catch (error: any) {
      this.setData({
        errorMessage: error.message || '登录失败',
        loading: false
      })
    }
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  goToForgotPassword() {
    wx.showToast({ title: '忘记密码功能开发中', icon: 'none' })
  }
})
