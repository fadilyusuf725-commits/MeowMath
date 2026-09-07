import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import mioCat from './assets/mio-cat-architect.svg'
import cityMap from './assets/meow-city-map.svg'
import geometryBadge from './assets/geometry-badge.svg'
import { CurriculumMap, LearningHub } from './components/LearningHub'
import type { MissionScore } from './components/MissionPlayer'
import type { ArchitecturePresetId, ArchitectureStudioDesign } from './components/ArchitectureStudio'
import { missionById, missions, type LearningStatus, type MissionDefinition, type MissionId } from './content/missions'
import {
  clearAllLocalData,
  createProfile,
  deleteCreativeDesign,
  getSettings,
  listCreativeDesigns,
  listProfiles,
  listResults,
  saveCreativeDesign,
  saveMissionResult,
  saveSettings,
  touchProfile,
  type AppSettings,
  type CreativeDesign,
  type LearnerProfile,
  type MissionResult,
} from './lib/progress'
import './styles.css'

const MissionPlayer = lazy(async () => ({ default: (await import('./components/MissionPlayer')).MissionPlayer }))
const ArchitectureStudio = lazy(async () => ({ default: (await import('./components/ArchitectureStudio')).ArchitectureStudio }))
const NetExplorer = lazy(async () => ({ default: (await import('./components/NetExplorer')).NetExplorer }))

type Screen = 'welcome' | 'home' | 'missions' | 'teacher' | 'settings' | 'mission' | 'materials' | 'curriculum' | 'nets' | 'architecture'

type Completion = {
  readonly mission: MissionDefinition
  readonly result: MissionResult
}

const statusClass: Record<LearningStatus, string> = {
  Mandiri: 'status--independent',
  Berkembang: 'status--growing',
  'Perlu dukungan': 'status--support',
}

