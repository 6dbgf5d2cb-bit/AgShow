import {
  sendPasswordResetCode,
  resetPasswordWithCode,
  resetPasswordWithWechatPhone,
  type ResetChannel
} from '../../utils/password-reset-api'
import { pullRemoteUsersAndMerge } from '../../utils/user'
import { isPhoneAuthSuccess, parsePhoneAuthError } from '../../utils/auth'
import { hasRemoteAuth } from '../../utils/auth'

Page({
  data: {
    channel: 'sms' as ResetChannel,
    phone: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
    countdown: 0,
    sendingCode: false,
    loading: false,
    wxPhoneLoading: false,
    showPassword: false,
    showConfirmPassword: false,
    errorMessage: '',
    successMessage: '',
    debugCode: ''
  },

  countdownTimer: null as ReturnType<typeof setInterval> | null,

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },

  goToLogin() {
    wx.navigateBack()
  },

  setChannel(e: WechatMiniprogram.TouchEvent) {
    const channel = (e.currentTarget.dataset.channel as ResetChannel) || 'sms'
    this.setData({
      channel,
      errorMessage: '',
      successMessage: '',
      debugCode: ''
    })
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ phone: e.detail.value, errorMessage: '' })
  },

  onEmailInput(e: WechatMiniprogram.Input) {
    this.setData({ email: e.detail.value, errorMessage: '' })
  },

  onCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ code: e.detail.value, errorMessage: '' })
  },

  onNewPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ newPassword: e.detail.value, errorMessage: '' })
  },

  onConfirmPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ confirmPassword: e.detail.value, errorMessage: '' })
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  toggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword })
  },

  startCountdown() {
    this.setData({ countdown: 60 })
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.countdownTimer = setInterval(() => {
      const next = this.data.countdown - 1
      if (next <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer)
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown: next })
      }
    }, 1000)
  },

  async sendCode() {
    if (!hasRemoteAuth()) {
      this.setData({ errorMessage: '未配置云托管，无法发送验证码' })
      return
    }

    const { channel, phone, email } = this.data
    if (channel === 'sms' && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      this.setData({ errorMessage: '请输入有效的11位手机号' })
      return
    }
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      this.setData({ errorMessage: '请输入有效的邮箱' })
      return
    }

    this.setData({ sendingCode: true, errorMessage: '', successMessage: '' })

    try {
      const res = await sendPasswordResetCode({
        channel,
        phone: channel === 'sms' ? phone.trim() : undefined,
        email: channel === 'email' ? email.trim() : undefined
      })
      this.setData({
        successMessage: res.message,
        debugCode: res.debugCode || ''
      })
      this.startCountdown()
    } catch (e: unknown) {
      this.setData({
        errorMessage: e instanceof Error ? e.message : '发送失败'
      })
    } finally {
      this.setData({ sendingCode: false })
    }
  },

  validatePasswords(): boolean {
    const { newPassword, confirmPassword } = this.data
    if (newPassword.length < 6) {
      this.setData({ errorMessage: '新密码不少于6位' })
      return false
    }
    if (newPassword !== confirmPassword) {
      this.setData({ errorMessage: '两次输入的密码不一致' })
      return false
    }
    if (!this.data.code.trim() || this.data.code.trim().length !== 6) {
      this.setData({ errorMessage: '请输入6位验证码' })
      return false
    }
    return true
  },

  async submitReset() {
    if (!this.validatePasswords()) return

    const { channel, phone, email, code, newPassword } = this.data
    this.setData({ loading: true, errorMessage: '', successMessage: '' })

    try {
      const res = await resetPasswordWithCode({
        channel,
        phone: channel === 'sms' ? phone.trim() : undefined,
        email: channel === 'email' ? email.trim() : undefined,
        code: code.trim(),
        newPassword: newPassword.trim()
      })
      await pullRemoteUsersAndMerge()
      wx.showModal({
        title: '重置成功',
        content: res.username
          ? `账号 ${res.username} 密码已更新，请登录`
          : res.message,
        showCancel: false,
        success: () => wx.navigateBack()
      })
    } catch (e: unknown) {
      this.setData({
        errorMessage: e instanceof Error ? e.message : '重置失败'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  validateNewPasswordOnly(): boolean {
    const { newPassword, confirmPassword } = this.data
    if (newPassword.length < 6) {
      this.setData({ errorMessage: '新密码不少于6位' })
      return false
    }
    if (newPassword !== confirmPassword) {
      this.setData({ errorMessage: '两次输入的密码不一致' })
      return false
    }
    return true
  },

  async onWechatPhoneReset(e: WechatMiniprogram.ButtonGetPhoneNumber) {
    const detail = e.detail || {}
    if (!isPhoneAuthSuccess(detail)) {
      this.setData({ errorMessage: parsePhoneAuthError(detail) })
      return
    }
    if (!this.validateNewPasswordOnly()) return

    this.setData({ wxPhoneLoading: true, errorMessage: '' })

    try {
      const res = await resetPasswordWithWechatPhone({
        phoneCode: detail.code,
        code: this.data.code.trim() || undefined,
        newPassword: this.data.newPassword.trim()
      })
      await pullRemoteUsersAndMerge()
      wx.showModal({
        title: '重置成功',
        content: `账号 ${res.username || ''} 密码已更新`,
        showCancel: false,
        success: () => wx.navigateBack()
      })
    } catch (err: unknown) {
      this.setData({
        errorMessage: err instanceof Error ? err.message : '重置失败'
      })
    } finally {
      this.setData({ wxPhoneLoading: false })
    }
  }
})
