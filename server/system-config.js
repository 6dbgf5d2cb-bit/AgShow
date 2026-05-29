/**
 * 管理后台系统配置（角色/模块/首页权限）— 云端持久化
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'system_config.json')

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveConfig(config) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}

function getSystemConfig() {
  return loadConfig()
}

function saveSystemConfig(body) {
  const prev = loadConfig()
  const now = Date.now()
  const next = {
    ...prev,
    ...body,
    updatedAt: now,
    adminManagedAt: now
  }
  saveConfig(next)
  return next
}

module.exports = { getSystemConfig, saveSystemConfig }
