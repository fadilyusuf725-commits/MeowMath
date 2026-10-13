import { useState, type ReactNode } from 'react'
import { NetFold3D } from './NetFold3D'

/** Bangun yang tersedia pada laboratorium jaring-jaring MeowMath. */
export type NetShape =
  | 'cube'
  | 'rectangular-prism'
  | 'triangular-prism'
  | 'square-prism'
  | 'square-pyramid'
  | 'triangular-pyramid'
  | 'cylinder'
  | 'cone'
  | 'sphere'

/** Id jaring-jaring yang ditampilkan di laboratorium. */
export type NetLayoutId =
  | 'cube-cross'
  | 'prism-band'
  | 'triangular-prism-net'
  | 'square-prism-net'
  | 'square-pyramid-net'
  | 'triangular-pyramid-net'
  | 'cylinder-net'
  | 'cone-net'

export interface NetExplorerProps {
  readonly initialShape?: NetShape
  readonly showEnrichment?: boolean
  readonly className?: string
}

type PieceKind = 'rect' | 'circle' | 'triangle' | 'sector'

type NetPiece = {
  readonly id: string
  readonly role: string
  readonly kind: PieceKind
  readonly x: number
  readonly y: number
  readonly width?: number
  readonly height?: number
  readonly radius?: number
  readonly points?: string
  readonly label?: string
}

type ShapeInfo = {
  readonly id: NetShape
  readonly label: string
  readonly icon: string
  readonly description: string
  readonly lesson: string
}

type NetLayout = {
  readonly id: NetLayoutId
  readonly shape: Exclude<NetShape, 'sphere'>
  readonly title: string
  readonly summary: string
  readonly pieces: readonly NetPiece[]
}

const PIECE_COLOURS = ['#ffd776', '#ffad82', '#b9ebdc', '#cbbcf7', '#9edcf2', '#f7b8ce', '#c9e59d']

const shapeInfos: readonly ShapeInfo[] = [
  {
    id: 'cube', label: 'Kubus', icon: '🧊',
    description: '6 persegi yang sama besar.',
    lesson: 'Setiap persegi akan menjadi satu bidang kubus.',
  },
  {
    id: 'rectangular-prism', label: 'Balok', icon: '📦',
    description: '6 persegi panjang dalam 3 pasang yang sama.',
    lesson: 'Pasangkan bidang yang ukurannya sama sebelum melipat.',
  },
  {
    id: 'triangular-prism', label: 'Prisma Segitiga', icon: '🔺',
    description: '2 segitiga dan 3 persegi panjang.',
    lesson: 'Dua segitiga yang sama akan menjadi alas dan tutup yang sejajar.',
  },
  {
    id: 'square-prism', label: 'Prisma Segiempat', icon: '🔷',
    description: '2 segiempat dan 4 bidang tegak.',
    lesson: 'Balok adalah contoh khusus prisma segiempat.',
  },
  {
    id: 'square-pyramid', label: 'Limas Segiempat', icon: '🔻',
    description: '1 persegi dan 4 segitiga.',
    lesson: 'Keempat segitiga akan bertemu pada satu titik puncak.',
  },
  {
    id: 'triangular-pyramid', label: 'Limas Segitiga', icon: '🔺',
    description: '4 segitiga yang saling tersambung.',
    lesson: 'Tiga segitiga di sekeliling alas akan bertemu pada puncak.',
  },
  {
    id: 'cylinder', label: 'Tabung', icon: '🥫',
    description: '2 lingkaran dan 1 persegi panjang.',
    lesson: 'Saat selimut tabung dibuka, ia berubah menjadi persegi panjang.',
  },
  {
    id: 'cone', label: 'Kerucut', icon: '🍦',
    description: '1 lingkaran dan 1 juring.',
    lesson: 'Juring digulung hingga ujungnya bertemu di puncak.',
  },
  {
    id: 'sphere', label: 'Bola', icon: '⚽',
    description: 'Permukaan lengkung utuh.',
    lesson: 'Kulit bola tidak dapat diratakan tepat menjadi satu jaring-jaring datar.',
  },
]

