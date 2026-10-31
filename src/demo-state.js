import { inventory, missions, productById, stores, brandById } from './data.js'

// The same option totals are used by customer and staff views.
export function stockLocation(product, storeId, size, colorHex) {
  const total = inventory(product, storeId, size, colorHex)
  const zone = ['A', 'B', 'C', 'D', 'E'][product.index % 5]
  const floorQuantity = total > 0 ? 1 : 0
  return {
    total, floorQuantity, stockroomQuantity: total - floorQuantity,
    floor: `1층 ${zone}존 · 행거 ${zone}-${String(product.index % 8 + 1).padStart(2, '0')}`,
    stockroom: `창고 ${zone}구역 · 선반 ${zone}-${String(product.index % 6 + 1).padStart(2, '0')}`,
  }
}

export function couponStatus(coupon, now = Date.now()) {
  if (coupon.usedAt) return 'couponUsed'
  return Date.parse(coupon.expiresAt) <= now ? 'couponExpired' : 'couponAvailable'
}

function issueCoupon(mission, at) {
  return {
    id: `reward-${mission.id}`, missionId: mission.id,
    code: `KF-${mission.id.toUpperCase()}-DEMO`, ...mission.coupon,
    issuedAt: at, expiresAt: new Date(Date.parse(at) + mission.coupon.validDays * 86400000).toISOString(), usedAt: null,
  }
}

// Completing a mission and issuing its one coupon is a single state update.
export function completeMission(state, id, details = {}, at = new Date().toISOString()) {
  const mission = missions.find(m => m.id === id)
  if (!mission || state.missions[id]?.status === 'completed') return state
  const coupons = state.coupons || []
  return {
    ...state,
    missions: { ...state.missions, [id]: { ...details, status: 'completed', at } },
    coupons: coupons.some(c => c.missionId === id) ? coupons : [...coupons, issueCoupon(mission, at)],
  }
}

export function restoreCoupons(state) {
  const coupons = Array.isArray(state.coupons) ? state.coupons.filter(c => missions.some(m => m.id === c.missionId) && Number.isFinite(Date.parse(c.expiresAt))) : []
  for (const mission of missions) {
    const progress = state.missions[mission.id]
    if (progress?.status === 'completed' && !coupons.some(c => c.missionId === mission.id)) {
      const at = Number.isFinite(Date.parse(progress.at)) ? progress.at : new Date().toISOString()
      coupons.push(issueCoupon(mission, at))
    }
  }
  return { ...state, coupons }
}

export function useCoupon(state, id, at = new Date().toISOString()) {
  return { ...state, coupons: (state.coupons || []).map(c => c.id === id && couponStatus(c, Date.parse(at)) === 'couponAvailable' ? { ...c, usedAt: at } : c) }
}

// Explicit onsite lookup simulation. Creating a pass never opens a staff request.
export function readDemoPass(pass, code) {
  if (!pass || code.trim() !== pass.code || !brandById(pass.brand) || !stores.some(s => s.id === pass.storeId) || !Array.isArray(pass.items) || !pass.items.length) return null
  if (pass.items.some(item => {
    const product = productById(item.productId)
    return !product || product.brand !== pass.brand || !product.sizes.includes(item.size) || !product.colors.some(c => c.hex === item.colorHex)
  })) return null
  return pass
}
