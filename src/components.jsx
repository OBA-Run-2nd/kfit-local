import { useId, useState } from 'react'
import { brandById, money } from './data'

const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', chevron: 'm9 5 7 7-7 7', back: 'm14 6-6 6 6 6',
  search: 'm20 20-4-4M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  bag: 'M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  camera: 'M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11H2V8a2 2 0 0 1 2-2ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  close: 'm6 6 12 12M6 18 18 6', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'm4 12 5 5L20 6',
  home: 'm3 10 9-8 9 8v11h-6v-7H9v7H3V10Z',
  sparkles: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  qr: 'M3 3h6v6H3V3ZM15 3h6v6h-6V3ZM3 15h6v6H3v-6ZM15 15h3v3h3v3h-6v-6ZM18 12h3M12 3v3M12 12v6',
  menu: 'M3 6h18M3 12h18M3 18h18', desktop: 'M3 3h18v13H3V3ZM8 21h8M12 16v5', phone: 'M7 2h10v20H7V2ZM10 18h4',
  book: 'M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3V3ZM12 5v17',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
  tune: 'M4 7h16M4 17h16M8 4v6M16 14v6', refresh: 'M20 7v-5m0 5h-5M20 7a9 9 0 1 0 1 8',
}
export function Icon({ name = 'arrow', size = 20, className = '', ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}><path d={paths[name] || paths.arrow}/></svg>
}

export function BrandWordmark({ brand, small = false }) {
  const b = typeof brand === 'string' ? brandById(brand) : brand
  return <span className={`brand-wordmark brand-${b.id} ${small ? 'small' : ''}`}><span>{b.name}</span>{!small && <em>{b.line}</em>}</span>
}

