import { useEffect, useRef, useState } from 'react'
import { brands, products, stores, missions, brandById, productById, money, inventory, recommend } from './data'
import { messages } from './i18n'
import { Icon, BrandWordmark, ProductArt, ProductCard, EditorialPhoto, EmptyState } from './components'
import { MissionGuide, StaffView } from './JourneyViews'
import { restoreCoupons } from './demo-state'
import './App.css'

const STORAGE_KEY = 'kfit-demo-v1'
const initialDemo = { cart: [], favorites: [], pass: null, feedbacks: [], missions: {}, coupons: [] }
const heroPhoto = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85'
const categories = ['all', 'jacket', 'knit', 'tee', 'pants', 'cap']

function loadDemo() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!data || !Array.isArray(data.cart) || !Array.isArray(data.favorites)) return initialDemo
    return restoreCoupons({ ...initialDemo, ...data, cart: data.cart.filter(item => productById(item.productId) && productById(item.productId).sizes.includes(item.size) && productById(item.productId).colors.some(c => c.hex === item.colorHex)), missions: data.missions && typeof data.missions === 'object' && !Array.isArray(data.missions) ? data.missions : {}, feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : [] })
  } catch { return initialDemo }
}

function readRoute() {
  const [, mode, page] = window.location.hash.split('/')
  const allowed = ['home','explore','finder','fitting','stores','pass','staff','feedback','missions']
  return { mode: mode === 'app' ? 'app' : 'web', page: allowed.includes(page) ? page : 'home' }
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [lang, setLang] = useState(()=>{ try { return ['ko','en','zh'].includes(localStorage.getItem('kfit-lang')) ? localStorage.getItem('kfit-lang') : 'ko' } catch { return 'ko' } })
  const [demo, setDemo] = useState(loadDemo)
  const [toast, setToast] = useState('')
  const [dialog, setDialog] = useState(null)
  const [catalogBrand, setCatalogBrand] = useState('all')
  const [seedProduct, setSeedProduct] = useState(null)
  const [resetDialog, setResetDialog] = useState(false)
  const surfaceRef = useRef(null)
  const t = key => messages[lang][key] || messages.ko[key] || key
  const go = (page, mode = route.mode) => { window.location.hash = `/${mode}/${page}` }
  const notify = text => setToast(text)
  useEffect(()=>{ const handler = ()=>setRoute(readRoute()); window.addEventListener('hashchange',handler); return ()=>window.removeEventListener('hashchange',handler) },[])
  useEffect(()=>{ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(demo)) } catch { /* Storage is optional for a working demo. */ } },[demo])
  useEffect(()=>{ try { localStorage.setItem('kfit-lang',lang) } catch { /* Keep language in memory. */ } document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang; document.title = `K-Fit & Local · ${messages[lang][route.page] || 'F&F'}` },[lang,route.page])
  useEffect(()=>{ window.scrollTo(0,0); surfaceRef.current?.scrollTo(0,0) },[route.page,route.mode])
  useEffect(()=>{ if (!toast) return; const timer = setTimeout(()=>setToast(''),3200); return ()=>clearTimeout(timer) },[toast])
  useEffect(()=>{ const handler = event => { if(event.key === STORAGE_KEY) setDemo(loadDemo()) }; window.addEventListener('storage',handler); return ()=>window.removeEventListener('storage',handler) },[])

  function favorite(id) { setDemo(d=>({...d,favorites:d.favorites.includes(id) ? d.favorites.filter(x=>x!==id) : [...d.favorites,id]})) }
  function openProduct(product, editKey) { setDialog({ product, editKey }) }
  function addItem(item, editKey) {
    setDemo(d=>{ const remaining = d.cart.filter(x=>x.key !== editKey && x.key !== item.key); return {...d,cart:[...remaining,item],pass:null} })
    setDialog(null); notify(t('saved'))
  }
  function removeItem(key) { setDemo(d=>({...d,cart:d.cart.filter(x=>x.key!==key),pass:null})) }
  function browse(brand = 'all') { setCatalogBrand(brand); go('explore') }
  function startFinder(product = null) { setSeedProduct(product); go('finder') }
  function createPass(store, brand) {
    const items = demo.cart.filter(item=>productById(item.productId).brand===brand)
    if(!items.length) return
    setDemo(d=>({...d,pass:{ code:'KF-DEMO-0001', storeId:store.id, brand, items:items.map(x=>({...x})), language:lang, status:'pending', createdAt:new Date().toISOString() }}))
    go('pass')
  }

  const common = {lang,t,go,demo,setDemo,notify,openProduct,favorite,browse,startFinder}
  const cardProps = { lang,t,onOpen:openProduct,onFavorite:favorite }
  const renderPage = () => {
    switch(route.page) {
      case 'explore': return <Catalog {...common} brand={catalogBrand} setBrand={setCatalogBrand} cardProps={cardProps}/>
      case 'finder': return <StyleFinder key={seedProduct?.id || 'default'} {...common} seedProduct={seedProduct} cardProps={cardProps}/>
      case 'fitting': return <FittingList {...common} removeItem={removeItem}/>
      case 'stores': return <StoreFinder {...common} createPass={createPass}/>
      case 'pass': return <FittingPass {...common}/>
      case 'staff': return <StaffView {...common}/>
      case 'feedback': return <Feedback {...common}/>
      case 'missions': return <MissionGuide {...common}/>
      default: return <Home {...common} cardProps={cardProps}/>
    }
  }
  return <div className={`experience ${route.mode === 'app' ? 'app-mode' : 'web-mode'}`}>
    <div className="demo-toolbar"><div className="demo-identity"><span className="live-dot"/> K-FIT & LOCAL <span className="demo-divider">/</span> <span>{t('demo')}</span></div><div className="demo-controls">
      <button className={route.mode==='web' && route.page!=='staff' ? 'active' : ''} onClick={()=>go(route.page==='staff' ? 'home' : route.page,'web')}><Icon name="desktop" size={15}/>{t('website')}</button>
      <button className={route.mode==='app' ? 'active' : ''} onClick={()=>go(route.page==='staff' ? 'home' : route.page,'app')}><Icon name="phone" size={15}/>{t('app')}</button>
      <button className={route.page==='staff' ? 'active' : ''} onClick={()=>go('staff','web')}><Icon name="qr" size={15}/>{t('staff')}</button>
    </div></div>
    {route.mode==='app' && <div className="app-preview-label"><span>MOBILE EXPERIENCE</span><span>F&F · K-FIT & LOCAL</span></div>}
    <div className="device-frame">
      {route.mode==='app' && <div className="phone-status"><span>9:41</span><span className="phone-island"/><span>▮▮▮ ▰</span></div>}
      <Header {...common} route={route} setLang={setLang}/>
      <div className="surface" ref={surfaceRef}>
        <main id="main-content" className={`page page-${route.page}`}>{renderPage()}</main>
        <footer className="site-footer"><button className="footer-logo" onClick={()=>go('home')}>F&F<span>K-FIT & LOCAL</span></button><p>{t('footer')}</p><div className="footer-bottom"><span>{t('footerDemo')}</span><span>{t('demoData')}</span><span>{t('localData')}</span><button onClick={()=>setResetDialog(true)}><Icon name="refresh" size={13}/>{t('reset')}</button></div><div className="footer-credit">DESIGNED FOR YOUR NEXT DISCOVERY <span>© 2026 K-FIT & LOCAL CONCEPT</span></div></footer>
      </div>
      {route.mode==='app' && <nav className="bottom-nav" aria-label="Mobile navigation">{[['home','home'],['explore','search'],['fitting','bag'],['stores','pin'],['missions','sparkles']].map(([page,icon])=><button key={page} className={route.page===page ? 'active' : ''} onClick={()=>go(page)}><span><Icon name={icon} size={21}/>{page==='fitting' && demo.cart.length>0 && <i>{demo.cart.length}</i>}</span>{t(page)}</button>)}</nav>}
    </div>
    {dialog && <ProductDialog key={`${dialog.product.id}-${dialog.editKey || 'new'}`} {...common} {...dialog} onClose={()=>setDialog(null)} onAdd={addItem}/>}
    {resetDialog && <ConfirmDialog title={t('resetAsk')} cancel={t('cancel')} confirm={t('reset')} onCancel={()=>setResetDialog(false)} onConfirm={()=>{setDemo({...initialDemo});setResetDialog(false);notify(t('resetDone'));go('home')}}/>}
    {toast && <div className="toast" role="status"><Icon name="check" size={18}/>{toast}</div>}
  </div>
}

