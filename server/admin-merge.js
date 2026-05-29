/**
 * 管理后台写入优先：防止普通用户端同步覆盖管理员已确定的字段
 */

const USER_ADMIN_FIELDS = ['roles', 'memberLevel', 'status', 'points']

function rev(item) {
  return item?.updatedAt || item?.updateTime || item?.publishTime || 0
}

function adminRev(item) {
  return item?.adminManagedAt || 0
}

function effectiveRev(item) {
  return Math.max(rev(item), adminRev(item))
}

/** 用户 upsert：保留已生效的管理端字段 */
function mergeUserUpsert(existing, incoming) {
  if (!existing) return { ...incoming, updatedAt: Date.now() }

  const eAdmin = adminRev(existing)
  const iAdmin = adminRev(incoming)

  if (eAdmin > iAdmin) {
    const merged = { ...incoming, adminManagedAt: eAdmin, updatedAt: Date.now() }
    USER_ADMIN_FIELDS.forEach((f) => {
      if (existing[f] !== undefined) merged[f] = existing[f]
    })
    return merged
  }

  if (eAdmin && !iAdmin) {
    const merged = { ...incoming, adminManagedAt: eAdmin, updatedAt: Date.now() }
    USER_ADMIN_FIELDS.forEach((f) => {
      if (existing[f] !== undefined) merged[f] = existing[f]
    })
    if (existing.passwordHash) {
      merged.passwordHash = existing.passwordHash
      merged.passwordSalt = existing.passwordSalt
    }
    return merged
  }

  if (effectiveRev(incoming) >= effectiveRev(existing)) {
    return { ...existing, ...incoming, updatedAt: Date.now() }
  }

  return { ...existing, updatedAt: Date.now() }
}

/** 内容（自驾游/旅行记）：管理端可锁定 status 等 */
function mergeContentUpsert(existing, incoming) {
  if (!existing) return { ...incoming, updateTime: Date.now() }

  const eAdmin = adminRev(existing)
  const iAdmin = adminRev(incoming)

  if (eAdmin > iAdmin) {
    return {
      ...incoming,
      status: existing.status,
      allowComments: existing.allowComments,
      adminManagedAt: eAdmin,
      updateTime: Date.now()
    }
  }

  if (eAdmin && !iAdmin) {
    return {
      ...incoming,
      status: existing.status,
      allowComments: existing.allowComments,
      adminManagedAt: eAdmin,
      updateTime: Date.now()
    }
  }

  if (effectiveRev(incoming) >= effectiveRev(existing)) {
    return { ...existing, ...incoming, updateTime: Date.now() }
  }

  return { ...existing, updateTime: Date.now() }
}

module.exports = {
  mergeUserUpsert,
  mergeContentUpsert,
  effectiveRev
}
