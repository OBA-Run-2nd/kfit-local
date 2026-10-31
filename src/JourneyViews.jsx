import { useEffect, useRef, useState } from 'react'
import { missions, stores, productById, brandById, inventory, money } from './data'
import { Icon, ProductArt, EditorialPhoto } from './components'
import { messages } from './i18n'
import { completeMission, couponStatus, useCoupon, stockLocation, readDemoPass } from './demo-state'

function Heading({ eyebrow, title, description, children }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="section-description">{description}</p></div>{children}</div>
}

export function MissionGuide({ t, lang, demo, setDemo, notify }) {
  const [notes, setNotes] = useState({})
  const [photos, setPhotos] = useState({})
  const [using, setUsing] = useState(null)
  const photoUrls = useRef(new Set())
  const walletRef = useRef(null)
  const confirmRef = useRef(null)
  const coupons = demo.coupons || []
  const available = coupons.filter(c => couponStatus(c) === 'couponAvailable').length
  const count = missions.filter(m => demo.missions[m.id]?.status === 'completed').length
  const showWallet = () => { walletRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); walletRef.current?.focus({ preventScroll: true }) }

  useEffect(() => {
    const urls = photoUrls.current
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [])
  useEffect(() => {
    if (using) {
      const previous = document.activeElement
      confirmRef.current?.showModal()
      return () => previous?.focus()
    }
  }, [using])

  function addPhoto(id, event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      notify(t('fileError')); event.target.value = ''; return
    }
    if (photos[id]) { URL.revokeObjectURL(photos[id]); photoUrls.current.delete(photos[id]) }
    const url = URL.createObjectURL(file)
    photoUrls.current.add(url)
    setPhotos(p => ({ ...p, [id]: url }))
    event.target.value = ''
  }

  function complete(id) {
    setDemo(state => completeMission(state, id, { note: notes[id] || '', hasPhoto: !!photos[id] }))
    notify(t('missionDone'))
  }

  return <div className="content-section page-content korea-guide">
    <Heading eyebrow="A LITTLE MORE KOREA" title={t('missionsTitle')} description={t('missionsDesc')}>
      <button className="text-link wallet-link" onClick={showWallet}>{t('couponWallet')} <span>{available}</span><Icon name="arrow" size={17}/></button>
    </Heading>
    <div className="guide-intro"><div><p className="eyebrow">EXPLORE FREELY / MAKE IT YOURS</p><h3>{t('guideReward')}</h3><p>{t('guideRewardHint')}</p></div><span>{count} / {missions.length}<small>{t('missionCount')}</small></span></div>
    <div className="mission-grid travel-feed">
      {missions.map(m => {
        const progress = demo.missions[m.id]
        return <article className="mission-card guide-card" key={m.id} data-city={m.city}>
          <div className="mission-image"><EditorialPhoto src={m.image} alt={t('guidePhoto')} kind="city"/><span className="mission-location"><Icon name="pin" size={14}/>{t(m.city)} · {m.place[lang]}</span><span className="guide-photo-caption">{t('guidePhoto')}</span></div>
          <div className="mission-card-body">
            <p className="eyebrow">{t(m.category)} <span> / {m.minutes} {t('guideMinutes')}</span></p>
            <h3>{m.names[lang]}</h3><p>{m.descriptions[lang]}</p>
            <div className="guide-plan"><strong>{t('guideIdeas')}</strong><ol>{m.steps[lang].map(step => <li key={step}>{step}</li>)}</ol></div>
            <p className="guide-tip"><strong>{t('guideTip')}</strong>{m.tip[lang]}</p>
            <div className="guide-links"><a className="text-link" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.query)}`} target="_blank" rel="noreferrer"><Icon name="pin" size={15}/>{t('guideDirections')}<Icon name="arrow" size={14}/></a><a href={m.source} target="_blank" rel="noreferrer">{t('guideSource')} ↗</a></div>
            <div className="guide-mission">
              <div className="guide-reward"><span>OPTIONAL MISSION</span><strong>{money(m.coupon.amount)} {t('couponDiscount')}</strong></div>
              {!progress ? <button className="button outline wide" onClick={() => setDemo(d => ({ ...d, missions: { ...d.missions, [m.id]: { status: 'joined' } } }))}>{t('join')}<Icon name="plus" size={17}/></button>
                : progress.status === 'completed' ? <div className="completed-stamp"><Icon name="check"/>{t('couponIssued')}{progress.note && <p>“{progress.note}”</p>}<button className="text-link" onClick={showWallet}>{t('couponWallet')}<Icon name="arrow" size={15}/></button></div>
                : <div className="mission-participation">
                  {photos[m.id] && <img className="mission-user-photo" src={photos[m.id]} alt={t('missionPhoto')}/>}
                  <label className="mission-photo-picker"><Icon name="camera" size={16}/>{t('missionPhoto')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => addPhoto(m.id, event)} aria-label={t('missionPhoto')}/></label>
                  <label className="field-label">{t('note')}<textarea rows="2" maxLength="300" value={notes[m.id] || ''} onChange={event => setNotes(n => ({ ...n, [m.id]: event.target.value }))} placeholder={t('notePlaceholder')}/></label>
                  <button className="button primary wide" onClick={() => complete(m.id)}>{t('complete')}<Icon name="check" size={17}/></button>
                </div>}
            </div>
          </div>
        </article>
      })}
    </div>
    <section className="coupon-wallet" ref={walletRef} tabIndex="-1" aria-label={t('couponWallet')}>
      <Heading eyebrow="YOUR LITTLE REWARDS" title={`${t('couponWallet')} · ${available}`} description={t('couponNote')}/>
      {!coupons.length ? <p className="coupon-empty">{t('couponEmpty')}</p> : <div className="coupon-grid">{coupons.map(coupon => {
        const mission = missions.find(m => m.id === coupon.missionId)
        const status = couponStatus(coupon)
        return <article className={`coupon-card ${status !== 'couponAvailable' ? 'is-inactive' : ''}`} key={coupon.id}>
          <div className="coupon-value"><span>DEMO REWARD</span><strong>{money(coupon.amount)}</strong><span>{t('couponDiscount')}</span></div>
          <div className="coupon-details"><span className="coupon-status">{t(status)}</span><h3>{mission.names[lang]}</h3><p>{money(coupon.minimum)} {t('couponMinimum')}</p><p>{t('couponExpiry')} · {coupon.expiresAt.slice(0, 10)}</p><code>{coupon.code}</code><button className="button outline wide" disabled={status !== 'couponAvailable'} onClick={() => setUsing(coupon.id)}>{t('couponUse')}</button></div>
        </article>
      })}</div>}
    </section>
    <p className="demo-note"><span>DEMO</span>{t('missionNote')}</p>
    {using && <dialog className="confirm-dialog" ref={confirmRef} aria-labelledby="coupon-confirm-title" onCancel={() => setUsing(null)}><h2 id="coupon-confirm-title">{t('couponUseAsk')}</h2><div><button className="button outline" onClick={() => setUsing(null)}>{t('cancel')}</button><button className="button primary" onClick={() => { setDemo(d => useCoupon(d, using)); setUsing(null); notify(t('couponUseDone')) }}>{t('couponUse')}</button></div></dialog>}
  </div>
}

export function StaffView({ demo, setDemo, go, notify }) {
  const t = key => messages.ko[key] || key
  const [scanned, setScanned] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [found, setFound] = useState({})
  const pass = scanned && demo.pass?.createdAt === scanned.createdAt ? demo.pass : null

  function scan(value) {
    const result = readDemoPass(demo.pass, value)
    if (!result) { setError('이 브라우저의 고객 패스와 일치하는 코드가 없어요. 고객 화면에서 패스를 먼저 만들어주세요.'); return }
    setScanned(result); setFound({}); setError('')
    setDemo(d => ({ ...d, pass: { ...d.pass, status: d.pass.status === 'handedOver' ? 'handedOver' : 'onsite' } }))
  }

  const resolved = pass && pass.items.every(item => found[item.key])
  return <div className="content-section page-content staff-page">
    <Heading eyebrow="STORE TEAM / ONSITE QR" title={t('staffTitle')} description={t('staffDesc')}/>
    {!pass ? <section className="staff-scanner"><div className="scanner-target"><Icon name="qr" size={64}/></div><p className="eyebrow">SCAN AT THE STORE</p><h2>고객의 QR을 읽어주세요</h2><p>매장에서 고객이 패스를 보여주면 조회를 시작합니다.</p><button className="button primary" disabled={!demo.pass} onClick={() => scan(demo.pass.code)}><Icon name="qr" size={19}/>고객 QR 읽기 시연<Icon name="arrow" size={18}/></button><form onSubmit={event => { event.preventDefault(); scan(code) }}><label className="field-label">패스 코드로 조회<input value={code} onChange={event => setCode(event.target.value)} maxLength="50" placeholder="KF-DEMO-0001" autoComplete="off" required/></label><button className="button outline" type="submit">조회</button></form>{error && <p className="scan-error" role="alert">{error}</p>}{!demo.pass && <button className="text-link" onClick={() => go('stores')}>고객 패스 만들기<Icon name="arrow" size={17}/></button>}</section>
      : <>
        <div className="staff-overview"><div><p className="eyebrow">{pass.code} / 현장 QR 조회</p><h2>{brandById(pass.brand).name} · {t(stores.find(s => s.id === pass.storeId).area)}</h2><p>고객 언어: {pass.language === 'en' ? 'English' : pass.language === 'zh' ? '繁體中文' : '한국어'} · {pass.items.length}개 옵션</p></div><button className="text-link" onClick={() => { setScanned(null); setCode('') }}>다른 QR 읽기<Icon name="qr" size={18}/></button></div>
        <StaffPickupList pass={pass} found={found} setFound={setFound}/>
        <div className="staff-actions"><p>{Object.values(found).filter(Boolean).length} / {pass.items.length}개 확인 완료</p><button className="button primary" disabled={!resolved || pass.status === 'handedOver'} onClick={() => { setDemo(d => ({ ...d, pass: { ...d.pass, status: 'handedOver' } })); notify('시착 상품 전달과 품절 옵션 안내를 완료했어요.') }}><Icon name="check" size={18}/>{pass.status === 'handedOver' ? '현장 응대 완료' : '시착 전달 · 대안 안내 완료'}</button><button className="text-link" onClick={() => go('pass')}>{t('customerView')}<Icon name="arrow" size={17}/></button></div>
      </>}
    <p className="demo-note"><span>DEMO</span>{t('staffNote')}</p>
  </div>
}

export function StaffPickupList({ pass, found = {}, setFound = () => {} }) {
  return <div className="staff-pickup-list">{pass.items.map(item => {
          const product = productById(item.productId)
          const location = stockLocation(product, pass.storeId, item.size, item.colorHex)
          return <article key={item.key} className={`pickup-card ${found[item.key] ? 'is-found' : ''}`}>
            <div className="pickup-product"><div className="pass-art"><ProductArt product={product} color={item.colorHex}/></div><div><p className="product-brand">{brandById(product.brand).name}</p><h3>{product.names.ko}</h3><p>{product.colors.find(c => c.hex === item.colorHex).ko} / <strong>{item.size}</strong></p><code>{product.sku}</code>{item.note && <p className="fit-note">고객 메모: {item.note}</p>}</div><span className={`pickup-total ${!location.total ? 'no-stock' : ''}`}>{location.total}개<small>선택 옵션 재고</small></span></div>
            <div className="stock-locations"><div><span>매장 진열</span><strong>{location.floor}</strong><b>{location.floorQuantity}개</b></div><div><span>창고 보관</span><strong>{location.stockroom}</strong><b>{location.stockroomQuantity}개</b></div></div>
            <div className="size-inventory"><p>동일 색상 · 사이즈별 전체 수량</p><div>{product.sizes.map(size => <span key={size} className={size === item.size ? 'selected' : ''}><strong>{size}</strong><small>{inventory(product, pass.storeId, size, item.colorHex)}개</small></span>)}</div></div>
            {!location.total && <p className="stock-warning">요청 옵션이 품절입니다. 다른 사이즈 수량을 확인하고 고객에게 대안을 안내해주세요.</p>}
            <label className="pickup-check"><input type="checkbox" checked={!!found[item.key]} onChange={event => setFound(f => ({ ...f, [item.key]: event.target.checked }))}/>{location.total ? '상품을 찾았어요' : '품절과 대안을 안내했어요'}</label>
          </article>
        })}</div>
}