function Header({t,lang,go,demo,route,setLang}) {
  const [menu,setMenu] = useState(false)
  useEffect(()=>setMenu(false),[route.page,route.mode])
  return <header className="site-header"><a className="skip-link" href="#main-content">Skip to content</a><button className="main-logo" onClick={()=>go('home')} aria-label="F&F K-Fit & Local home">F&F<span>K-FIT & LOCAL</span></button>
    <nav className={`main-nav ${menu ? 'is-open' : ''}`} aria-label="Main navigation">{['explore','finder','fitting','stores','missions'].map(page=><button key={page} className={route.page===page ? 'active' : ''} onClick={()=>go(page)}>{t(page)}{page==='finder' && <i className="new-dot"/>}</button>)}</nav>
    <div className="header-actions"><label className="language-select"><Icon name="globe" size={17}/><select value={lang} onChange={e=>setLang(e.target.value)} aria-label={t('language')}><option value="ko">KO</option><option value="en">EN</option><option value="zh">繁中</option></select></label><button className="header-bag" onClick={()=>go('fitting')} aria-label={`${t('fitting')} ${demo.cart.length}`}><Icon name="bag"/><span>{demo.cart.length}</span></button><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Menu" aria-expanded={menu}><Icon name={menu?'close':'menu'}/></button></div>
  </header>
}

