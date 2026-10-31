import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { products, stores, missions, inventory } from '../../src/data.js'
import { messages } from '../../src/i18n.js'
import { stockLocation, completeMission, restoreCoupons, useCoupon, couponStatus, readDemoPass } from '../../src/demo-state.js'

const at = '2026-10-31T00:00:00.000Z'
const initial = { cart: [], favorites: [], pass: null, missions: {}, feedbacks: [], coupons: [] }
const complete = completeMission(initial, missions[0].id, { note: 'A travel memory' }, at)
assert.equal(complete.coupons.length, 1)
assert.equal(complete.missions[missions[0].id].status, 'completed')
assert.equal(completeMission(complete, missions[0].id, {}, at), complete, 'Duplicate completion must not issue a second coupon')
const reloaded = restoreCoupons(JSON.parse(JSON.stringify(complete)))
assert.equal(reloaded.coupons.length, 1)
const legacy = restoreCoupons({ ...complete, coupons: undefined })
assert.equal(restoreCoupons(legacy).coupons.length, 1, 'Restoring an existing completed mission must not duplicate rewards')
assert.equal(useCoupon(initial, 'missing', at).coupons.length, 0)
const used = useCoupon(complete, complete.coupons[0].id, at)
assert.equal(couponStatus(used.coupons[0], Date.parse(at)), 'couponUsed')
assert.equal(useCoupon(used, used.coupons[0].id, '2026-11-01T00:00:00.000Z').coupons[0].usedAt, at)
assert.equal(couponStatus(complete.coupons[0], Date.parse('2026-12-01')), 'couponExpired')
assert.equal(useCoupon(complete, complete.coupons[0].id, '2026-12-01T00:00:00.000Z').coupons[0].usedAt, null)
let optionChecks = 0
for (const product of products) for (const store of stores) for (const size of product.sizes) for (const color of product.colors) {
  const result = stockLocation(product, store.id, size, color.hex)
  assert.equal(result.floorQuantity + result.stockroomQuantity, inventory(product, store.id, size, color.hex))
  assert.ok(result.floorQuantity >= 0 && result.stockroomQuantity >= 0)
  optionChecks++
}
const product = products[0]
const item = size => ({ key: `${product.id}|${size}|${product.color.hex}`, productId: product.id, size, colorHex: product.color.hex, note: 'Compare the fit' })
const pass = { code: 'KF-DEMO-0001', brand: product.brand, items: [item('M')], storeId: stores[0].id, language: 'en', status: 'pending', createdAt: at }
assert.equal(readDemoPass(pass, 'BAD'), null)
assert.equal(readDemoPass(null, pass.code), null)
assert.equal(readDemoPass(pass, pass.code), pass)
assert.equal(readDemoPass({ ...pass, storeId: 'missing' }, pass.code), null)
assert.equal(readDemoPass({ ...pass, items: [{ ...item('M'), size: 'INVALID' }] }, pass.code), null)
assert.equal(readDemoPass({ ...pass, items: [{ ...item('M'), colorHex: '#bad' }] }, pass.code), null)
assert.equal(readDemoPass({ ...pass, brand: 'discovery' }, pass.code), null)
for (const lang of ['en', 'zh']) assert.deepEqual(Object.keys(messages[lang]).sort(), Object.keys(messages.ko).sort())
assert.ok(new Set(missions.map(m => m.city)).size >= 5)
assert.notEqual(missions[0].city, missions[1].city)
for (const mission of missions) for (const lang of ['ko', 'en', 'zh']) {
  assert.equal(mission.steps[lang].length, 3)
  assert.ok(mission.place[lang] && mission.tip[lang] && mission.descriptions[lang])
  assert.equal(new URL(mission.source).hostname, 'english.visitkorea.or.kr')
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render, renderPickup } = await server.ssrLoadModule('/tmp/qa/entry.jsx')
  let guideChecks = 0
  for (const lang of ['ko', 'en', 'zh']) for (const mode of ['web', 'app']) for (const state of [initial, { ...initial, missions: { [missions[0].id]: { status: 'joined' } } }, complete, used]) {
    globalThis.localStorage = { getItem: key => key === 'kfit-lang' ? lang : JSON.stringify(state) }
    globalThis.window = { location: { hash: `#/${mode}/missions` } }
    const html = render()
    assert.equal((html.match(/class="mission-card guide-card"/g) || []).length, 6)
    assert.ok(!html.includes('mission-filters'), 'No destination selection before browsing')
    assert.ok(html.includes('data-city="busan"') && html.includes('data-city="jeju"') && html.includes('data-city="jeonju"'))
    assert.equal((html.match(/google.com\/maps\/dir\//g) || []).length, 6)
    assert.ok(html.includes(messages[lang].guideIdeas))
    if (state.coupons?.length) assert.ok(html.includes(complete.coupons[0].code))
    guideChecks++
  }
  globalThis.localStorage = { getItem: key => key === 'kfit-lang' ? 'ko' : JSON.stringify({ ...initial, pass, cart: pass.items }) }
  globalThis.window = { location: { hash: '#/web/staff' } }
  const landing = render()
  assert.ok(landing.includes('고객 QR 읽기 시연'))
  assert.ok(!landing.includes('pickup-card'), 'No item lookup before onsite scan')
  // Include both available and zero-stock sizes after a valid onsite lookup.
  const pickupHtml = renderPickup({ ...pass, items: product.sizes.map(item) })
  assert.equal((pickupHtml.match(/class="pickup-card /g) || []).length, product.sizes.length)
  assert.ok(pickupHtml.includes('매장 진열') && pickupHtml.includes('창고 보관') && pickupHtml.includes('사이즈별 전체 수량'))
  assert.ok(pickupHtml.includes('요청 옵션이 품절입니다.'))
  console.log(`PASS: coupon issuance/persistence/expiry/idempotency, ${optionChecks} customer/staff stock totals, QR lookup validation, ${guideChecks} mixed-guide renders and pre/post-scan staff renders.`)
} finally {
  await server.close()
}