function getLatestResults(results: readonly MissionResult[]): Map<MissionId, MissionResult> {
  const latest = new Map<MissionId, MissionResult>()
  for (const result of results) {
    const current = latest.get(result.missionId)
    if (!current || current.completedAt < result.completedAt) latest.set(result.missionId, result)
  }
  return latest
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function getProgressLabel(result?: MissionResult): string {
  if (!result) return 'Belum dimulai'
  return result.status
}

function toArchitecturePresetId(value: string): ArchitecturePresetId {
  const known: readonly ArchitecturePresetId[] = ['kanvas', 'pondok-mio', 'menara-kumis', 'gerbang-kota', 'custom']
  return known.includes(value as ArchitecturePresetId) ? value as ArchitecturePresetId : 'custom'
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [profiles, setProfiles] = useState<LearnerProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<LearnerProfile | null>(null)
  const [results, setResults] = useState<MissionResult[]>([])
  const [allResults, setAllResults] = useState<MissionResult[]>([])
  const [settings, setSettings] = useState<AppSettings>({ id: 'settings', audioEnabled: true, reducedMotion: false })
  const [creativeDesigns, setCreativeDesigns] = useState<CreativeDesign[]>([])
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<MissionId | null>(null)
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [newNickname, setNewNickname] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const latestResults = useMemo(() => getLatestResults(results), [results])
  const activeMission = activeMissionId ? missionById[activeMissionId] : null
  const completedCount = latestResults.size

  useEffect(() => {
    async function bootstrap() {
      const [storedProfiles, storedSettings, storedResults] = await Promise.all([
        listProfiles(),
        getSettings(),
        listResults(),
      ])
      setProfiles(storedProfiles)
      setSettings(storedSettings)
      setAllResults(storedResults)
      if (storedProfiles.length > 0) {
        setActiveProfile(storedProfiles[0])
        const profileResults = storedResults.filter((result) => result.profileId === storedProfiles[0].id)
        setResults(profileResults)
        setScreen('home')
      }
      setIsLoading(false)
    }
    void bootstrap()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion)
  }, [settings.reducedMotion])

  async function reloadData(profileId = activeProfile?.id) {
    const [storedProfiles, storedResults] = await Promise.all([listProfiles(), listResults()])
    setProfiles(storedProfiles)
    setAllResults(storedResults)
    setResults(profileId ? storedResults.filter((result) => result.profileId === profileId) : [])
  }

  async function reloadCreativeDesigns(profileId = activeProfile?.id) {
    if (!profileId) {
      setCreativeDesigns([])
      return
    }
    const storedDesigns = await listCreativeDesigns(profileId)
    setCreativeDesigns(storedDesigns)
  }

  async function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const profile = await createProfile(newNickname)
      setNewNickname('')
      setActiveProfile(profile)
      setResults([])
      setCreativeDesigns([])
      setSelectedDesignId(null)
      setEditingDesignId(null)
      await reloadData(profile.id)
      setScreen('home')
    } catch {
      // The visible form hint handles the only expected validation error.
    }
  }

  async function selectProfile(profile: LearnerProfile) {
    const updated = await touchProfile(profile)
    setActiveProfile(updated)
    setCreativeDesigns([])
    setSelectedDesignId(null)
    setEditingDesignId(null)
    await reloadData(updated.id)
    setScreen('home')
  }

  async function toggleSetting(key: 'audioEnabled' | 'reducedMotion') {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    await saveSettings(next)
  }

  function isMissionLocked(index: number): boolean {
    if (index === 0) return false
    return !latestResults.has(missions[index - 1].id)
  }

  function startMission(mission: MissionDefinition) {
    const index = missions.findIndex((item) => item.id === mission.id)
    if (isMissionLocked(index)) return
    setActiveMissionId(mission.id)
    setCompletion(null)
    setScreen('mission')
  }

  async function handleMissionFinish(score: MissionScore) {
    if (!activeMission || !activeProfile) return
    const result = await saveMissionResult({
      profileId: activeProfile.id,
      missionId: activeMission.id,
      correct: score.correct,
      total: score.total,
      attempts: score.attempts,
      hintsUsed: score.hintsUsed,
    })
    await reloadData(activeProfile.id)
    setCompletion({ mission: activeMission, result })
  }

  async function openArchitecture() {
    if (!activeProfile) return
    // Opening the studio from another page starts a clean draft. A saved card
    // can still be selected explicitly from the local gallery.
    if (screen !== 'architecture') {
      setSelectedDesignId(null)
      setEditingDesignId(null)
    }
    setScreen('architecture')
    await reloadCreativeDesigns(activeProfile.id)
  }

  async function saveArchitectureDesign(design: ArchitectureStudioDesign) {
    if (!activeProfile) return
    const saved = await saveCreativeDesign({
      id: editingDesignId ?? undefined,
      profileId: activeProfile.id,
      title: design.title,
      grid: design.grid,
      placedSolids: design.placedSolids,
      shape: design.shape,
      presetId: design.presetId,
    })
    // Keep the current studio mounted after a first save so its confirmation
    // and unsaved draft stay visible. Later saves still update this same id.
    setEditingDesignId(saved.id)
    await reloadCreativeDesigns(activeProfile.id)
  }

  async function removeArchitectureDesign(id: string) {
    if (!activeProfile) return
    const design = creativeDesigns.find((item) => item.id === id)
    if (!design || !window.confirm(`Hapus karya “${design.title}” dari perangkat ini?`)) return
    await deleteCreativeDesign(id)
    if (selectedDesignId === id) setSelectedDesignId(null)
    if (editingDesignId === id) setEditingDesignId(null)
    await reloadCreativeDesigns(activeProfile.id)
  }

  async function eraseLocalData() {
    if (!window.confirm('Hapus semua nama panggilan, progres, dan pengaturan dari perangkat ini?')) return
    await clearAllLocalData()
    setProfiles([])
    setResults([])
    setAllResults([])
    setCreativeDesigns([])
    setActiveProfile(null)
    setSelectedDesignId(null)
    setEditingDesignId(null)
    setActiveMissionId(null)
    setCompletion(null)
    setScreen('welcome')
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (screen === 'mission' && activeMission && activeProfile) {
    return (
      <>
        <Suspense fallback={<LoadingScreen />}>
          <MissionPlayer
            mission={activeMission}
            audioEnabled={settings.audioEnabled}
            onExit={() => setScreen('home')}
            onFinish={handleMissionFinish}
          />
        </Suspense>
        {completion && (
          <CompletionDialog
            completion={completion}
            onClose={() => {
              setCompletion(null)
              setScreen('missions')
            }}
          />
        )}
      </>
    )
  }

  if (!activeProfile || screen === 'welcome') {
    return (
      <WelcomeScreen
        nickname={newNickname}
        onNicknameChange={setNewNickname}
        onSubmit={handleCreateProfile}
        profiles={profiles}
        onSelectProfile={selectProfile}
      />
    )
  }

  return (
    <div className="app-shell">
      <Topbar
        profile={activeProfile}
        screen={screen}
        completedCount={completedCount}
        isOnline={isOnline}
        onGoHome={() => setScreen('home')}
        onGoSettings={() => setScreen('settings')}
        onSwitchProfile={() => setScreen('welcome')}
      />
      {screen === 'home' && (
        <MainMenuScreen
          profile={activeProfile}
          latestResults={latestResults}
          completedCount={completedCount}
          isMissionLocked={isMissionLocked}
          onGoMissions={() => setScreen('missions')}
          onGoMaterials={() => setScreen('materials')}
          onGoNets={() => setScreen('nets')}
          onGoArchitecture={() => void openArchitecture()}
          onGoCurriculum={() => setScreen('curriculum')}
          onGoTeacher={() => setScreen('teacher')}
        />
      )}
      {screen === 'missions' && (
        <MissionMapScreen
          latestResults={latestResults}
          isMissionLocked={isMissionLocked}
          onStartMission={startMission}
          onGoHome={() => setScreen('home')}
          onGoTeacher={() => setScreen('teacher')}
        />
      )}
      {screen === 'materials' && <LearningHub onGoHome={() => setScreen('home')} onOpenNets={() => setScreen('nets')} />}
      {screen === 'curriculum' && <CurriculumMap onGoHome={() => setScreen('home')} />}
      {screen === 'nets' && (
        <NetsPage
          onGoHome={() => setScreen('home')}
          onGoMaterials={() => setScreen('materials')}
        />
      )}
      {screen === 'architecture' && (
        <ArchitecturePage
          designs={creativeDesigns}
          selectedDesignId={selectedDesignId}
          onGoHome={() => setScreen('home')}
          onNewDesign={() => {
            setSelectedDesignId(null)
            setEditingDesignId(null)
          }}
          onSelectDesign={(id) => {
            setSelectedDesignId(id)
            setEditingDesignId(id)
          }}
          onDeleteDesign={removeArchitectureDesign}
          onSave={saveArchitectureDesign}
        />
      )}
      {screen === 'teacher' && (
        <TeacherScreen
          profiles={profiles}
          results={allResults}
          onGoHome={() => setScreen('home')}
          onErase={eraseLocalData}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onToggleSetting={toggleSetting}
          onGoHome={() => setScreen('home')}
          onErase={eraseLocalData}
        />
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <main className="loading-screen" aria-busy="true">
      <img src={geometryBadge} alt="" />
      <p>Mio sedang menyiapkan Kota Meow…</p>
    </main>
  )
}

interface WelcomeScreenProps {
  readonly nickname: string
  readonly onNicknameChange: (value: string) => void
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  readonly profiles: readonly LearnerProfile[]
  readonly onSelectProfile: (profile: LearnerProfile) => void
}

function WelcomeScreen({ nickname, onNicknameChange, onSubmit, profiles, onSelectProfile }: WelcomeScreenProps) {
  return (
    <main className="welcome-page">
      <div className="welcome-decoration welcome-decoration--one" />
      <div className="welcome-decoration welcome-decoration--two" />
      <section className="welcome-copy">
        <div className="brand brand--large"><span aria-hidden="true">🐾</span> MeowMath</div>
        <p className="eyebrow">GEOMETRI RUANG · KELAS V</p>
        <h1>Bangun Kota Meow dengan <em>pikiran spasialmu.</em></h1>
        <p className="welcome-lede">Putar, amati, susun, dan baca bangun ruang bersama Mio si kucing arsitek.</p>
        <ul className="welcome-benefits">
          <li>🔄 Putar model kubus dan balok</li>
          <li>🧱 Susun bangun dari blok satuan</li>
          <li>👁️ Tebak tampak depan, atas, dan samping</li>
        </ul>
      </section>
      <section className="welcome-panel">
        <img className="mio-welcome" src={mioCat} alt="Mio, kucing arsitek MeowMath, membawa blueprint." />
        <div className="welcome-form-card">
          <h2>Siapa nama panggilanmu?</h2>
          <p>Disimpan hanya di perangkat ini. Tidak perlu email atau akun.</p>
          <form onSubmit={onSubmit}>
            <label htmlFor="nickname">Nama panggilan</label>
            <input
              id="nickname"
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              placeholder="Contoh: Aisyah"
              maxLength={20}
              autoComplete="off"
            />
            <button className="primary-button primary-button--wide" type="submit" disabled={!nickname.trim()}>
              Masuk ke Kota Meow →
            </button>
          </form>
        </div>
        {profiles.length > 0 && (
          <div className="returning-profiles">
            <p>Atau lanjutkan petualangan:</p>
            <div>
              {profiles.slice(0, 4).map((profile) => (
                <button type="button" key={profile.id} onClick={() => onSelectProfile(profile)}>
                  <span>{profile.nickname.slice(0, 1).toUpperCase()}</span>{profile.nickname}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

interface TopbarProps {
  readonly profile: LearnerProfile
  readonly screen: Screen
  readonly completedCount: number
  readonly isOnline: boolean
  readonly onGoHome: () => void
  readonly onGoSettings: () => void
  readonly onSwitchProfile: () => void
}

function Topbar({ profile, screen, completedCount, isOnline, onGoHome, onGoSettings, onSwitchProfile }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="brand brand--button" onClick={onGoHome} aria-label="Kembali ke menu utama Kota Meow">
        <span aria-hidden="true">🐾</span> MeowMath
      </button>
      <nav aria-label="Navigasi utama">
        <button type="button" className={screen === 'home' ? 'is-active' : ''} onClick={onGoHome}>Menu Utama</button>
      </nav>
      <div className="topbar-actions">
        <span className={`connection-badge ${isOnline ? '' : 'is-offline'}`}>{isOnline ? '● siap offline' : '● mode offline'}</span>
        <button type="button" className="avatar-button" onClick={onSwitchProfile} title="Ganti murid">
          <span>{profile.nickname.slice(0, 1).toUpperCase()}</span>
          <b>{profile.nickname}</b>
          <small>{completedCount}/6 misi</small>
        </button>
        <button type="button" className={`icon-button ${screen === 'settings' ? 'is-active' : ''}`} onClick={onGoSettings} aria-label="Pengaturan">⚙️</button>
      </div>
    </header>
  )
}

interface MainMenuScreenProps {
  readonly profile: LearnerProfile
  readonly latestResults: ReadonlyMap<MissionId, MissionResult>
  readonly completedCount: number
  readonly isMissionLocked: (index: number) => boolean
  readonly onGoMissions: () => void
  readonly onGoMaterials: () => void
  readonly onGoNets: () => void
  readonly onGoArchitecture: () => void
  readonly onGoCurriculum: () => void
  readonly onGoTeacher: () => void
}

function MainMenuScreen({ profile, latestResults, completedCount, isMissionLocked, onGoMissions, onGoMaterials, onGoNets, onGoArchitecture, onGoCurriculum, onGoTeacher }: MainMenuScreenProps) {
  const nextMissionIndex = missions.findIndex((_, index) => !latestResults.has(missions[index].id) && !isMissionLocked(index))
  const nextMission = nextMissionIndex === -1 ? missions[missions.length - 1] : missions[nextMissionIndex]
  const latestResult = Array.from(latestResults.values()).sort((first, second) => second.completedAt.localeCompare(first.completedAt))[0]
  const nextMissionLabel = completedCount === 0 ? 'Mulai dari Pintu Kota' : `Lanjutkan ${nextMission.title}`

  return (
    <main className="main-menu-page">
      <section className="main-menu-hero">
        <div className="main-menu-hero__copy">
          <p className="eyebrow">MENU UTAMA · KELAS V</p>
          <h1>Halo, {profile.nickname}!<br /><em>Mau mulai dari mana?</em></h1>
          <p>Pilih satu tempat untuk mengamati, mencoba, lalu membuat bangun ruang bersama Mio.</p>
          <div className="main-menu-progress" aria-label="Progres belajar">
            <span><b>{completedCount}</b>/6 misi selesai</span>
            <span className={latestResult ? statusClass[latestResult.status] : ''}>{latestResult?.status ?? 'Belum mulai'}</span>
          </div>
        </div>
        <div className="main-menu-hero__art" aria-hidden="true">
          <img className="city-map" src={cityMap} alt="Ilustrasi Kota Meow dengan bangunan berbentuk kubus dan balok." />
          <img className="mio-hero" src={mioCat} alt="Mio kucing arsitek menunjuk peta Kota Meow." />
        </div>
      </section>

      <section className="main-menu-board" aria-labelledby="main-menu-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PILIH TEMPAT BELAJAR</p>
            <h2 id="main-menu-heading">Enam pintu Kota Meow</h2>
          </div>
          <p className="main-menu-board__hint">Satu pilihan dulu, lalu coba sebanyak yang kamu mau.</p>
        </div>
        <div className="main-menu-grid">
          <button type="button" className="main-menu-card main-menu-card--missions" onClick={onGoMissions}>
            <span className="main-menu-card__icon" aria-hidden="true">🗺️</span>
            <span><b>Misi Kota Meow</b><small>{nextMissionLabel} →</small></span>
            <i aria-hidden="true">→</i>
          </button>
          <button type="button" className="main-menu-card main-menu-card--materials" onClick={onGoMaterials}>
            <span className="main-menu-card__icon" aria-hidden="true">🔷</span>
            <span><b>Materi Bangun Ruang</b><small>Putar dan kenali 9 bentuk</small></span>
            <i aria-hidden="true">→</i>
          </button>
          <button type="button" className="main-menu-card main-menu-card--nets" onClick={onGoNets}>
            <span className="main-menu-card__icon" aria-hidden="true">✂️</span>
            <span><b>Jaring-jaring 3D</b><small>Buka, lipat, dan amati</small></span>
            <i aria-hidden="true">→</i>
          </button>
          <button type="button" className="main-menu-card main-menu-card--architecture" onClick={onGoArchitecture}>
            <span className="main-menu-card__icon" aria-hidden="true">🏗️</span>
            <span><b>Studio Arsitek</b><small>Berkreasi dengan bentuk ruang</small></span>
            <i aria-hidden="true">→</i>
          </button>
        </div>
        <details className="main-menu-more">
          <summary>Untuk orang dewasa <span aria-hidden="true">⌄</span></summary>
          <div className="main-menu-more__grid">
            <button type="button" className="main-menu-card main-menu-card--curriculum" onClick={onGoCurriculum}>
              <span className="main-menu-card__icon" aria-hidden="true">🧭</span>
              <span><b>Tujuan belajar</b><small>Lihat CP, TP, dan ATP</small></span>
              <i aria-hidden="true">→</i>
            </button>
            <button type="button" className="main-menu-card main-menu-card--teacher" onClick={onGoTeacher}>
              <span className="main-menu-card__icon" aria-hidden="true">👩‍🏫</span>
              <span><b>Ringkasan guru</b><small>Lihat progres belajar lokal</small></span>
              <i aria-hidden="true">→</i>
            </button>
          </div>
        </details>
      </section>

      <section className="main-menu-note">
        <img src={geometryBadge} alt="Ikon kubus MeowMath" />
        <div>
          <b>Belajar pelan, bereksperimen banyak.</b>
          <p>Tidak ada batas waktu atau papan peringkat. Yang penting: kamu mengamati, menjelaskan, lalu mencoba lagi.</p>
        </div>
      </section>
    </main>
  )
}

interface MissionMapScreenProps {
  readonly latestResults: ReadonlyMap<MissionId, MissionResult>
  readonly isMissionLocked: (index: number) => boolean
  readonly onStartMission: (mission: MissionDefinition) => void
  readonly onGoHome: () => void
  readonly onGoTeacher: () => void
}

function MissionMapScreen({ latestResults, isMissionLocked, onStartMission, onGoHome, onGoTeacher }: MissionMapScreenProps) {
  return (
    <main className="home-page mission-map-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke menu utama</button>
      <section className="mission-map-heading">
        <div><p className="eyebrow">PETA PETUALANGAN</p><h1>Enam misi, satu Kota Meow</h1><p>Pilih misi yang sudah terbuka. Kamu juga boleh mengulang misi untuk mencoba strategi baru.</p></div>
        <span aria-hidden="true">🗺️</span>
      </section>
      <section className="mission-section" aria-labelledby="mission-heading">
        <div className="section-heading">
          <div><p className="eyebrow">JALUR BELAJAR</p><h2 id="mission-heading">Pilih misi berikutnya</h2></div>
          <button type="button" className="text-button" onClick={onGoTeacher}>Lihat panduan guru →</button>
        </div>
        <div className="mission-route">
          {missions.map((mission, index) => {
            const locked = isMissionLocked(index)
            const result = latestResults.get(mission.id)
            return (
              <article className={`mission-card mission-card--${mission.color} ${locked ? 'is-locked' : ''}`} key={mission.id}>
                <div className="mission-card-top">
                  <span className="mission-card-number">{mission.number === 0 ? '✦' : mission.number}</span>
                  <span className="mission-card-icon" aria-hidden="true">{locked ? '🔒' : mission.icon}</span>
                </div>
                <p>{mission.tpCode}</p>
                <h3>{mission.title}</h3>
                <span className={`learning-status ${result ? statusClass[result.status] : ''}`}>{locked ? 'Selesaikan misi sebelumnya' : getProgressLabel(result)}</span>
                <button type="button" disabled={locked} onClick={() => onStartMission(mission)}>
                  {result ? 'Ulangi misi' : locked ? 'Terkunci' : 'Mulai misi'} →
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function NetsPage({ onGoHome, onGoMaterials }: { readonly onGoHome: () => void; readonly onGoMaterials: () => void }) {
  return (
    <main className="content-page nets-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke menu utama</button>
      <section className="nets-hero">
        <div>
          <p className="eyebrow">EKSPLORASI BENTUK 3D</p>
          <h1>Jaring-jaring bangun ruang</h1>
          <p>Buka jaringnya, ikuti lipatan 3D, lalu putar model untuk melihat bagaimana bidang datar membentuk bangun ruang.</p>
        </div>
        <span aria-hidden="true">✂️</span>
      </section>
      <details className="nets-method-details">
        <summary><span aria-hidden="true">💡</span><span><b>Cara mengamati</b><small>Tiga petunjuk sebelum mulai</small></span><span aria-hidden="true">⌄</span></summary>
        <section className="nets-method" aria-label="Cara mengamati jaring-jaring">
          <article><span>1</span><b>Hitung bidang</b><p>Pastikan jumlah bidang sesuai dengan bangun yang dipilih.</p></article>
          <article><span>2</span><b>Cocokkan bentuk</b><p>Cari alas, tutup, dan bidang tegak yang ukuran atau bentuknya sesuai.</p></article>
          <article><span>3</span><b>Bayangkan lipatan</b><p>Bidang harus tersambung sisi ke sisi tanpa saling menutupi.</p></article>
        </section>
      </details>
      <Suspense fallback={<LoadingScreen />}>
        <NetExplorer />
      </Suspense>
      <section className="net-scope-note">
        <div><span aria-hidden="true">🐾</span><h2>Ruang lingkup MeowMath</h2><p>Eksplorasi jaring-jaring membantu memahami kubus, balok, prisma, limas, tabung, dan kerucut. Bola tetap menjadi pengecualian: permukaannya tidak dapat diratakan menjadi satu jaring-jaring yang tepat.</p></div>
        <button type="button" className="secondary-button" onClick={onGoMaterials}>Buka resource lengkap →</button>
      </section>
    </main>
  )
}

interface ArchitecturePageProps {
  readonly designs: readonly CreativeDesign[]
  readonly selectedDesignId: string | null
  readonly onGoHome: () => void
  readonly onNewDesign: () => void
  readonly onSelectDesign: (id: string) => void
  readonly onDeleteDesign: (id: string) => void | Promise<void>
  readonly onSave: (design: ArchitectureStudioDesign) => void | Promise<void>
}

function ArchitecturePage({ designs, selectedDesignId, onGoHome, onNewDesign, onSelectDesign, onDeleteDesign, onSave }: ArchitecturePageProps) {
  const selected = designs.find((design) => design.id === selectedDesignId)
  const initialDesign = selected
    ? {
        title: selected.title,
        grid: selected.grid,
        placedSolids: selected.placedSolids,
        shape: selected.shape,
        presetId: toArchitecturePresetId(selected.presetId),
      }
    : undefined

  return (
    <main className="content-page architecture-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke menu utama</button>
      <section className="architecture-page-hero">
        <div>
          <p className="eyebrow">RUANG KREASI BEBAS</p>
          <h1>Jadilah arsitek Kota Meow</h1>
          <p>Pilih bangun ruang, tentukan koordinat X–Y–Z, lalu letakkan di kanvas 3D. Satu titik hanya untuk satu bangun, jadi karyamu tetap rapi.</p>
        </div>
        <span aria-hidden="true">🏗️</span>
      </section>

      <section className="saved-designs" aria-labelledby="saved-designs-heading">
        <div className="section-heading">
          <div><p className="eyebrow">GALERI LOKAL</p><h2 id="saved-designs-heading">Karya tersimpan</h2></div>
          <button type="button" className="secondary-button" onClick={onNewDesign}>+ Karya baru</button>
        </div>
        {designs.length === 0 ? (
          <p className="saved-designs__empty">Belum ada karya tersimpan. Mulai dengan kanvas bebas atau salah satu contoh Mio di bawah.</p>
        ) : (
          <div className="saved-designs__list">
            {designs.map((design) => (
              <article className={selected?.id === design.id ? 'is-selected' : ''} key={design.id}>
                <button type="button" className="saved-designs__open" onClick={() => onSelectDesign(design.id)}>
                  <span aria-hidden="true">🧱</span>
                  <span><b>{design.title}</b><small>{design.placedSolids?.length ?? design.shape.length} bangun · {design.grid.width} × {design.grid.height} × {design.grid.depth}</small></span>
                </button>
                <button type="button" className="saved-designs__delete" aria-label={`Hapus karya ${design.title}`} onClick={() => void onDeleteDesign(design.id)}>×</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Suspense fallback={<LoadingScreen />}>
        <ArchitectureStudio
          key={selected?.id ?? 'new-architecture-design'}
          initialDesign={initialDesign}
          onSave={onSave}
          maxCells={96}
        />
      </Suspense>
    </main>
  )
}

interface TeacherScreenProps {
  readonly profiles: readonly LearnerProfile[]
  readonly results: readonly MissionResult[]
  readonly onGoHome: () => void
  readonly onErase: () => void
}

function TeacherScreen({ profiles, results, onGoHome, onErase }: TeacherScreenProps) {
  const latestByProfile = useMemo(() => {
    const data = new Map<string, Map<MissionId, MissionResult>>()
    for (const profile of profiles) data.set(profile.id, new Map())
    for (const result of results) {
      const profileResults = data.get(result.profileId)
      if (!profileResults) continue
      const current = profileResults.get(result.missionId)
      if (!current || current.completedAt < result.completedAt) profileResults.set(result.missionId, result)
    }
    return data
  }, [profiles, results])

  return (
    <main className="info-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke menu utama</button>
      <section className="teacher-hero">
        <div>
          <p className="eyebrow">RINGKASAN LOKAL</p>
          <h1>Untuk guru</h1>
          <p>Gunakan ringkasan ini sebagai bahan percakapan belajar, bukan sebagai peringkat murid.</p>
        </div>
        <div className="teacher-privacy">🔒 Tidak ada akun, email, pelacak, atau unggahan data.</div>
      </section>
      <section className="teacher-card">
        <div className="section-heading">
          <div><h2>Perkembangan di perangkat ini</h2><p>{profiles.length} profil lokal · {results.length} rekaman aktivitas</p></div>
          <span className="teacher-legend"><i className="status-dot status-dot--independent" /> Mandiri <i className="status-dot status-dot--growing" /> Berkembang <i className="status-dot status-dot--support" /> Perlu dukungan</span>
        </div>
        {profiles.length === 0 ? <p>Belum ada profil murid.</p> : (
          <div className="teacher-table-scroll">
            <table>
              <thead><tr><th>Murid</th>{missions.map((mission) => <th key={mission.id}>{mission.number === 0 ? 'D' : mission.number}</th>)}<th>Catatan</th></tr></thead>
              <tbody>
                {profiles.map((profile) => {
                  const latest = latestByProfile.get(profile.id) ?? new Map<MissionId, MissionResult>()
                  const completed = latest.size
                  return (
                    <tr key={profile.id}>
                      <th scope="row"><span className="table-avatar">{profile.nickname.slice(0, 1).toUpperCase()}</span>{profile.nickname}</th>
                      {missions.map((mission) => {
                        const result = latest.get(mission.id)
                        return <td key={mission.id}>{result ? <span className={`status-dot ${statusClass[result.status].replace('status--', 'status-dot--')}`} title={`${result.status}: ${result.correct}/${result.total} mandiri`} /> : <span className="empty-dot">—</span>}</td>
                      })}
                      <td>{completed}/6 selesai {completed > 0 ? `· terakhir ${formatDate([...latest.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0].completedAt)}` : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="teacher-guidance-grid">
        <article><span>1</span><h3>Amati</h3><p>Minta murid menjelaskan bagian atau arah yang ia lihat, bukan langsung menyebut jawaban.</p></article>
        <article><span>2</span><h3>Tanya alasannya</h3><p>Gunakan pertanyaan: “Bagaimana kamu tahu tampak ini berasal dari atas?”</p></article>
        <article><span>3</span><h3>Tindak lanjuti</h3><p>Status Perlu dukungan berarti ulangi dengan benda konkret dan petunjuk visual lebih banyak.</p></article>
      </section>
      <section className="curriculum-note">
        <h2>Pemetaan kurikulum</h2>
        <p>MeowMath memetakan Matematika Fase C, elemen Geometri: konstruksi dan penguraian kubus, balok, gabungannya, serta visualisasi tampak depan–atas–samping dan peta berpetak.</p>
        <p className="muted">Dokumen ATP lengkap dan unit enam sesi tersedia di folder <code>docs/</code> proyek ini.</p>
      </section>
      <button type="button" className="danger-button" onClick={onErase}>Hapus semua data lokal perangkat</button>
    </main>
  )
}

interface SettingsScreenProps {
  readonly settings: AppSettings
  readonly onToggleSetting: (key: 'audioEnabled' | 'reducedMotion') => void
  readonly onGoHome: () => void
  readonly onErase: () => void
}

function SettingsScreen({ settings, onToggleSetting, onGoHome, onErase }: SettingsScreenProps) {
  return (
    <main className="info-page settings-page">
      <button type="button" className="text-button" onClick={onGoHome}>← Kembali ke menu utama</button>
      <section className="settings-hero"><p className="eyebrow">KENYAMANAN BELAJAR</p><h1>Pengaturan</h1><p>Sesuaikan pengalaman belajar tanpa mengubah progres murid.</p></section>
      <section className="settings-card">
        <SettingRow label="Bacakan instruksi" description="Gunakan suara Bahasa Indonesia dari perangkat saat tombol Dengarkan dipilih." checked={settings.audioEnabled} onChange={() => onToggleSetting('audioEnabled')} />
        <SettingRow label="Kurangi gerakan" description="Kurangi animasi dekoratif agar layar lebih tenang dan nyaman." checked={settings.reducedMotion} onChange={() => onToggleSetting('reducedMotion')} />
      </section>
      <section className="privacy-card"><span>🛡️</span><div><h2>Privasi anak dijaga</h2><p>Nama panggilan, progres, dan pengaturan tersimpan hanya di browser perangkat ini melalui penyimpanan lokal. Tidak ada akun atau data yang dikirim ke server.</p></div></section>
      <button type="button" className="danger-button" onClick={onErase}>Hapus semua data lokal perangkat</button>
    </main>
  )
}

function SettingRow({ label, description, checked, onChange }: { readonly label: string; readonly description: string; readonly checked: boolean; readonly onChange: () => void }) {
  return <label className="setting-row"><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={checked} onChange={onChange} /><i aria-hidden="true" /></label>
}

function CompletionDialog({ completion, onClose }: { readonly completion: Completion; readonly onClose: () => void }) {
  const { mission, result } = completion
  const message = result.status === 'Mandiri'
    ? 'Kamu menyelesaikannya dengan sangat mandiri. Mio bangga!'
    : result.status === 'Berkembang'
      ? 'Kamu terus mencoba dan berhasil. Itu cara arsitek belajar!'
      : 'Kamu sudah berani mencoba. Mari gunakan benda konkret bersama guru untuk latihan berikutnya.'
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="completion-dialog" role="dialog" aria-modal="true" aria-labelledby="completion-title">
        <div className="completion-stars" aria-hidden="true">✦ 🐾 ✦</div>
        <img src={mioCat} alt="Mio si kucing arsitek merayakan keberhasilan." />
        <p className="eyebrow">MISI SELESAI</p>
        <h2 id="completion-title">{mission.title} selesai!</h2>
        <span className={`learning-status ${statusClass[result.status]}`}>{result.status}</span>
        <p>{message}</p>
        <dl><div><dt>Jawaban mandiri</dt><dd>{result.correct}/{result.total}</dd></div><div><dt>Petunjuk dipakai</dt><dd>{result.hintsUsed}</dd></div></dl>
        <button type="button" className="primary-button primary-button--wide" onClick={onClose}>Kembali ke Kota Meow →</button>
      </section>
    </div>
  )
}

export default App
