/**
 * 忘记密码：短信 / 邮箱验证码
 *
 * 环境变量（可选）：
 *   RESET_CODE_DEBUG=true     开发时在接口响应中返回验证码（勿用于生产）
 *   SMS_HOOK_URL              POST { phone, message, code } 对接短信网关
 *   EMAIL_HOOK_URL            POST { email, subject, html, code }
 *   未配置网关时仅写日志；开发可设 RESET_CODE_DEBUG=true 在响应中返回验证码
 */
const fs = require('fs')
const path = require('path')
const { generateSalt, hashPassword } = require('./password-crypto')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const CODES_FILE = path.join(DATA_DIR, 'reset_codes.json')
const CODE_TTL_MS = 10 * 60 * 1000
const RATE_LIMIT_MS = 60 * 1000
const DEBUG = process.env.RESET_CODE_DEBUG === 'true'

function loadCodes() {
  try {
    const raw = fs.readFileSync(CODES_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveCodes(map) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(CODES_FILE, JSON.stringify(map, null, 2), 'utf8')
}

function codeKey(channel, target) {
  return `${channel}:${target}`
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function findUserByTarget(users, channel, target) {
  if (channel === 'sms') {
    const phone = normalizePhone(target)
    return users.find((u) => normalizePhone(u.phone) === phone) || null
  }
  const email = normalizeEmail(target)
  return users.find((u) => normalizeEmail(u.email) === email) || null
}

async function sendSms(phone, code) {
  const message = `【AgShow】您的验证码为 ${code}，10分钟内有效，请勿泄露。`
  const hook = process.env.SMS_HOOK_URL || ''
  if (hook) {
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, code })
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `短信网关错误(${res.status})`)
    }
    return
  }
  console.log(`[password-reset][sms] ${phone} => ${code}`)
}

async function sendEmail(email, code) {
  const subject = 'AgShow 密码找回验证码'
  const html = `<p>您的验证码为 <b>${code}</b>，10 分钟内有效。如非本人操作请忽略。</p>`
  const hook = process.env.EMAIL_HOOK_URL || ''
  if (hook) {
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subject, html, code })
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `邮件网关错误(${res.status})`)
    }
    return
  }

  console.log(`[password-reset][email] ${email} => ${code}`)
}

/**
 * @param {{ channel: 'sms'|'email', phone?: string, email?: string }} body
 */
async function handleSendResetCode(body, listAllUsers) {
  const channel = body.channel === 'email' ? 'email' : 'sms'
  const target =
    channel === 'sms'
      ? normalizePhone(body.phone)
      : normalizeEmail(body.email)

  if (channel === 'sms' && !/^1[3-9]\d{9}$/.test(target)) {
    throw new Error('请输入有效的11位手机号')
  }
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    throw new Error('请输入有效的邮箱地址')
  }

  const users = listAllUsers()
  const user = findUserByTarget(users, channel, target)
  if (!user) {
    return {
      message: '若该账号已注册，验证码将发送到您的手机/邮箱',
      sent: false
    }
  }

  const key = codeKey(channel, target)
  const codes = loadCodes()
  const existing = codes[key]
  if (existing && Date.now() - existing.sentAt < RATE_LIMIT_MS) {
    throw new Error('发送过于频繁，请稍后再试')
  }

  const code = generateCode()
  codes[key] = {
    code,
    userId: user.userId,
    channel,
    target,
    sentAt: Date.now(),
    expiresAt: Date.now() + CODE_TTL_MS
  }
  saveCodes(codes)

  if (channel === 'sms') {
    await sendSms(target, code)
  } else {
    await sendEmail(target, code)
  }

  const result = {
    message: channel === 'sms' ? '验证码已发送至手机' : '验证码已发送至邮箱',
    sent: true
  }
  if (DEBUG) {
    result.debugCode = code
  }
  return result
}

/**
 * @param {{ channel, phone?, email?, code, newPassword }} body
 */
function handleResetPassword(body, listAllUsers, saveUserInMap) {
  const channel = body.channel === 'email' ? 'email' : 'sms'
  const target =
    channel === 'sms'
      ? normalizePhone(body.phone)
      : normalizeEmail(body.email)
  const code = String(body.code || '').trim()
  const newPassword = String(body.newPassword || '')

  if (!code || code.length !== 6) {
    throw new Error('请输入6位验证码')
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('新密码不少于6位')
  }

  const key = codeKey(channel, target)
  const codes = loadCodes()
  const record = codes[key]
  if (!record || record.code !== code) {
    throw new Error('验证码错误或已失效')
  }
  if (Date.now() > record.expiresAt) {
    delete codes[key]
    saveCodes(codes)
    throw new Error('验证码已过期，请重新获取')
  }

  const users = listAllUsers()
  const user = users.find((u) => u.userId === record.userId)
  if (!user) {
    throw new Error('用户不存在')
  }

  const salt = generateSalt()
  const updated = {
    ...user,
    passwordSalt: salt,
    passwordHash: hashPassword(newPassword, salt),
    lastPasswordChangeTime: Date.now(),
    updatedAt: Date.now(),
    loginFailCount: 0,
    lockTime: 0
  }
  saveUserInMap(updated)

  delete codes[key]
  saveCodes(codes)

  return {
    message: '密码已重置，请使用新密码登录',
    userId: updated.userId,
    username: updated.username
  }
}

/** 微信已验证手机号：与账号绑定手机一致时可免验证码；否则需短信验证码 */
function handleResetByWechatPhone(body, listAllUsers, saveUserInMap, verifiedPhone) {
  const phone = normalizePhone(verifiedPhone || body.phone)
  const newPassword = String(body.newPassword || '')
  const code = String(body.code || '').trim()
  const wxVerified = !!body.phoneCode && !!verifiedPhone

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号无效')
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('新密码不少于6位')
  }

  const users = listAllUsers()
  const user = findUserByTarget(users, 'sms', phone)
  if (!user) {
    throw new Error('该手机号未绑定任何账号')
  }

  const boundPhone = normalizePhone(user.phone)
  if (wxVerified && boundPhone === phone) {
    // 微信实名手机号与注册手机一致，直接重置
  } else if (code) {
    const key = codeKey('sms', phone)
    const codes = loadCodes()
    const record = codes[key]
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      throw new Error('验证码错误或已过期')
    }
    delete codes[key]
    saveCodes(codes)
  } else {
    throw new Error('请先获取短信验证码，或使用与注册信息一致的微信手机号')
  }

  const salt = generateSalt()
  const updated = {
    ...user,
    passwordSalt: salt,
    passwordHash: hashPassword(newPassword, salt),
    lastPasswordChangeTime: Date.now(),
    updatedAt: Date.now(),
    loginFailCount: 0,
    lockTime: 0
  }
  saveUserInMap(updated)
  return {
    message: '密码已重置',
    userId: updated.userId,
    username: updated.username
  }
}

module.exports = {
  handleSendResetCode,
  handleResetPassword,
  handleResetByWechatPhone
}