const layouts: readonly NetLayout[] = [
  {
    id: 'cube-cross', shape: 'cube', title: 'Salib enam persegi',
    summary: 'Semua bidang persegi tersambung sisi ke sisi dan dapat dilipat menjadi kubus.',
    pieces: [
      { id: 'top', role: 'Bidang atas', kind: 'rect', x: 190, y: 20, width: 72, height: 72 },
      { id: 'left', role: 'Bidang kiri', kind: 'rect', x: 118, y: 92, width: 72, height: 72 },
      { id: 'front', role: 'Bidang depan / alas', kind: 'rect', x: 190, y: 92, width: 72, height: 72 },
      { id: 'right', role: 'Bidang kanan', kind: 'rect', x: 262, y: 92, width: 72, height: 72 },
      { id: 'bottom', role: 'Bidang bawah', kind: 'rect', x: 190, y: 164, width: 72, height: 72 },
      { id: 'back', role: 'Bidang belakang / penutup', kind: 'rect', x: 190, y: 236, width: 72, height: 72 },
    ],
  },
  {
    id: 'prism-band', shape: 'rectangular-prism', title: 'Sabuk balok 4 × 3 × 2',
    summary: 'Tiga pasang persegi panjang yang sama ukuran membentuk balok.',
    pieces: [
      { id: 'top', role: 'Tutup 4 × 3', kind: 'rect', x: 32, y: 18, width: 132, height: 72, label: '4 × 3' },
      { id: 'front', role: 'Depan 4 × 2', kind: 'rect', x: 32, y: 90, width: 132, height: 50, label: '4 × 2' },
      { id: 'right', role: 'Kanan 3 × 2', kind: 'rect', x: 164, y: 90, width: 96, height: 50, label: '3 × 2' },
      { id: 'back', role: 'Belakang 4 × 2', kind: 'rect', x: 260, y: 90, width: 132, height: 50, label: '4 × 2' },
      { id: 'left', role: 'Kiri 3 × 2', kind: 'rect', x: 392, y: 90, width: 70, height: 50, label: '3 × 2' },
      { id: 'base', role: 'Alas 4 × 3', kind: 'rect', x: 32, y: 140, width: 132, height: 72, label: '4 × 3' },
    ],
  },
  {
    id: 'triangular-prism-net', shape: 'triangular-prism', title: 'Dua segitiga dan tiga persegi panjang',
    summary: 'Tiga persegi panjang membentuk pita, lalu dua segitiga menutup ujungnya.',
    pieces: [
      { id: 'wall-1', role: 'Bidang tegak 1', kind: 'rect', x: 94, y: 112, width: 98, height: 58 },
      { id: 'wall-2', role: 'Bidang tegak 2', kind: 'rect', x: 192, y: 112, width: 98, height: 58 },
      { id: 'wall-3', role: 'Bidang tegak 3', kind: 'rect', x: 290, y: 112, width: 98, height: 58 },
      { id: 'base', role: 'Alas segitiga', kind: 'triangle', x: 94, y: 50, points: '94,112 192,112 143,42' },
      { id: 'top', role: 'Tutup segitiga', kind: 'triangle', x: 290, y: 170, points: '290,170 388,170 339,240' },
    ],
  },
  {
    id: 'square-prism-net', shape: 'square-prism', title: 'Dua segiempat dan empat bidang tegak',
    summary: 'Empat bidang tegak membentuk pita dengan satu segiempat di setiap ujung.',
    pieces: [
      { id: 'wall-1', role: 'Bidang tegak 1', kind: 'rect', x: 68, y: 110, width: 92, height: 56 },
      { id: 'wall-2', role: 'Bidang tegak 2', kind: 'rect', x: 160, y: 110, width: 92, height: 56 },
      { id: 'wall-3', role: 'Bidang tegak 3', kind: 'rect', x: 252, y: 110, width: 92, height: 56 },
      { id: 'wall-4', role: 'Bidang tegak 4', kind: 'rect', x: 344, y: 110, width: 72, height: 56 },
      { id: 'base', role: 'Alas segiempat', kind: 'rect', x: 68, y: 38, width: 92, height: 72 },
      { id: 'top', role: 'Tutup segiempat', kind: 'rect', x: 68, y: 166, width: 92, height: 72 },
    ],
  },
  {
    id: 'square-pyramid-net', shape: 'square-pyramid', title: 'Satu persegi dan empat segitiga',
    summary: 'Empat segitiga mengelilingi satu persegi alas.',
    pieces: [
      { id: 'base', role: 'Alas persegi', kind: 'rect', x: 200, y: 104, width: 76, height: 76 },
      { id: 'north', role: 'Bidang tegak utara', kind: 'triangle', x: 200, y: 42, points: '200,104 276,104 238,38' },
      { id: 'east', role: 'Bidang tegak timur', kind: 'triangle', x: 276, y: 104, points: '276,104 276,180 344,142' },
      { id: 'south', role: 'Bidang tegak selatan', kind: 'triangle', x: 200, y: 180, points: '200,180 276,180 238,246' },
      { id: 'west', role: 'Bidang tegak barat', kind: 'triangle', x: 132, y: 104, points: '200,104 200,180 132,142' },
    ],
  },
  {
    id: 'triangular-pyramid-net', shape: 'triangular-pyramid', title: 'Empat segitiga yang tersambung',
    summary: 'Satu segitiga alas dikelilingi tiga segitiga bidang tegak.',
    pieces: [
      { id: 'base', role: 'Alas segitiga', kind: 'triangle', x: 180, y: 95, points: '180,165 284,165 232,77' },
      { id: 'side-1', role: 'Bidang tegak 1', kind: 'triangle', x: 180, y: 165, points: '180,165 284,165 232,253' },
      { id: 'side-2', role: 'Bidang tegak 2', kind: 'triangle', x: 104, y: 88, points: '180,165 232,77 104,88' },
      { id: 'side-3', role: 'Bidang tegak 3', kind: 'triangle', x: 284, y: 88, points: '284,165 232,77 360,88' },
    ],
  },
  {
    id: 'cylinder-net', shape: 'cylinder', title: 'Dua lingkaran dan satu persegi panjang',
    summary: 'Persegi panjang adalah selimut; dua lingkaran menjadi alas dan tutup.',
    pieces: [
      { id: 'wall', role: 'Selimut tabung', kind: 'rect', x: 114, y: 94, width: 246, height: 88, label: 'selimut' },
      { id: 'base', role: 'Alas lingkaran', kind: 'circle', x: 178, y: 226, radius: 43, label: 'alas' },
      { id: 'top', role: 'Tutup lingkaran', kind: 'circle', x: 296, y: 50, radius: 43, label: 'tutup' },
    ],
  },
  {
    id: 'cone-net', shape: 'cone', title: 'Satu lingkaran dan satu juring',
    summary: 'Juring menjadi selimut dan lingkaran menjadi alas kerucut.',
    pieces: [
      { id: 'wall', role: 'Juring / selimut kerucut', kind: 'sector', x: 72, y: 28, label: 'juring' },
      { id: 'base', role: 'Alas lingkaran', kind: 'circle', x: 346, y: 196, radius: 48, label: 'alas' },
    ],
  },
]