function SectionHeading({eyebrow,title,description,action,onAction}) { return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="section-description">{description}</p>}</div>{action && <button className="text-link" onClick={onAction}>{action}<Icon name="arrow" size={18}/></button>}</div> }

function Home({t,lang,go,demo,browse,startFinder,cardProps}) {
  return <>
    <section className="hero-section"><div className="hero-copy"><p className="eyebrow"><span/>{t('heroTop')}</p><h1>{t('heroTitle')}</h1><p className="hero-description">{t('heroDesc')}</p><div className="hero-actions"><button className="button primary" onClick={()=>browse()}>{t('discover')}<Icon name="arrow"/></button><button className="hero-secondary" onClick={()=>startFinder()}><Icon name="camera" size={19}/>{t('findStyle')}</button></div><div className="hero-bottom"><span className="mini-cross">✳</span><span>{t('heroNote')}</span><span className="hero-index">01 — 06</span></div></div><div className="hero-visual"><EditorialPhoto src={heroPhoto} alt="Fashion inspiration in the city"/><div className="hero-visual-overlay"><span>THE KOREA<br/>STYLE JOURNEY</span><span>EXPLORE YOUR<br/>NEXT CHAPTER ↗</span></div><div className="hero-sticker"><Icon name="pin" size={17}/><span>EXPLORE KOREA</span><i>YOUR NEXT MOMENT</i></div></div></section>
    <div className="brand-strip">{brands.map(b=><button key={b.id} onClick={()=>browse(b.id)}><BrandWordmark brand={b}/></button>)}</div>
    <section className="content-section collection-preview"><SectionHeading eyebrow="CURATED FOR YOU" title={t('editTitle')} description={t('editDesc')} action={t('viewAll')} onAction={()=>browse()}/><div className="product-grid featured">{[products[0],products[6],products[16],products[24]].map(p=><ProductCard key={p.id} product={p} {...cardProps} favorite={demo.favorites.includes(p.id)}/>)}</div></section>
    <section className="journey-section"><div className="journey-intro"><p className="eyebrow">FROM ONLINE TO OFFLINE</p><h2>{t('journeyTitle')}</h2><p>{t('journeyDesc')}</p><button className="text-link" onClick={()=>startFinder()}>{t('startDemo')}<Icon name="arrow"/></button></div><div className="journey-steps">{[['camera','step1'],['bag','step2'],['qr','step3']].map(([icon,key],i)=><button key={key} className="journey-step" onClick={()=>go(['finder','explore','stores'][i])}><span className="step-number">0{i+1}</span><Icon name={icon} size={27}/><h3>{t(key)}</h3><p>{t(`${key}Desc`)}</p><Icon name="arrow" size={18}/></button>)}</div></section>
    <section className="content-section"><SectionHeading eyebrow="OUR BRANDS" title={t('brandsTitle')} description={t('brandsDesc')}/><div className="brand-grid">{brands.map((b,i)=><button key={b.id} className="brand-tile" onClick={()=>browse(b.id)} style={{'--brand-color':b.color}}><span className="brand-tile-index">0{i+1} / F&F</span><BrandWordmark brand={b}/><span className="brand-tile-desc">{b[lang]}<Icon name="arrow" size={18}/></span></button>)}</div></section>
    <section className="content-section guide-preview"><SectionHeading eyebrow="A LITTLE MORE KOREA" title={t('guideTitle')} description={t('guideDesc')} action={t('missions')} onAction={()=>go('missions')}/><div className="mission-preview-grid">{[missions[0],missions[1]].map(m=><button key={m.id} className="mission-preview" onClick={()=>go('missions')}><EditorialPhoto src={m.image} alt={m.names[lang]} kind="city"/><div><span className="eyebrow">KOREA MOMENT / {m.number}</span><h3>{m.names[lang]}</h3><span>{t(m.city)}<Icon name="arrow" size={19}/></span></div></button>)}</div></section>
  </>
}

