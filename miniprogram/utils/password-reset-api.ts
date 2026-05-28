/**
 * 忘记密码：短信 / 邮箱验证码（云托管）
 */
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'

export type ResetChannel = 'sms' | 'email'

export interface SendResetCodeResult {
  message: string
  sent?: boolean
  /** 仅开发环境 RESET_CODE_DEBUG=true 时返回 */
  debugCode?: string
}

export interface ResetPasswordResult {
  message: string
  userId?: string
  username?: string
}

export async function sendPasswordResetCode(params: {
  channel: ResetChannel
  phone?: string
  email?: string
}): Promise<SendResetCodeResult> {
  if (!isRemoteApiEnabled()) {
    throw new Error('未配置云托管，无法发送验证码')
  }
  return remoteRequest<SendResetCodeResult>('/api/auth/send-reset-code', 'POST', params)
}

export async function resetPasswordWithCode(params: {
  channel: ResetChannel
  phone?: string
  email?: string
  code: string
  newPassword: string
}): Promise<ResetPasswordResult> {
  if (!isRemoteApiEnabled()) {
    throw new Error('未配置云托管，无法重置密码')
  }
  return remoteRequest<ResetPasswordResult>('/api/auth/reset-password', 'POST', params)
}

/** 微信验证手机号 + 验证码重置（phoneCode 为 getPhoneNumber 返回的 code） */
export async function resetPasswordWithWechatPhone(params: {
  phoneCode?: string
  phone?: string
  code?: string
  newPassword: string
}): Promise<ResetPasswordResult> {
  if (!isRemoteApiEnabled()) {
    throw new Error('未配置云托管，无法重置密码')
  }
  return remoteRequest<ResetPasswordResult>('/api/auth/reset-password-phone', 'POST', params)
}