function defaultLayout(shape: Exclude<NetShape, 'sphere'>): NetLayout {
  return layouts.find((layout) => layout.shape === shape) ?? layouts[0]
}

function shapeInfo(shape: NetShape): ShapeInfo {
  return shapeInfos.find((item) => item.id === shape) ?? shapeInfos[0]
}

function PieceGraphic({ piece, colour, selected, onSelect }: {
  readonly piece: NetPiece
  readonly colour: string
  readonly selected: boolean
  readonly onSelect?: () => void
}) {
  const common = {
    fill: colour,
    opacity: 1,
    stroke: selected ? '#4f3d8c' : '#53495c',
    strokeWidth: selected ? 4 : 2.2,
    style: { cursor: onSelect ? 'pointer' : 'default', transition: 'opacity .18s ease, filter .18s ease' },
  }
  const labelStyle = { fill: '#463b50', fontSize: 13, fontWeight: 800, pointerEvents: 'none' as const }
  const title = `${piece.role}${piece.label ? `: ${piece.label}` : ''}`
  const withInteraction = (graphic: ReactNode) => (
    <g onClick={onSelect} role={onSelect ? 'button' : undefined} aria-label={onSelect ? `Pilih ${title}` : undefined} tabIndex={onSelect ? 0 : undefined} onKeyDown={(event) => {
      if (onSelect && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect() }
    }}>
      <title>{title}</title>{graphic}
    </g>
  )
  if (piece.kind === 'rect') {
    const width = piece.width ?? 60
    const height = piece.height ?? 60
    return withInteraction(<><rect x={piece.x} y={piece.y} width={width} height={height} rx="7" {...common} /><text x={piece.x + width / 2} y={piece.y + height / 2 + 4} textAnchor="middle" {...labelStyle}>{piece.label ?? ''}</text></>)
  }
  if (piece.kind === 'circle') {
    const radius = piece.radius ?? 36
    return withInteraction(<><circle cx={piece.x} cy={piece.y} r={radius} {...common} /><text x={piece.x} y={piece.y + 4} textAnchor="middle" {...labelStyle}>{piece.label ?? ''}</text></>)
  }
  if (piece.kind === 'sector') {
    return withInteraction(<><path d="M 85 220 L 270 220 A 195 195 0 0 1 177 32 Z" {...common} /><text x="172" y="173" textAnchor="middle" {...labelStyle}>{piece.label ?? ''}</text></>)
  }
  return withInteraction(<><polygon points={piece.points ?? ''} {...common} /><text x={piece.x + 42} y={piece.y + 32} textAnchor="middle" {...labelStyle}>{piece.label ?? ''}</text></>)
}