export function ProductArt({ product, color, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const fill = color || product.color.hex
  const brand = brandById(product.brand)
  return <svg className={`product-art ${className}`} viewBox="0 0 400 460" role="img" aria-label={`${brand.name} ${product.names.ko}`}>
    <defs>
      <linearGradient id={`cloth${uid}`} x1="0" x2="1" y2="1"><stop stopColor={fill}/><stop offset=".5" stopColor={fill}/><stop offset="1" stopColor="#000" stopOpacity=".2"/></linearGradient>
      <filter id={`shadow${uid}`} x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="9" floodOpacity=".13"/></filter>
    </defs>
    <ellipse cx="200" cy="405" rx="109" ry="10" fill="#000" opacity=".035"/>
    <g filter={`url(#shadow${uid})`} stroke="#000" strokeOpacity=".15" strokeLinejoin="round">
      {product.type === 'jacket' && <>
        <path d="m142 80 32-19h52l32 19 43 27 46 139-47 17-30-81 6 198H124l6-198-30 81-47-17 46-139Z" fill={`url(#cloth${uid})`}/>
        <path d="m174 61 26 35 26-35 15 18-21 36h-40l-21-36Z" fill={fill}/>
        <path d="M200 96v284M134 282h45v45h-47m134-45h-45v45h47" fill="none" strokeOpacity=".25"/>
        <path d="m104 252-49-14M296 252l49-14M128 366h145" fill="none"/>
        <path d="m130 182 8 55m124-55-8 55" fill="none" strokeOpacity=".08"/>
      </>}
      {product.type === 'knit' && <>
        <path d="m142 87 33-22h50l33 22 39 25 43 140-49 14-27-78 7 193H129l7-193-27 78-49-14 43-140Z" fill={`url(#cloth${uid})`}/>
        <path d="M175 65c-4 45 54 45 50 0l-10 1c2 27-32 27-30 0Z" fill={fill}/>
        {Array.from({length:15},(_,i)=><path key={i} d={`M${139+i*9} 135v230`} strokeOpacity=".045"/>)}
        <path d="M130 362h140M69 245l40-12m182 0 40 12" fill="none" strokeOpacity=".2"/>
      </>}
      {product.type === 'tee' && <>
        <path d="m145 99 31-20h48l31 20 66 39-36 70-34-16 9 177H140l9-177-34 16-36-70Z" fill={`url(#cloth${uid})`}/>
        <path d="M176 79c-3 42 51 42 48 0l-9 1c0 25-30 25-30 0Z" fill={fill}/>
        <path d="M142 357h116m-147-160-24-53m202 53 24-53" fill="none"/>
      </>}
      {product.type === 'pants' && <>
        <path d="M133 64h134l10 325-71 4-10-201-10 201-71-4Z" fill={`url(#cloth${uid})`}/>
        <path d="M131 84h137M196 85v107M142 85l-8 52m120-52 8 52M121 374h66m20 0h68M185 64v20m34-20v20" fill="none"/>
        <path d="m196 94 13 3v65h-13" fill="none" strokeOpacity=".22"/>
      </>}
      {product.type === 'cap' && <>
        <path d="M100 262c-3-108 36-140 106-140s110 49 100 140c-58 21-146 28-206 0Z" fill={`url(#cloth${uid})`}/>
        <path d="M100 262c21-20 69-28 122-15l97 48c29 20-11 49-65 37l-126-35c-24-6-39-22-28-35Z" fill={fill}/>
        <path d="M206 123c-28 23-36 71-33 123M206 123c30 23 42 71 46 138m-152 1c45-8 98-7 145 14" fill="none"/>
        <ellipse cx="206" cy="121" rx="9" ry="5" fill={fill}/>
      </>}
      <text x={product.type === 'pants' ? 155 : product.type === 'cap' ? 211 : 237} y={product.type === 'pants' ? 112 : product.type === 'cap' ? 214 : 173} textAnchor="middle" stroke="none" fill={['#33383c','#3c4b62'].includes(fill) ? '#e4e0d8' : '#42443c'} fontFamily="Arial, sans-serif" fontSize={product.brand === 'sergio' ? 9 : 14} fontWeight="800" letterSpacing="-.5">{product.brand === 'discovery' ? 'D.' : product.brand === 'duvetica' ? 'D' : product.brand === 'sergio' ? 'ST' : product.brand === 'supra' ? 'SUPRA' : 'NY'}</text>
    </g>
  </svg>
}

export function EditorialPhoto({ src, alt, kind = 'fashion', className = '' }) {
  const [failed, setFailed] = useState(false)
  return <div className={`editorial-photo ${className} fallback-${kind}`}>
    {!failed && <img src={src} alt={alt} onError={()=>setFailed(true)} loading="lazy"/>}
    <div className="photo-fallback" aria-hidden="true"><span className="fallback-circle"/><span className="fallback-building one"/><span className="fallback-building two"/><span className="fallback-building three"/><span className="fallback-person"/><span className="fallback-caption">KOREA<br/>IN STYLE.</span></div>
  </div>
}

export function ProductCard({ product, lang, t, onOpen, favorite, onFavorite, compact = false }) {
  return <article className={`product-card ${compact ? 'compact' : ''}`}>
    <div className="product-image">
      <button className="product-open" onClick={()=>onOpen(product)} aria-label={`${product.names[lang]} · ${t('detail')}`}><ProductArt product={product}/></button>
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className={`favorite-button ${favorite ? 'selected' : ''}`} onClick={()=>onFavorite(product.id)} aria-label={favorite ? t('unsave') : t('save')} aria-pressed={favorite}><Icon name="heart" size={19}/></button>
      <button className="quick-add" onClick={()=>onOpen(product)} aria-label={t('add')}><Icon name="plus" size={19}/></button>
    </div>
    <button className="product-caption" onClick={()=>onOpen(product)}>
      <span className="product-brand">{brandById(product.brand).name}</span>
      <h3>{product.names[lang]}</h3>
      <strong>{money(product.price)}</strong>
      <span className="product-swatches">{product.colors.map(c=><i key={c.hex} style={{background:c.hex}}/>)}<small>+{product.colors.length}</small></span>
    </button>
  </article>
}

export function EmptyState({ icon = 'bag', title, description, button, onClick }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={34}/></span><h2>{title}</h2>{description && <p>{description}</p>}{button && <button className="button primary" onClick={onClick}>{button}<Icon name="arrow"/></button>}</div>
}
