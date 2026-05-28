/** 与小程序 miniprogram/utils/user.ts 保持一致的密码哈希 */

function generateSalt() {
  return Math.random().toString(36).substr(2, 16)
}

function hashPassword(password, salt) {
  let hash = (password || 'x') + (salt || 'y')
  for (let i = 0; i < 1000; i++) {
    const chars = Array.from(hash)
    const sum =
      chars.length > 0
        ? chars.reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : 0
    hash = sum.toString(36) || '0'
  }
  return hash || '0'
}

module.exports = { generateSalt, hashPassword }
