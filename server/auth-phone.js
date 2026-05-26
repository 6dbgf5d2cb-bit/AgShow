/**
 * 小程序服务端：微信登录 / 手机号 / 用户库（多设备共享）
 *
 * 环境变量：
 *   WX_APPID=小程序AppID
 *   WX_SECRET=小程序AppSecret
 *   PORT=3000
 *
 * 启动：node server/auth-phone.js
 * 小程序 miniprogram/config/api.ts：auth.baseUrl = 'https://你的域名'（需 HTTPS）
 *
 * 用户接口：
 *   GET  /api/users         获取全部用户
 *   POST /api/users/upsert  新增或更新用户
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const APPID = process.env.WX_APPID || ''
const SECRET = process.env.WX_SECRET || ''
const PORT = Number(process.env.PORT || 3000)

let accessToken = ''
let tokenExpireAt = 0

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpireAt) return accessToken
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.errmsg || '获取 access_token 失败')
  }
  accessToken = data.access_token
  tokenExpireAt = Date.now() + (data.expires_in - 300) * 1000
  return accessToken
}

async function code2Session(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json()
  if (data.errcode) throw new Error(data.errmsg || 'code2Session 失败')
  return data
}

async function getPhoneByCode(phoneCode) {
  const token = await getAccessToken()
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: phoneCode })
  })
  const data = await res.json()
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || '解密手机号失败')
  }
  return data.phone_info?.purePhoneNumber || data.phone_info?.phoneNumber
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(JSON.stringify(data))
}

const USERS_FILE = path.join(__dirname, 'data', 'users.json')

function loadUserMap() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveUserMap(map) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(map, null, 2), 'utf8')
}

function upsertUserInMap(user) {
  if (!user || !user.userId) {
    throw new Error('userId required')
  }
  const map = loadUserMap()
  map[user.userId] = { ...map[user.userId], ...user, updatedAt: Date.now() }
  saveUserMap(map)
  return map[user.userId]
}

function listAllUsers() {
  const map = loadUserMap()
  return Object.values(map).sort((a, b) => (b.registerTime || 0) - (a.registerTime || 0))
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end()
    return
  }

  try {
    const body = await readBody(req)

    if (req.url === '/auth/wechat' && req.method === 'POST') {
      const session = await code2Session(body.code)
      send(res, 200, { openId: session.openid, unionId: session.unionid })
      return
    }

    if (req.url === '/auth/phone' && req.method === 'POST') {
      const phone = await getPhoneByCode(body.code)
      send(res, 200, { phone })
      return
    }

    if (req.url === '/api/users' && req.method === 'GET') {
      send(res, 200, { users: listAllUsers() })
      return
    }

    if (req.url === '/api/users/upsert' && req.method === 'POST') {
      const user = upsertUserInMap(body)
      send(res, 200, { user })
      return
    }

    send(res, 404, { message: 'not found' })
  } catch (e) {
    send(res, 500, { message: e.message || 'server error' })
  }
})

if (!APPID || !SECRET) {
  console.warn('请设置环境变量 WX_APPID、WX_SECRET')
}

server.listen(PORT, () => {
  console.log(`Auth server http://127.0.0.1:${PORT}`)
  console.log('  POST /auth/wechat       { code }')
  console.log('  POST /auth/phone        { code }')
  console.log('  GET  /api/users')
  console.log('  POST /api/users/upsert  <User JSON>')
  console.log(`  Users DB: ${USERS_FILE}`)
})