function NetDiagram({ layout, selectedPieceId, onSelectPiece }: {
  readonly layout: NetLayout
  readonly selectedPieceId: string | null
  readonly onSelectPiece?: (piece: NetPiece) => void
}) {
  return <svg className="net-lab__diagram" viewBox="0 0 480 320" role="img" aria-label={`Jaring-jaring ${layout.title}`} preserveAspectRatio="xMidYMid meet">{layout.pieces.map((piece, index) => <PieceGraphic key={piece.id} piece={piece} colour={PIECE_COLOURS[index % PIECE_COLOURS.length]} selected={selectedPieceId === piece.id} onSelect={onSelectPiece ? () => onSelectPiece(piece) : undefined} />)}</svg>
}

function SpherePanel() { return <section className="net-lab__sphere" aria-live="polite"><span aria-hidden="true">⚽</span><div><h4>Bola tidak punya jaring-jaring datar tepat</h4><p>Permukaan bola hanya dapat menjadi datar jika diregangkan, dikerutkan, atau disobek. Coba bandingkan kulit jeruk yang dibuka dengan enam persegi pada kubus.</p></div></section> }

/** Laboratorium jaring-jaring yang dapat disentuh dan dilipat dengan penggeser. */
export function NetExplorer({ initialShape = 'cube', showEnrichment = true, className = '' }: NetExplorerProps) {
  const [shape, setShape] = useState<NetShape>(initialShape)
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(() => {
    if (initialShape === 'sphere') return null
    return defaultLayout(initialShape).pieces[0]?.id ?? null
  })
  const [foldProgress, setFoldProgress] = useState(0)
  const info = shapeInfo(shape)
  const activeLayout = shape === 'sphere' ? null : defaultLayout(shape)
  const selectedPiece = activeLayout?.pieces.find((piece) => piece.id === selectedPieceId) ?? activeLayout?.pieces[0]

  function chooseShape(nextShape: NetShape) {
    setShape(nextShape)
    setFoldProgress(0)
    if (nextShape === 'sphere') {
      setSelectedPieceId(null)
      return
    }
    const nextLayout = defaultLayout(nextShape)
    setSelectedPieceId(nextLayout.pieces[0]?.id ?? null)
  }

  return (
    <section className={`net-lab ${className}`.trim()} aria-labelledby="net-explorer-title">
      <style>{NET_LAB_STYLES}</style>
      <header className="net-lab__heading">
        <div>
          <p className="net-lab__eyebrow">MIO MENGAJAKMU MENCOBA</p>
          <h3 id="net-explorer-title" aria-label="Jaring-jaring bangun ruang">Jaring-jaring bangun ruang</h3>
          <p>Pilih satu bentuk. Sentuh bidang berwarna, lalu geser penggeser untuk melihat jaring-jaring berubah menjadi bangun ruang.</p>
        </div>
        <span className="net-lab__cat" aria-hidden="true">🐱</span>
      </header>
      <div className="net-lab__shape-tabs" role="tablist" aria-label="Pilih bentuk yang ingin dicoba">
        {shapeInfos.map((item) => <button type="button" role="tab" key={item.id} aria-selected={shape === item.id} className={shape === item.id ? 'is-active' : ''} onClick={() => chooseShape(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
      </div>
      <aside className="net-lab__shape-note"><span aria-hidden="true">💡</span><div><b>{info.label}</b><p>{info.description} {info.lesson}</p></div></aside>
      {shape === 'sphere' || !activeLayout ? <SpherePanel /> : <section className="net-lab__fold-mode" aria-labelledby="net-fold-heading">
        <section className="net-lab__workbench" aria-labelledby="net-workbench-heading">
          <div className="net-lab__section-title">
            <div><p className="net-lab__eyebrow">SENTUH BAGIANNYA</p><h4 id="net-workbench-heading">{activeLayout.title}</h4></div>
            <span>{activeLayout.pieces.length} bagian</span>
          </div>
          <NetDiagram layout={activeLayout} selectedPieceId={selectedPieceId} onSelectPiece={(piece) => setSelectedPieceId(piece.id)} />
          <p className="net-lab__net-summary">{activeLayout.summary}</p>
          <p className="net-lab__tap-note">Ketuk bidang berwarna yang ingin kamu kenali.</p>
          <div className="net-lab__selected-piece" aria-live="polite"><b>{selectedPiece?.role ?? 'Pilih satu bidang'}</b><p>{selectedPiece ? `Bagian ini akan menjadi ${selectedPiece.role.toLowerCase()} saat bangun dilipat.` : 'Pilih satu bidang berwarna, ya.'}</p></div>
        </section>
        <div className="net-lab__fold-copy">
          <p className="net-lab__eyebrow">LIPAT DENGAN PENGGESER</p>
          <h4 id="net-fold-heading">Geser untuk melipat</h4>
          <p>Mulai dari jaring yang rata. Geser perlahan sampai semua bidang bertemu menjadi {info.label.toLowerCase()}.</p>
          <div className="net-lab__slider-wrap">
            <label htmlFor={`net-fold-slider-${shape}`}>Geser lipatan dari jaring terbuka ke bangun tertutup</label>
            <input id={`net-fold-slider-${shape}`} data-testid={`net-fold-slider-${shape}`} type="range" min="0" max="100" step="1" value={foldProgress} onChange={(event) => setFoldProgress(Number(event.currentTarget.value))} />
            <div aria-hidden="true"><span>Jaring terbuka</span><span>Bangun tertutup</span></div>
          </div>
          <NetFold3D shape={shape} progress={foldProgress / 100} activePieces={selectedPieceId ? [selectedPieceId] : []} />
        </div>
        <p className="net-lab__honesty">Model 3D dapat diputar dengan seret atau sentuh. Setiap bidang bersisi datar bergerak pada rusuk yang sama; bila ingin mencoba dengan tangan, gunakan kertas untuk membuat jaring-jaringmu sendiri.</p>
      </section>}
      {showEnrichment && <aside className="net-lab__enrichment"><span aria-hidden="true">🐾</span><p><b>Catatan Mio:</b> {shape === 'sphere' ? 'bola tidak dapat dibuat dari satu jaring-jaring datar yang tepat. Kamu tetap dapat mengenali bagian lengkungnya lewat model 3D.' : 'jaring yang tampil adalah salah satu susunan yang tepat. Yang penting, semua bidang dapat bertemu tanpa saling menutupi.'}</p></aside>}
    </section>
  )
}

const NET_LAB_STYLES = `
  .net-lab { --ink:#493d52; --muted:#746978; --purple:#725ac1; background:linear-gradient(135deg,#fff9ed 0%,#fbf7ff 54%,#effbf7 100%); border:1px solid #eadfd1; border-radius:22px; color:var(--ink); margin:1rem 0; overflow:hidden; padding:clamp(1rem,3vw,1.5rem); }
  .net-lab *, .net-lab *::before, .net-lab *::after { box-sizing:border-box; }.net-lab__heading { align-items:flex-start; display:flex; gap:1rem; justify-content:space-between; }.net-lab__heading h3 { color:#44374e; font-size:clamp(1.4rem,3vw,1.95rem); letter-spacing:-.04em; line-height:1.05; margin:.15rem 0 .42rem; }.net-lab__heading p:not(.net-lab__eyebrow) { color:var(--muted); font-size:.9rem; line-height:1.48; margin:0; max-width:43rem; }.net-lab__eyebrow { color:#786c80; font-size:.69rem; font-weight:900; letter-spacing:.08em; margin:0; text-transform:uppercase; }.net-lab__cat { align-items:center; background:rgba(255,255,255,.78); border:1px solid #eadfd1; border-radius:16px; display:grid; flex:0 0 auto; font-size:1.8rem; height:3rem; place-items:center; width:3rem; }
  .net-lab__shape-tabs { display:flex; flex-wrap:wrap; gap:.45rem; margin:1.05rem 0 .7rem; }.net-lab__shape-tabs button { align-items:center; background:#fff; border:1px solid #e5d9cd; border-radius:999px; color:#6d6173; cursor:pointer; display:inline-flex; font:inherit; font-size:.76rem; font-weight:900; gap:.28rem; min-height:44px; padding:.45rem .67rem; }.net-lab__shape-tabs button:hover,.net-lab__shape-tabs button.is-active { background:var(--purple); border-color:var(--purple); color:#fff; }.net-lab__shape-tabs button span { font-size:1rem; }.net-lab__shape-note { align-items:flex-start; background:#eef9f4; border:1px solid #d4ede4; border-radius:14px; display:flex; gap:.6rem; margin-bottom:.8rem; padding:.7rem .8rem; }.net-lab__shape-note > span { font-size:1.1rem; }.net-lab__shape-note b { color:#3e7160; font-size:.82rem; }.net-lab__shape-note p { color:#5d776f; font-size:.77rem; line-height:1.42; margin:.15rem 0 0; }
  .net-lab__mode-tabs { background:#eee9fa; border-radius:999px; display:inline-flex; gap:.18rem; padding:.25rem; }.net-lab__mode-tabs button { background:transparent; border:0; border-radius:999px; color:#716582; cursor:pointer; font:inherit; font-size:.78rem; font-weight:900; min-height:44px; padding:.45rem .75rem; }.net-lab__mode-tabs button.is-active { background:#fff; box-shadow:0 2px 8px rgba(75,54,92,.13); color:#5d469a; }.net-lab__layouts { background:rgba(255,255,255,.67); border:1px solid #ece2da; border-radius:14px; margin:1rem 0; padding:.72rem; }.net-lab__layouts > p { color:#776d78; font-size:.76rem; font-weight:800; margin:0 0 .45rem; }.net-lab__layouts > div { display:flex; flex-wrap:wrap; gap:.5rem; }.net-lab__layouts button { background:#fff; border:2px solid #e9dfd8; border-radius:10px; color:#5d5261; cursor:pointer; display:grid; gap:.1rem; min-height:44px; min-width:155px; padding:.5rem .65rem; text-align:left; }.net-lab__layouts button.is-selected { background:#f3efff; border-color:#826bd0; }.net-lab__layouts b { font-size:.76rem; }.net-lab__layouts small { color:#786e7a; font-size:.67rem; }
  .net-lab__open-grid { display:grid; gap:1rem; grid-template-columns:minmax(0,1.2fr) minmax(255px,.8fr); margin-top:1rem; }.net-lab__workbench,.net-lab__guide { background:rgba(255,255,255,.8); border:1px solid #ede2da; border-radius:17px; padding:.9rem; }.net-lab__section-title { align-items:flex-start; display:flex; gap:.7rem; justify-content:space-between; }.net-lab__section-title h4,.net-lab__guide h4 { color:#4e4158; font-size:1.05rem; margin:.16rem 0 0; }.net-lab__section-title > span { background:#f1ecff; border-radius:999px; color:#6550a0; font-size:.65rem; font-weight:900; padding:.3rem .48rem; white-space:nowrap; }.net-lab__diagram { display:block; height:min(320px,39vw); margin:.55rem auto; max-width:100%; min-height:205px; width:100%; }.net-lab__diagram--compact { height:175px; margin:0; min-height:125px; }.net-lab__net-summary { background:#fff8e9; border-radius:10px; color:#776246; font-size:.74rem; line-height:1.4; margin:.15rem 0 .45rem; padding:.5rem .6rem; }.net-lab__tap-note { color:#736878; font-size:.72rem; font-weight:800; margin:.12rem 0 .5rem; text-align:center; }.net-lab__selected-piece { background:#f2edff; border-radius:11px; color:#625285; padding:.65rem .72rem; }.net-lab__selected-piece b { font-size:.8rem; }.net-lab__selected-piece p { color:#6d627a; font-size:.75rem; line-height:1.38; margin:.16rem 0 0; }
  .net-lab__guide { display:grid; align-content:start; gap:.65rem; }.net-lab__guide ul { color:#5e716c; font-size:.77rem; line-height:1.42; margin:0; padding-left:1.15rem; }.net-lab__guide li + li { margin-top:.22rem; }.net-lab__check { background:#ff875d; border:0; border-radius:11px; box-shadow:inset 0 -3px 0 rgba(157,68,46,.27); color:#fff; cursor:pointer; font:inherit; font-size:.84rem; font-weight:900; min-height:44px; padding:.6rem .85rem; }.net-lab__check:hover { background:#f17b53; }.net-lab__feedback { background:#f5f1ed; border-radius:11px; color:#706570; font-size:.78rem; line-height:1.42; min-height:59px; padding:.66rem .75rem; }.net-lab__feedback p { margin:.18rem 0 0; }.net-lab__feedback.is-visible.is-valid { background:#e2f7e8; color:#356545; }.net-lab__feedback.is-visible.is-invalid { background:#fff0dd; color:#83563d; }
  .net-lab__fold-mode { background:rgba(255,255,255,.8); border:1px solid #ece2da; border-radius:17px; display:grid; gap:1rem; grid-template-columns:minmax(230px,.78fr) minmax(0,1.22fr); margin-top:1rem; padding:.95rem; }.net-lab__fold-copy h4 { color:#4c4056; font-size:1.12rem; line-height:1.3; margin:.22rem 0 .35rem; }.net-lab__fold-copy > p:not(.net-lab__eyebrow) { color:#716775; font-size:.82rem; line-height:1.48; margin:0; }.net-lab__step-dots { display:flex; gap:.45rem; margin:1rem 0 .7rem; }.net-lab__step-dots button { align-items:center; background:#f1ebff; border:0; border-radius:50%; color:#735bbd; cursor:pointer; display:flex; font:inherit; font-size:.72rem; font-weight:900; height:44px; justify-content:center; width:44px; }.net-lab__step-dots button.is-active { background:#715ac0; color:#fff; }.net-lab__fold-actions { display:flex; gap:.5rem; }.net-lab__fold-actions button { background:#fff; border:1px solid #dfd4ed; border-radius:10px; color:#5c4c8e; cursor:pointer; font:inherit; font-size:.76rem; font-weight:900; min-height:44px; padding:.45rem .65rem; }.net-lab__fold-actions button:disabled { background:#f3f0ed; color:#aaa09c; cursor:not-allowed; }.net-lab__fold-visual { background:#effbf7; border:1px solid #d4eee5; border-radius:14px; display:grid; gap:.5rem; grid-template-columns:1fr 1fr; padding:.65rem; }.net-lab__fold-visual > div > p { color:#5d766e; font-size:.67rem; font-weight:900; margin:0 0 .25rem; text-align:center; text-transform:uppercase; }.net-lab__folded-preview { align-items:center; background:rgba(255,255,255,.72); border-radius:11px; display:flex; flex-direction:column; justify-content:center; min-height:170px; }.net-lab__folded-preview svg { height:145px; max-width:100%; width:100%; }.net-lab__folded-preview p { color:#5b776d; font-size:.7rem; font-weight:900; margin:0 0 .35rem; text-transform:capitalize; }.net-lab__honesty { background:#fff8e9; border-radius:10px; color:#806a47; font-size:.71rem; grid-column:1 / -1; line-height:1.4; margin:0; padding:.55rem .65rem; }
  .net-lab__slider-wrap { background:#f2edff; border:1px solid #ddd2f5; border-radius:13px; margin:.9rem 0; padding:.72rem; }.net-lab__slider-wrap label { color:#54466b; display:block; font-size:.76rem; font-weight:900; line-height:1.35; }.net-lab__slider-wrap input[type="range"] { accent-color:#715ac0; cursor:pointer; display:block; margin:.55rem 0 .3rem; min-height:44px; width:100%; }.net-lab__slider-wrap > div { color:#746a7e; display:flex; font-size:.67rem; font-weight:800; justify-content:space-between; }.net-lab__fold-copy > section[data-testid^="net-fold-3d"] { margin-top:.8rem; }
  .net-lab__sphere { align-items:flex-start; background:#fff4e8; border:1px solid #f2dfc7; border-radius:16px; display:flex; gap:.8rem; margin-top:1rem; padding:1rem; }.net-lab__sphere > span { align-items:center; background:#fff; border-radius:13px; display:flex; flex:0 0 auto; font-size:1.6rem; height:48px; justify-content:center; width:48px; }.net-lab__sphere h4 { color:#76503c; font-size:1.02rem; margin:.08rem 0 .3rem; }.net-lab__sphere p { color:#806b5c; font-size:.8rem; line-height:1.45; margin:0; }.net-lab__enrichment { align-items:flex-start; background:rgba(235,228,255,.72); border:1px solid #dcd0fb; border-radius:14px; color:#675879; display:flex; gap:.65rem; font-size:.77rem; line-height:1.42; margin-top:1rem; padding:.75rem .85rem; }.net-lab__enrichment > span { font-size:1.1rem; }.net-lab__enrichment p { margin:0; }.net-lab button:focus-visible,.net-lab g[role="button"]:focus-visible { outline:3px solid #51409e; outline-offset:3px; }
  @media (max-width:720px) { .net-lab__open-grid,.net-lab__fold-mode,.net-lab__fold-visual { grid-template-columns:1fr; }.net-lab__diagram { height:min(320px,67vw); }.net-lab__fold-visual { grid-template-columns:1fr 1fr; }.net-lab__shape-tabs { flex-wrap:nowrap; overflow-x:auto; padding-bottom:.28rem; }.net-lab__shape-tabs button { flex:0 0 auto; }.net-lab__heading { gap:.65rem; }.net-lab__cat { font-size:1.45rem; height:2.55rem; width:2.55rem; } }
  @media (max-width:390px) { .net-lab__fold-visual { grid-template-columns:1fr; }.net-lab__layouts button { min-width:0; width:100%; } }
`

export default NetExplorer