function Catalog({t,lang,demo,brand,setBrand,cardProps,startFinder}) {
  const [category,setCategory]=useState('all'),[query,setQuery]=useState(''),[sort,setSort]=useState('recommended'),[favoritesOnly,setFavoritesOnly]=useState(false)
  const result=products.filter(p=>(brand==='all'||p.brand===brand)&&(category==='all'||p.type===category)&&(!favoritesOnly||demo.favorites.includes(p.id))&&`${p.names.ko} ${p.names.en} ${p.names.zh} ${brandById(p.brand).name}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='priceAsc'?a.price-b.price:sort==='priceDesc'?b.price-a.price:a.index-b.index)
  const clear=()=>{setBrand('all');setCategory('all');setQuery('');setFavoritesOnly(false)}
  return <div className="content-section page-content"><SectionHeading eyebrow={t('collection')} title={t('collectionTitle')} description={t('collectionDesc')}/><div className="catalog-brand-tabs"><button className={brand==='all'?'active':''} onClick={()=>setBrand('all')}>{t('allBrands')}</button>{brands.map(b=><button key={b.id} className={brand===b.id?'active':''} onClick={()=>setBrand(b.id)}><BrandWordmark brand={b} small/></button>)}</div>
    <div className="catalog-tools"><label className="search-field"><Icon name="search" size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')}/>{query&&<button onClick={()=>setQuery('')} aria-label={t('clear')}><Icon name="close" size={16}/></button>}</label><button className={`favorite-filter ${favoritesOnly?'active':''}`} onClick={()=>setFavoritesOnly(!favoritesOnly)} aria-pressed={favoritesOnly}><Icon name="heart" size={17}/>{t('onlyFavorites')}</button><select aria-label={t('sort')} value={sort} onChange={e=>setSort(e.target.value)}>{['recommended','priceAsc','priceDesc'].map(x=><option value={x} key={x}>{t(x)}</option>)}</select></div>
    <div className="category-row"><div className="filter-chips">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{t(c)}</button>)}</div><span>{result.length} {t('count')}</span></div>
    {result.length ? <div className="product-grid">{result.map(p=><ProductCard key={p.id} product={p} {...cardProps} favorite={demo.favorites.includes(p.id)}/>)}</div>:<EmptyState icon="search" title={t('noProducts')} button={t('clear')} onClick={clear}/>}
    <div className="catalog-cta"><Icon name="camera" size={30}/><div><h3>{t('findStyle')}</h3><p>{t('finderDesc')}</p></div><button className="button outline" onClick={()=>startFinder()}>{t('finder')}<Icon name="arrow"/></button></div><p className="fine-print">{t('demoData')}</p>
  </div>
}

function StyleFinder({t,lang,demo,notify,seedProduct,cardProps}) {
  const [photo,setPhoto]=useState(null),[sample,setSample]=useState(!!seedProduct),[query,setQuery]=useState(''),[brand,setBrand]=useState(seedProduct?.brand||'all'),[category,setCategory]=useState('all'),[size,setSize]=useState(''),[budget,setBudget]=useState('1000000'),[results,setResults]=useState(null),[loading,setLoading]=useState(false)
  const timer=useRef(null), fileRef=useRef(null)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  useEffect(()=>()=>{if(photo)URL.revokeObjectURL(photo)},[photo])
  function upload(e) {const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){notify(t('fileError'));e.target.value='';return}setPhoto(URL.createObjectURL(file));setSample(false);e.target.value=''}
  function submit(e) {e.preventDefault();setLoading(true);setResults(null);clearTimeout(timer.current);timer.current=setTimeout(()=>{setResults(recommend({query,brand,category,size,budget,seedId:sample?(seedProduct?.id||products[0].id):''}));setLoading(false)},900)}
  return <div className="content-section page-content"><SectionHeading eyebrow="STYLE DISCOVERY" title={t('finderTitle')} description={t('finderDesc')}/><form className="finder-layout" onSubmit={submit}><div className="upload-column"><div className={`upload-zone ${photo||sample?'has-photo':''}`}>{photo?<img src={photo} alt="Uploaded style reference"/>:sample?<ProductArt product={seedProduct||products[0]}/>:<><span className="upload-icon"><Icon name="camera" size={38}/></span><h3>{t('upload')}</h3><p>{t('uploadDesc')}</p><button type="button" className="button outline" onClick={()=>fileRef.current?.click()}><Icon name="upload" size={17}/>{t('upload')}</button></>}{(photo||sample)&&<div className="photo-actions"><button type="button" onClick={()=>fileRef.current?.click()}>{t('upload')}</button><button type="button" onClick={()=>{setPhoto(null);setSample(false)}}><Icon name="close" size={16}/>{t('removePhoto')}</button></div>}</div><input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} className="visually-hidden" onChange={upload} aria-label={t('upload')}/><button className="sample-button" type="button" onClick={()=>{setPhoto(null);setSample(true)}}><span className="sample-swatch"><ProductArt product={products[0]}/></span>{t('sample')}<Icon name="arrow" size={16}/></button></div>
      <div className="finder-fields"><label className="field-label">{t('preference')}<textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('preferencePlaceholder')} rows="4" maxLength="500"/></label><div className="form-grid"><label className="field-label">{t('allBrands')}<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="all">{t('allBrands')}</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="field-label">{t('explore')}<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{t(c)}</option>)}</select></label><label className="field-label">{t('size')}<select value={size} onChange={e=>setSize(e.target.value)}><option value="">{t('all')}</option>{['XS','S','M','L','XL','FREE','120','130','140','150'].map(s=><option key={s} value={s}>{s}</option>)}</select></label><label className="field-label">{t('budget')}<select value={budget} onChange={e=>setBudget(e.target.value)}>{[50000,100000,150000,200000,300000,500000,1000000].map(n=><option key={n} value={n}>{money(n)}</option>)}</select></label></div><button className="button primary wide" type="submit" disabled={loading}>{loading?<><span className="spinner"/>{t('finding')}</>:<><Icon name="sparkles"/>{t('find')}<Icon name="arrow"/></>}</button><p className="demo-note"><span>DEMO</span>{t('finderDemo')}</p></div></form>
    {results && <section className="recommendation-results" aria-live="polite"><SectionHeading eyebrow="YOUR STYLE SELECTION" title={t('results')} description={results.length?t('resultsDesc'):t('noMatch')}/><div className="product-grid recommendations">{results.map((p,i)=><div key={p.id}><span className="recommendation-index">0{i+1} / STYLE PICK</span><ProductCard product={p} {...cardProps} favorite={demo.favorites.includes(p.id)}/><p className="recommendation-reason"><Icon name="check" size={15}/>{t('reason')}</p><p className="fine-print">{t('difference')}</p></div>)}</div></section>}
  </div>
}

function ProductDialog({product,editKey,demo,t,lang,onClose,onAdd,startFinder}) {
  const ref=useRef(null), old=demo.cart.find(x=>x.key===editKey)
  const [size,setSize]=useState(old?.size||''),[colorHex,setColorHex]=useState(old?.colorHex||product.color.hex),[note,setNote]=useState(old?.note||'')
  useEffect(()=>{const previous=document.activeElement;ref.current?.showModal();return()=>previous?.focus()},[])
  return <dialog ref={ref} className="product-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} aria-labelledby="product-dialog-title"><button className="dialog-close" onClick={onClose} aria-label={t('close')}><Icon name="close"/></button><div className="product-dialog-layout"><div className="detail-art"><ProductArt product={product} color={colorHex}/><span>F&F / CONCEPT COLLECTION</span></div><div className="product-detail"><p className="eyebrow">{brandById(product.brand).name}</p><h2 id="product-dialog-title">{product.names[lang]}</h2><p className="detail-price">{money(product.price)}</p><p className="product-code">{product.sku}</p><div className="option-group"><span className="field-label">{t('color')}</span><div className="color-options">{product.colors.map(c=><button key={c.hex} onClick={()=>setColorHex(c.hex)} className={colorHex===c.hex?'active':''} aria-pressed={colorHex===c.hex}><i style={{background:c.hex}}/>{c[lang]}</button>)}</div></div><fieldset className="option-group"><legend>{t('size')}</legend><div className="size-options">{product.sizes.map(s=><button key={s} className={size===s?'active':''} onClick={()=>setSize(s)} aria-pressed={size===s}>{s}</button>)}</div><p className="fine-print">{t('sizeNote')}</p></fieldset><label className="field-label">{t('fit')}<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength="250" rows="2" placeholder={t('fitPlaceholder')}/></label><button className="button primary wide" disabled={!size} onClick={()=>onAdd({key:`${product.id}|${size}|${colorHex}`,productId:product.id,size,colorHex,note},editKey)}><Icon name="bag" size={18}/>{t('add')}<Icon name="plus" size={18}/></button><button className="text-link detail-style" onClick={()=>{onClose();startFinder(product)}}><Icon name="sparkles" size={16}/>{t('finder')}<Icon name="arrow" size={16}/></button><p className="fine-print">{t('demoData')}</p></div></div></dialog>
}

function FittingList({t,lang,demo,go,openProduct,removeItem}) {
  return <div className="content-section page-content"><SectionHeading eyebrow="MY FITTING LIST" title={t('listTitle')} description={t('listDesc')}/>{!demo.cart.length?<EmptyState title={t('emptyTitle')} description={t('emptyDesc')} button={t('discover')} onClick={()=>go('explore')}/>:<div className="list-layout"><div className="fitting-items">{demo.cart.map(item=>{const p=productById(item.productId),color=p.colors.find(c=>c.hex===item.colorHex);return <article className="fitting-item" key={item.key}><button className="list-art" onClick={()=>openProduct(p,item.key)}><ProductArt product={p} color={item.colorHex}/></button><div className="list-item-info"><span className="product-brand">{brandById(p.brand).name}</span><h3>{p.names[lang]}</h3><p>{color[lang]} <span>/</span> {item.size}</p>{item.note&&<p className="fit-note">“{item.note}”</p>}<strong>{money(p.price)}</strong><button className="text-link" onClick={()=>openProduct(p,item.key)}>{t('compare')}<Icon name="chevron" size={14}/></button></div><button className="remove-item" onClick={()=>removeItem(item.key)} aria-label={`${p.names[lang]} ${t('remove')}`}><Icon name="close" size={18}/></button></article>})}</div><aside className="list-summary"><p className="eyebrow">YOUR NEXT FITTING</p><h3>{demo.cart.length} {t('pieces')}</h3><div><span>{t('total')}</span><strong>{money(demo.cart.reduce((sum,x)=>sum+productById(x.productId).price,0))}</strong></div><p>{t('totalNote')}</p><button className="button primary wide" onClick={()=>go('stores')}>{t('findStores')}<Icon name="arrow"/></button><button className="text-link" onClick={()=>go('explore')}>{t('discover')}<Icon name="plus" size={16}/></button></aside></div>}</div>
}

function StoreFinder({t,lang,demo,go,createPass}) {
  const cartBrands=[...new Set(demo.cart.map(x=>productById(x.productId).brand))]
  const [brand,setBrand]=useState(cartBrands[0]||'mlb'),[region,setRegion]=useState('all'),[selected,setSelected]=useState('myeongdong'),[sort,setSort]=useState('availability')
  const items=demo.cart.filter(x=>productById(x.productId).brand===brand)
  const stockFor=s=>items.filter(x=>inventory(productById(x.productId),s.id,x.size,x.colorHex)>0).length
  const visible=stores.filter(s=>region==='all'||s.area===region).sort((a,b)=>sort==='distance'?a.distance-b.distance:stockFor(b)-stockFor(a)||a.distance-b.distance)
  const active=visible.find(s=>s.id===selected)||visible[0]
  return <div className="content-section page-content"><SectionHeading eyebrow="FIND YOUR NEXT STOP" title={t('storesTitle')} description={t('storesDesc')}/><p className="demo-note inventory-note"><span>DEMO</span>{t('demoInventory')}</p><div className="store-filters"><label className="field-label">{t('chooseBrand')}<select value={brand} onChange={e=>setBrand(e.target.value)}>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="field-label">{t('region')}<select value={region} onChange={e=>setRegion(e.target.value)}><option value="all">{t('all')}</option>{stores.map(s=><option key={s.id} value={s.area}>{t(s.area)}</option>)}</select></label><label className="field-label">{t('sort')}<select value={sort} onChange={e=>setSort(e.target.value)}><option value="availability">{t('availability')}</option><option value="distance">km ↑</option></select></label></div>
    {!demo.cart.length&&<div className="inline-empty"><Icon name="bag"/><span>{t('storeEmpty')}</span><button className="text-link" onClick={()=>go('explore')}>{t('discover')}<Icon name="arrow" size={16}/></button></div>}
    <div className="store-layout"><div className="store-cards">{visible.map(s=><article key={s.id} className={`store-card ${active.id===s.id?'selected':''}`}><button className="store-card-heading" onClick={()=>setSelected(s.id)}><div><span className="eyebrow">{brandById(brand).name}</span><h3>{t(s.area)} <span>{lang==='ko'?'스토어':lang==='zh'?'門市':'store'}</span></h3><p>{s.distance} km <i/> {s.hours}</p></div><span className="store-location-icon"><Icon name="pin"/></span></button><div className="store-stock"><span>{t('storeCount')} {items.length}</span><strong className={items.length && stockFor(s)===items.length?'stock-good':''}>{stockFor(s)} / {items.length}</strong></div><div className="stock-items">{items.map(item=>{const p=productById(item.productId),n=inventory(p,s.id,item.size,item.colorHex);return <div key={item.key}><span>{p.names[lang]} · {item.size} · {p.colors.find(c=>c.hex===item.colorHex)[lang]}</span><em className={n?'available':'unavailable'}>{t(n?'available':'unavailable')}</em></div>})}</div><div className="store-card-actions"><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer">{t('directions')}<Icon name="arrow" size={16}/></a><button className="button primary" disabled={!items.length} onClick={()=>createPass(s,brand)}>{t('selectStore')}<Icon name="qr" size={17}/></button></div><p className="fine-print">{t('checkTime')}</p></article>)}</div><div className="map-panel"><div className="map-caption"><span>KOREA / STORE AREAS</span><span>ILLUSTRATIVE MAP</span></div><div className="illustrative-map"><svg viewBox="0 0 600 600" aria-hidden="true"><rect width="600" height="600" fill="#e4ece9"/><path d="M280 50 330 90 350 150 405 210 440 295 465 360 425 418 365 440 320 420 277 458 235 410 220 350 250 300 230 250 245 190 225 130Z" fill="#c9d2bc" stroke="#b2bda5" strokeWidth="3"/><ellipse cx="200" cy="532" rx="42" ry="18" fill="#c9d2bc"/><path d="M280 130 330 240 365 350 425 395M280 130 265 300 285 415" fill="none" stroke="#f8f8ee" strokeWidth="5"/></svg>{[{city:'seoul',x:44,y:26},{city:'busan',x:71,y:68},{city:'jeju',x:32,y:88}].map(point=><button key={point.city} className={`map-marker ${active.city===point.city?'active':''}`} style={{left:`${point.x}%`,top:`${point.y}%`}} onClick={()=>{setSelected(stores.find(s=>s.city===point.city).id);setRegion('all')}} aria-label={t(point.city)}><Icon name="pin" size={24}/><span>{t(point.city)}</span></button>)}<span className="map-seoul">KOREA</span></div><div className="map-detail"><Icon name="pin" size={21}/><div><strong>{brandById(brand).name} · {t(active.area)}</strong><p>{t('demoInventory')}</p></div></div></div></div>
  </div>
}

function PassItems({pass,lang='ko',t}) {return <div className="pass-items">{pass.items.map(item=>{const p=productById(item.productId);if(!p)return null;return <div key={item.key}><div className="pass-art"><ProductArt product={p} color={item.colorHex}/></div><div><span className="product-brand">{brandById(p.brand).name}</span><strong>{p.names[lang]}</strong><p>{p.colors.find(c=>c.hex===item.colorHex)?.[lang]} / {item.size}</p><small>{p.sku}</small>{item.note&&<p className="fit-note">{t('requestedFit')}: {item.note}</p>}</div></div>})}</div>}

function FittingPass({t,lang,demo,go}) {
  const pass=demo.pass
  if(!pass||!stores.some(s=>s.id===pass.storeId)||!brandById(pass.brand))return <div className="content-section page-content"><EmptyState icon="qr" title={t('staffEmpty')} button={t('findStores')} onClick={()=>go('stores')}/></div>
  const store=stores.find(s=>s.id===pass.storeId)
  return <div className="content-section page-content pass-page"><SectionHeading eyebrow="READY FOR YOUR FITTING" title={t('passTitle')} description={t('passDesc')}/><div className="pass-layout"><section className="pass-ticket"><div className="ticket-header"><span className="ticket-logo">F&F</span><span>FITTING PASS<br/>K-FIT & LOCAL</span></div><span className={`status-pill status-${pass.status}`}><i/>{t(pass.status)}</span><h2>{brandById(pass.brand).name}<br/>{t(store.area)}</h2><div className="qr-wrap"><img src="/fitting-qr.svg" width="220" height="220" alt={`QR code: ${pass.code}`}/></div><p className="eyebrow">{t('requestCode')}</p><strong className="pass-code">{pass.code}</strong><div className="ticket-perforation"/><p className="fine-print">{t('passNote')}</p></section><section className="pass-summary"><h3>{t('fitting')} <span>{pass.items.length}</span></h3><PassItems pass={pass} lang={lang} t={t}/><button className="button primary wide" onClick={()=>go('staff')}><Icon name="qr"/>{t('openStaff')}<Icon name="arrow"/></button><button className="button outline wide" onClick={()=>go('feedback')}>{t('feedback')}<Icon name="arrow"/></button><button className="text-link" onClick={()=>go('missions')}>{t('missions')}<Icon name="arrow" size={17}/></button></section></div></div>
}

function Feedback({t,lang,demo,setDemo,go,notify}) {
  const [ratings,setRatings]=useState({}),[purchased,setPurchased]=useState(''),[reason,setReason]=useState(''),[done,setDone]=useState(false)
  const pass=demo.pass
  if(!pass)return <div className="content-section page-content"><EmptyState title={t('emptyFeedback')} button={t('findStores')} onClick={()=>go('stores')}/></div>
  function submit(e){e.preventDefault();if(pass.items.some(x=>!ratings[x.key])||!purchased||purchased==='no'&&!reason){notify(t('feedbackRequired'));return}setDemo(d=>({...d,feedbacks:[...d.feedbacks,{passCode:pass.code,ratings,purchased,reason,at:new Date().toISOString()}]}));setDone(true)}
  return <div className="content-section page-content feedback-page"><SectionHeading eyebrow="AFTER YOUR FITTING" title={t('feedbackTitle')} description={t('feedbackDesc')}/>{done?<EmptyState icon="check" title={t('feedbackDone')} button={t('missions')} onClick={()=>go('missions')}/>:<form onSubmit={submit} className="feedback-form">{pass.items.map(item=>{const p=productById(item.productId);return <fieldset className="feedback-item" key={item.key}><legend>{p.names[lang]} · {item.size}</legend><div className="feedback-options">{['good','small','large','different'].map(r=><button type="button" key={r} aria-pressed={ratings[item.key]===r} className={ratings[item.key]===r?'active':''} onClick={()=>setRatings(v=>({...v,[item.key]:r}))}>{t(r)}</button>)}</div></fieldset>})}<fieldset className="feedback-item"><legend>{t('purchaseQuestion')}</legend><div className="feedback-options">{[['yes','purchased'],['no','notPurchased']].map(([value,key])=><button type="button" key={value} className={purchased===value?'active':''} aria-pressed={purchased===value} onClick={()=>setPurchased(value)}>{t(key)}</button>)}</div></fieldset>{purchased==='no'&&<label className="field-label">{t('reasonQuestion')}<select required value={reason} onChange={e=>setReason(e.target.value)}><option value="">—</option>{['size','design','price','stock','other'].map(x=><option key={x} value={x}>{t(x)}</option>)}</select></label>}<button className="button primary" type="submit">{t('submit')}<Icon name="arrow"/></button><p className="fine-print">{t('localData')}</p></form>}</div>
}

function ConfirmDialog({title,cancel,confirm,onCancel,onConfirm}) {
  const ref=useRef(null)
  useEffect(()=>{const previous=document.activeElement;ref.current?.showModal();return()=>previous?.focus()},[])
  return <dialog ref={ref} className="confirm-dialog" onCancel={onCancel} aria-labelledby="confirm-title"><h2 id="confirm-title">{title}</h2><div><button className="button outline" onClick={onCancel}>{cancel}</button><button className="button primary" onClick={onConfirm}>{confirm}</button></div></dialog>
}

