import { guideMissions } from './guide-data.js'

export const brands = [
  { id: 'mlb', name: 'MLB', line: 'THE CITY IS YOUR FIELD', color: '#b9b1a1', ko: '도시를 즐기는 새로운 방식', en: 'Make the city your field', zh: '以城市為你的主場' },
  { id: 'discovery', name: 'Discovery', line: 'EXPEDITION', color: '#8b9b8b', ko: '일상과 아웃도어 사이', en: 'Everyday adventures', zh: '探索日常與戶外' },
  { id: 'duvetica', name: 'DUVETICA', line: 'ITALIAN LIFESTYLE', color: '#a5abb9', ko: '당신만의 이탈리안 감각', en: 'Your Italian state of mind', zh: '你的義式生活美學' },
  { id: 'sergio', name: 'SERGIO TACCHINI', line: 'ITALIAN TENNIS HERITAGE', color: '#aa9c7d', ko: '코트 밖에서도 우아하게', en: 'Elegance beyond the court', zh: '球場之外的優雅' },
  { id: 'supra', name: 'SUPRA', line: 'BEYOND THE STREETS', color: '#9a9c9d', ko: '자유롭게, 나답게', en: 'Move your own way', zh: '走自己的路' },
  { id: 'mlbkids', name: 'MLB KIDS', line: 'LITTLE BIG STYLE', color: '#b3a18d', ko: '작은 모험가의 큰 스타일', en: 'Big style for little explorers', zh: '小小冒險家的大風格' },
]

const types = ['jacket', 'knit', 'tee', 'pants', 'cap']
const colors = [
  { ko: '크림', en: 'Cream', zh: '奶油白', hex: '#d8d0bf' },
  { ko: '블랙', en: 'Black', zh: '黑色', hex: '#33383c' },
  { ko: '네이비', en: 'Navy', zh: '海軍藍', hex: '#3c4b62' },
  { ko: '세이지', en: 'Sage', zh: '鼠尾草綠', hex: '#99a38d' },
]
const names = {
  jacket: ['시티 라이트 자켓', 'City light jacket', '城市輕量外套'],
  knit: ['에센셜 릴랙스 니트', 'Essential relaxed knit', '經典寬鬆針織衫'],
  tee: ['데일리 로고 티셔츠', 'Daily logo T-shirt', '日常標誌上衣'],
  pants: ['컴포트 와이드 팬츠', 'Comfort wide pants', '舒適寬版長褲'],
  cap: ['클래식 커브 볼캡', 'Classic curved cap', '經典棒球帽'],
}
export const products = brands.flatMap((brand, bi) => types.map((type, ti) => ({
  id: `${brand.id}-${type}`, index: bi * 5 + ti, brand: brand.id, type,
  names: { ko: names[type][0], en: names[type][1], zh: names[type][2] },
  price: [189000, 139000, 69000, 129000, 49000][ti] + (bi === 2 ? 120000 : bi === 3 ? 40000 : 0),
  color: colors[(bi + ti) % colors.length], colors: [colors[(bi + ti) % 4], colors[(bi + ti + 1) % 4]],
  sizes: type === 'cap' ? ['FREE'] : bi === 5 ? ['120', '130', '140', '150'] : ['XS', 'S', 'M', 'L', 'XL'],
  sku: `DEMO-${brand.id.toUpperCase()}-${String(ti + 1).padStart(3, '0')}`,
  fit: ti === 3 ? 'wide' : ti === 4 ? 'regular' : 'relaxed',
  tag: ti === 0 ? 'NEW SEASON' : ti === 1 ? 'EDITOR’S PICK' : '',
})))

export const destinations = ['seoul', 'busan', 'jeju']
export const stores = [
  { id: 'myeongdong', area: 'myeongdong', names: { ko: '명동 브랜드 스토어', en: 'Myeongdong brand store', zh: '明洞品牌門市' }, distance: 0.8, address: '서울 중구 명동길 일대', hours: '11:00 – 21:00', x: 34, y: 64 },
  { id: 'seongsu', area: 'seongsu', names: { ko: '성수 브랜드 스토어', en: 'Seongsu brand store', zh: '聖水品牌門市' }, distance: 4.2, address: '서울 성동구 연무장길 일대', hours: '11:00 – 20:00', x: 76, y: 39 },
  { id: 'hongdae', area: 'hongdae', names: { ko: '홍대 브랜드 스토어', en: 'Hongdae brand store', zh: '弘大品牌門市' }, distance: 5.6, address: '서울 마포구 홍익로 일대', hours: '12:00 – 21:00', x: 19, y: 36 },
].map(s => ({ ...s, city: 'seoul' })).concat([
  { id: 'busan', city: 'busan', area: 'seomyeon', names: { ko: '부산 서면 브랜드 스토어', en: 'Busan Seomyeon brand store', zh: '釜山西面品牌門市' }, distance: 325, address: '부산 부산진구 서면 일대', hours: '11:00 – 21:00', x: 76, y: 72 },
  { id: 'jeju', city: 'jeju', area: 'jejucity', names: { ko: '제주시 브랜드 스토어', en: 'Jeju City brand store', zh: '濟州市品牌門市' }, distance: 455, address: '제주 제주시 연동 일대', hours: '11:00 – 20:00', x: 25, y: 90 },
])

// Deterministic demo inventory, by brand + store + product + size + color.
// Each location represents separate brand stores in the area, not a combined F&F store.
export function inventory(product, storeId, size, colorHex) {
  if (!product.sizes.includes(size) || !product.colors.some(c => c.hex === colorHex)) return 0
  const si = stores.findIndex(s => s.id === storeId)
  if (si < 0) return 0
  const seed = product.index * 7 + si * 3 + product.sizes.indexOf(size) + product.colors.findIndex(c => c.hex === colorHex)
  return seed % 5 === 0 ? 0 : (seed % 3) + 1
}

export const missions = guideMissions

export const brandById = id => brands.find(b => b.id === id)
export const productById = id => products.find(p => p.id === id)
export const money = value => `₩${value.toLocaleString('en-US')}`

// UI-only matching simulation. Uploaded pixels are never analysed or sent away.
export function recommend({ query = '', brand = 'all', category = 'all', budget = 1000000, size = '', seedId = '' }) {
  const q = query.toLowerCase()
  const categoryWords = { jacket: ['자켓', '재킷', '패딩', 'jacket', 'outer', '外套'], knit: ['니트', '가디건', 'knit', 'cardigan', '針織'], tee: ['티셔츠', 't-shirt', 'shirt', '上衣'], pants: ['바지', '팬츠', 'pants', 'trouser', '長褲'], cap: ['모자', '볼캡', 'cap', 'hat', '帽'] }
  const inferred = Object.keys(categoryWords).find(type => categoryWords[type].some(word => q.includes(word)))
  return products.filter(p => (brand === 'all' || p.brand === brand) && (category === 'all' || p.type === category) && p.price <= Number(budget) && (!size || p.sizes.includes(size)))
    .map(p => ({ product: p, score: (p.id === seedId ? 20 : 0) + (p.type === inferred ? 10 : 0) + (['크림', '밝', 'cream', 'light', '白'].some(w => q.includes(w)) && p.color.ko === '크림' ? 5 : 0) + (p.index % 5 === 0 ? 2 : 0) }))
    .sort((a, b) => b.score - a.score || a.product.index - b.product.index).slice(0, 3).map(x => x.product)
}
