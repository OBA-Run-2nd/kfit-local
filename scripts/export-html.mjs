import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { Script } from 'node:vm'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const result = await build({
  root,
  base: './',
  build: { write: false, cssCodeSplit: false, modulePreload: false, assetsInlineLimit: Infinity },
})
if (Array.isArray(result)) throw new Error('Expected one application build.')
const chunks = result.output.filter(asset => asset.type === 'chunk')
const styles = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))
const index = result.output.find(asset => asset.fileName === 'index.html')
if (chunks.length !== 1 || !index || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('The single-file export requires one self-contained application chunk.')
}
const svgData = async name => `data:image/svg+xml;base64,${(await readFile(resolve(root, 'public', name))).toString('base64')}`
const qr = await svgData('fitting-qr.svg')
const icon = await svgData('kfit.svg')
let javascript = chunks[0].code.replaceAll('/fitting-qr.svg', qr)
// Validate that this bundle can run as a classic inline script from file://.
// A missing bundled dependency/import must fail export instead of yielding a blank file.
new Script(javascript, { filename: 'kfit-share.js' })
javascript = javascript.replace(/<\/script/gi, '<\\/script')
let css = styles.map(asset => asset.source.toString()).join('\n')
// Use system fonts so an offline font request never delays the local document.
css = css.replace(/@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')\s*;/gi, '')
css += '\n:root{font-family:"Malgun Gothic","Apple SD Gothic Neo",Arial,sans-serif}\n'
css = css.replace(/<\/style/gi, '<\\/style')
let html = index.source.toString()
html = html.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, '')
html = html.replace(/<link\b(?=[^>]*\brel=["'](?:stylesheet|modulepreload)["'])[^>]*>/gi, '')
html = html.replace(/href=["'](?:\.\/|\/)?kfit\.svg["']/g, `href="${icon}"`)
html = html.replace('</head>', () => `<style>${css}</style>\n</head>`)
// Use replacement callbacks: a bundle can contain literal $& / $' sequences.
html = html.replace('</body>', () => `<script>(()=>{${javascript}\n})();</script>\n</body>`)
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\brel=["']stylesheet["']/i.test(html) || html.includes('/fitting-qr.svg')) {
  throw new Error('A local script, stylesheet, or QR dependency was not inlined.')
}
const output = resolve(root, 'K-Fit_Local_공유용.html')
await writeFile(output, html, 'utf8')
console.log(`\nSingle HTML exported: ${output}\nSize: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`)
