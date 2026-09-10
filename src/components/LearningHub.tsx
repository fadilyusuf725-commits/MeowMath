import { lazy, Suspense, useState } from 'react'
import {
  curriculumMenuData,
  learningResourceMenuIntro,
  solidResources,
  type SolidId,
  type SolidResource,
} from '../content/learningResources'

const SolidExplorer3D = lazy(async () => ({ default: (await import('./SolidExplorer3D')).SolidExplorer3D }))
const GeometryExplorer = lazy(async () => ({ default: (await import('./GeometryExplorer')).GeometryExplorer }))

interface LearningHubProps {
  readonly onGoHome: () => void
  readonly onOpenNets: () => void
}

interface CurriculumMapProps {
  readonly onGoHome: () => void
}

const learningSteps = [
  ['1', 'Amati', 'Lihat model, gambar, atau benda yang mirip bangun ruang.'],
  ['2', 'Putar', 'Bayangkan bentuknya saat dilihat dari arah lain.'],
  ['3', 'Bangun', 'Susun dengan balok satuan dan periksa posisinya.'],
  ['4', 'Jelaskan', 'Sampaikan alasan dengan kata bidang, rusuk, dan titik sudut.'],
] as const

function ResourcePicker({
  resource,
  selected,
  onSelect,
}: {
  readonly resource: SolidResource
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`solid-picker ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="solid-picker__icon" aria-hidden="true">{resource.icon}</span>
      <span className="solid-picker__copy">
        <b>{resource.name}</b>
        <small>{resource.classification.replace('Bangun ruang ', '')}</small>
      </span>
    </button>
  )
}

function NetSummary({ resource }: { readonly resource: SolidResource }) {
  return (
    <section className="resource-subcard resource-subcard--net" aria-labelledby="resource-net-heading">
      <div className="resource-subcard__heading">
        <div>
          <p className="mini-label">JARING-JARING</p>
          <h3 id="resource-net-heading">Jika dibuka menjadi datar</h3>
        </div>
        <span aria-hidden="true">✂️</span>
      </div>
      {resource.possibleNets.map((net) => (
        <article className={`net-fact net-fact--${net.availability}`} key={net.id}>
          <h4>{net.title}</h4>
          <p>{net.description}</p>
          {net.pieces.length > 0 && (
            <ul className="piece-list">
              {net.pieces.map((piece) => <li key={`${piece.amount}-${piece.shape}`}><b>{piece.amount}×</b> {piece.shape}</li>)}
            </ul>
          )}
          <p className="net-fact__prompt"><b>Coba pikirkan:</b> {net.explorationPrompt}</p>
          {net.caution && <p className="net-fact__caution"><b>Ingat:</b> {net.caution}</p>}
        </article>
      ))}
    </section>
  )
}

export function LearningHub({ onGoHome, onOpenNets }: LearningHubProps) {
  const [selectedId, setSelectedId] = useState<SolidId>('kubus')
  const selected = solidResources.find((resource) => resource.id === selectedId) ?? solidResources[0]

  return (
    <main className="content-page learning-hub-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke Kota Meow</button>
      <section className="resource-hero">
        <div>
          <p className="eyebrow">YUK KENALAN DENGAN BENTUK</p>
          <h1>{learningResourceMenuIntro.title}</h1>
          <p>Putar modelnya, perhatikan cirinya, dan cari benda di sekitarmu yang bentuknya mirip.</p>
        </div>
        <div className="resource-hero__cat" aria-hidden="true">🐱<span>◻︎</span></div>
      </section>

      <details className="learning-steps learning-steps--collapsible">
        <summary><span className="learning-steps__icon" aria-hidden="true">💡</span><span><b>Teman berpikir Mio</b><small>Empat langkah sederhana</small></span><span aria-hidden="true">⌄</span></summary>
        <div className="learning-steps__content" aria-labelledby="learning-steps-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CARA BELAJAR MIO</p>
              <h2 id="learning-steps-heading">Kita tidak perlu menghafal</h2>
            </div>
            <p>Kita amati bersama, lalu mencoba dengan cara yang paling nyaman.</p>
          </div>
          <ol>
            {learningSteps.map(([number, title, description]) => (
              <li key={number}><span>{number}</span><div><b>{title}</b><p>{description}</p></div></li>
            ))}
          </ol>
        </div>
      </details>

      <section className="resource-library" aria-labelledby="resource-library-heading">
        <div className="section-heading resource-library__heading">
          <div>
            <p className="eyebrow">PUSTAKA BANGUN RUANG</p>
            <h2 id="resource-library-heading">Pilih bangun yang ingin kamu jelajahi</h2>
          </div>
        </div>
        <p className="tier-description">Pilih satu bentuk yang membuatmu penasaran. Putar modelnya, lalu lihat apa yang berubah dari setiap arah.</p>
        <div className="solid-picker-grid">
          {solidResources.map((resource) => (
            <ResourcePicker
              key={resource.id}
              resource={resource}
              selected={selected.id === resource.id}
              onSelect={() => setSelectedId(resource.id)}
            />
          ))}
        </div>
      </section>

      <article className="resource-detail" aria-labelledby="resource-detail-heading">
        <header className="resource-detail__header">
          <div className="resource-detail__title-icon" aria-hidden="true">{selected.icon}</div>
          <div>
            <div className="resource-detail__meta"><span>{selected.classification}</span></div>
            <h2 id="resource-detail-heading">{selected.name}</h2>
            <p>{selected.definition}</p>
          </div>
        </header>
        <p className="why-learn"><b>Mengapa dipelajari?</b> {selected.whyLearnThis}</p>

        <section className="resource-model-section" aria-labelledby="resource-model-heading">
          <div className="resource-model-section__copy">
            <p className="mini-label">AJAK MODELNYA BERPUTAR</p>
            <h3 id="resource-model-heading">Putar model {selected.name}</h3>
            <p>Seret modelnya. Coba lihat dari depan, atas, dan samping. Bagian mana yang baru kamu temukan?</p>
          </div>
          <Suspense fallback={<div className="resource-model-loading" aria-busy="true">Mio sedang menyiapkan model 3D…</div>}>
            <SolidExplorer3D key={selected.id} solidId={selected.id} label={selected.name} />
          </Suspense>
        </section>

        {selected.id === 'kubus' && (
          <section className="resource-lab-section" aria-label="Laboratorium bagian kubus">
            <Suspense fallback={<div className="resource-model-loading" aria-busy="true">Mio sedang menyiapkan Laboratorium Kubus…</div>}>
              <GeometryExplorer />
            </Suspense>
          </section>
        )}

        <details className="resource-more">
          <summary>Kalau masih penasaran <span aria-hidden="true">⌄</span></summary>
          <div className="resource-detail__grid">
            <section className="resource-subcard" aria-labelledby="properties-heading">
              <p className="mini-label">CIRI-CIRI</p>
              <h3 id="properties-heading">Bagian yang perlu diperhatikan</h3>
              <dl className="property-list">
                {selected.properties.map((property) => (
                  <div key={property.label}>
                    <dt>{property.label}</dt>
                    <dd>{property.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="resource-subcard resource-subcard--examples" aria-labelledby="examples-heading">
              <p className="mini-label">DI SEKITAR KITA</p>
              <h3 id="examples-heading">Benda yang mirip</h3>
              <ul className="everyday-list">
                {selected.everydayExamples.map((example) => (
                  <li key={example.name}><b>{example.name}</b><span>{example.description}</span></li>
                ))}
              </ul>
              <p className="resource-note">Benda nyata disebut <b>mirip</b>, karena bentuk fisiknya tidak selalu seideal model matematika.</p>
            </section>
          </div>

          <NetSummary resource={selected} />
          <div className="resource-actions">
            <button type="button" className="primary-button" onClick={onOpenNets}>Jelajahi jaring-jaring 3D →</button>
            <span>Materi ini terkait: {selected.relatedTpCodes.join(' · ')}</span>
          </div>

          <details className="formula-details">
            <summary>Kalau penasaran dengan rumus</summary>
            <p>Rumus di bawah tersedia sebagai perluasan pengetahuan. Misi inti MeowMath tetap berfokus pada bentuk, susunan, dan visualisasi spasial.</p>
            <div>
              {selected.formulas.map((formula) => (
                <article key={formula.name}>
                  <h4>{formula.name}</h4>
                  <strong>{formula.expression}</strong>
                  <p>{formula.variables}</p>
                  <small>{formula.purpose}</small>
                </article>
              ))}
            </div>
          </details>
        </details>
      </article>
    </main>
  )
}

export function CurriculumMap({ onGoHome }: CurriculumMapProps) {
  const { officialCp, meowMathProposal, schoolDecision } = curriculumMenuData
  return (
    <main className="content-page curriculum-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke Kota Meow</button>
      <section className="curriculum-hero">
        <div>
          <p className="eyebrow">UNTUK YANG INGIN TAHU LEBIH BANYAK</p>
          <h1>Ke mana perjalanan ini membawa kita?</h1>
          <p>{curriculumMenuData.phaseLabel}. Di sini pendamping bisa melihat arah belajar MeowMath.</p>
        </div>
        <span aria-hidden="true">🧭</span>
      </section>
      <aside className="curriculum-notice"><b>Catatan untuk pendamping.</b> {curriculumMenuData.curriculumNotice}</aside>

      <details className="curriculum-details">
        <summary><span aria-hidden="true">🧭</span><span><b>Dasar perjalanan</b><small>Acuan Matematika Fase C</small></span><span aria-hidden="true">⌄</span></summary>
        <section className="curriculum-section curriculum-section--official" aria-labelledby="cp-heading">
          <header>
            <span className="source-label source-label--official">{officialCp.statusLabel}</span>
            <h2 id="cp-heading">{officialCp.title}</h2>
            <p>{officialCp.subject} · {officialCp.phase} · Elemen {officialCp.element}</p>
          </header>
          <p className="curriculum-summary">{officialCp.summaryNotice}</p>
          <div className="cp-focus-grid">
            {officialCp.focuses.map((focus) => (
              <article key={focus.code}>
                <b>{focus.code}</b>
                <h3>{focus.summary}</h3>
                <p><span>Dalam MeowMath:</span> {focus.meowMathTranslation}</p>
              </article>
            ))}
          </div>
          <div className="source-links">
            {officialCp.sources.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                <b>{source.label} ↗</b><small>{source.note}</small>
              </a>
            ))}
          </div>
        </section>
      </details>

      <details className="curriculum-details">
        <summary><span aria-hidden="true">🗺️</span><span><b>Rute belajar MeowMath</b><small>Tujuan dan langkah yang dipakai</small></span><span aria-hidden="true">⌄</span></summary>
        <section className="curriculum-section curriculum-section--proposal" aria-labelledby="tp-atp-heading">
          <header>
            <span className="source-label source-label--proposal">{meowMathProposal.statusLabel}</span>
            <h2 id="tp-atp-heading">{meowMathProposal.title}</h2>
            <p>{meowMathProposal.purpose}</p>
          </header>
          <div className="curriculum-boundaries">
            <b>Batas materi v1</b>
            <ul>{meowMathProposal.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
          </div>

        <h3 className="curriculum-subheading">Tujuan Pembelajaran (TP)</h3>
        <div className="tp-list">
          {meowMathProposal.learningObjectives.map((objective) => (
            <article key={objective.code}>
              <span>{objective.code}</span>
              <div><h4>{objective.objective}</h4><p><b>Lingkup:</b> {objective.materialScope}</p><p><b>Bukti belajar:</b> {objective.learningEvidence}</p></div>
              <small>{objective.missionName}</small>
            </article>
          ))}
        </div>

        <h3 className="curriculum-subheading">Alur Tujuan Pembelajaran (ATP)</h3>
        <p className="atp-flow">{meowMathProposal.atpFlow}</p>
        <ol className="atp-list">
          {meowMathProposal.atpSteps.map((step) => (
            <li key={step.tpCode}>
              <span>{step.order}</span>
              <div><b>{step.tpCode} · {step.focus}</b><p>{step.coreExperience}</p><small><b>Bukti formatif:</b> {step.formativeEvidence}</small></div>
            </li>
          ))}
        </ol>
        <p className="curriculum-unit-note">{meowMathProposal.unitNote}</p>
          <a className="single-source-link" href={meowMathProposal.source.href} target="_blank" rel="noreferrer">{meowMathProposal.source.label} ↗ <small>{meowMathProposal.source.note}</small></a>
        </section>
      </details>

      <aside className="school-decision"><span className="source-label source-label--school">{schoolDecision.statusLabel}</span><p>{schoolDecision.note}</p></aside>
    </main>
  )
}
