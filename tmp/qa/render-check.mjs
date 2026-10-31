import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import { products, stores, inventory } from '../../src/data.js'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/tmp/qa/entry.jsx')
  let count = 0
  for (const lang of ['ko', 'en', 'zh']) {
    for (const populated of [false, true]) {
      const product = products[0]
      const item = { key: `${product.id}|M|${product.color.hex}`, productId: product.id, size: 'M', colorHex: product.color.hex, note: 'A relaxed fit, please.' }
      const state = { cart: populated ? [item] : [], favorites: populated ? [product.id] : [], pass: populated ? { code: 'KF-DEMO-0001', storeId: stores[0].id, brand: product.brand, items: [item], language: lang, status: 'ready', createdAt: new Date().toISOString() } : null, feedbacks: [], missions: {} }
      globalThis.localStorage = { getItem: key => key === 'kfit-lang' ? lang : JSON.stringify(state) }
      for (const mode of ['web', 'app']) {
        for (const page of ['home','explore','finder','fitting','stores','pass','staff','feedback','missions']) {
          globalThis.window = { location: { hash: `#/${mode}/${page}` } }
          const html = render()
          assert.ok(html.includes('K-FIT &amp; LOCAL'), `${mode}/${page}/${lang}: missing shell`)
          assert.ok(!html.includes('undefined'), `${mode}/${page}/${lang}: undefined text`)
          if (page === 'explore') assert.equal((html.match(/class="product-card /g) || []).length, 30)
          if (page === 'pass' && populated) assert.ok(html.includes('/fitting-qr.svg'))
          if (mode === 'app') assert.ok(html.includes('bottom-nav'))
          count++
        }
      }
    }
  }
  console.log(`PASS: ${count} server-render checks covering 9 screens, PC/app, 3 languages, empty/populated lists.`)
} finally {
  await server.close()
}

