import {
  login,
  getCurrentSession,
  LoginRequest,
  loginWithWeChat,
  loginWithPhoneNumber,
  resetDefaultAdminPassword,
  DEFAULT_ADMIN_USERNAME
} from '../../utils/user'
import {
  wxLoginAsync,
  getUserProfileAsync,
  setStoredWechatOpenId,
  getStoredWechatOpenId,
  getLocalPhoneFromCode,
  fetchWechatSession,
  fetchPhoneNumber,
  ensurePrivacyAuthorized,
  parsePhoneAuthError,
  isPhoneAuthSuccess
} from '../../utils/auth'
import { hasRemoteAuth } from '../../utils/auth'
import { syncAllFromCloud } from '../../utils/cloud-sync'

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

  async navigateAfterLogin() {
    wx.showLoading({ title: '同步云端数据', mask: true })
    try {
      await syncAllFromCloud()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '部分数据同步失败'
      wx.showToast({ title: msg, icon: 'none', duration: 2500 })
    }
    wx.hideLoading()
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

    if (!hasRemoteAuth()) {
      this.setData({
        privacyTip: '未配置云托管时仅本机可见用户；请在 config/api.ts 开启 useCloudRun'
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
      let nickname = '微信用户'
      let avatarUrl = ''

      try {
        const profile = await getUserProfileAsync()
        nickname = profile.nickName
        avatarUrl = profile.avatarUrl
      } catch {
        // 可拒绝头像昵称
      }

      if (!hasRemoteAuth()) {
        throw new Error('未配置云托管，无法保存用户到后台，请在 config/api.ts 开启 useCloudRun')
      }

      const server = await fetchWechatSession(wxCode)
      if (!server?.openId) {
        throw new Error('无法获取微信身份，请检查云托管 WX_APPID、WX_SECRET')
      }
      setStoredWechatOpenId(server.openId)

      await loginWithWeChat({ wxCode, openId: server.openId, nickname, avatarUrl })
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
      let openId = ''
      if (!hasRemoteAuth()) {
        throw new Error('未配置云托管，无法保存用户到后台')
      }
      const server = await fetchPhoneNumber(phoneCode)
      if (!server?.phone) {
        throw new Error('未能获取手机号，请检查云托管 WX_APPID、WX_SECRET')
      }
      phone = server.phone
      if (server.openId) {
        openId = server.openId
        setStoredWechatOpenId(server.openId)
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
      const openId = getStoredWechatOpenId()
      await loginWithPhoneNumber({ phone, openId: openId || undefined })
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
    const name = this.data.username.trim().toLowerCase()
    if (name === DEFAULT_ADMIN_USERNAME) {
      wx.showModal({
        title: '重置管理员密码',
        content: `将把账号「${DEFAULT_ADMIN_USERNAME}」的密码重置为初始密码。重置后请立即登录并在设置中修改密码。`,
        confirmText: '重置',
        success: (res) => {
          if (!res.confirm) return
          resetDefaultAdminPassword()
          this.setData({
            username: DEFAULT_ADMIN_USERNAME,
            password: '',
            errorMessage: ''
          })
          wx.showToast({ title: '已重置，请输入初始密码登录', icon: 'success' })
        }
      })
      return
    }
    wx.navigateTo({ url: '/pages/forgot-password/forgot-password' })
  }
})
