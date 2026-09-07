import {
  createRectangularPrism,
  deriveOrthographicProjection,
  type GridDimensions,
  type OrthographicProjection,
  type ProjectionView,
  type Shape,
} from '../lib'

export type MissionId =
  | 'diagnostic'
  | 'pencari-kotak'
  | 'detektif-kumis'
  | 'bengkel-blok'
  | 'menara-tiga-arah'
  | 'kota-meow'

export type ChoiceChallenge = {
  readonly type: 'choice'
  readonly id: string
  readonly prompt: string
  readonly options: readonly string[]
  readonly correctIndex: number
  readonly explanation: string
  readonly hints: readonly string[]
  readonly visual?: 'cube' | 'cuboid' | 'mixed'
}

export type BuildChallenge = {
  readonly type: 'build'
  readonly id: string
  readonly prompt: string
  readonly target: Shape
  readonly grid: GridDimensions
  readonly explanation: string
  readonly hints: readonly string[]
  readonly startingShape?: Shape
  /**
   * Soal misi memakai cetak biru tersimpan. Mode tepat mencegah susunan lain
   * yang kebetulan tampak serupa dianggap sebagai jawaban yang sama.
   */
  readonly matchMode?: 'exact' | 'translation-independent'
}

export type ProjectionChallenge = {
  readonly type: 'projection'
  readonly id: string
  readonly prompt: string
  readonly object: Shape
  readonly view: ProjectionView
  readonly options: readonly OrthographicProjection[]
  readonly correctIndex: number
  readonly explanation: string
  readonly hints: readonly string[]
}

export type ProjectionDrawChallenge = {
  readonly type: 'projection-draw'
  readonly id: string
  readonly prompt: string
  readonly object: Shape
  readonly view: ProjectionView
  readonly expected: OrthographicProjection
  readonly explanation: string
  readonly hints: readonly string[]
}

export type MapChallenge = {
  readonly type: 'map'
  readonly id: string
  readonly prompt: string
  readonly columns: number
  readonly rows: number
  readonly target: { readonly column: number; readonly row: number }
  readonly targetLabel: string
  readonly explanation: string
  readonly hints: readonly string[]
}

/** Kartu yang dapat diseret atau dipilih lalu dipasangkan ke satu tempat. */
export type MatchItem = {
  readonly id: string
  readonly label: string
  readonly emoji?: string
}

export type MatchTarget = {
  readonly id: string
  readonly label: string
  readonly emoji?: string
  readonly helper?: string
}

export type MatchChallenge = {
  readonly type: 'match'
  readonly id: string
  readonly prompt: string
  readonly items: readonly MatchItem[]
  readonly targets: readonly MatchTarget[]
  /** Setiap kartu memiliki tepat satu tempat tujuan yang benar. */
  readonly correctMatches: Readonly<Record<string, string>>
  readonly explanation: string
  readonly hints: readonly string[]
}

export type SequenceItem = {
  readonly id: string
  readonly label: string
  readonly emoji?: string
}

export type SequenceChallenge = {
  readonly type: 'sequence'
  readonly id: string
  readonly prompt: string
  readonly items: readonly SequenceItem[]
  /** Urutan kartu yang ditampilkan pertama kali; sengaja belum benar. */
  readonly initialOrder: readonly string[]
  readonly correctOrder: readonly string[]
  readonly explanation: string
  readonly hints: readonly string[]
}

export type Challenge =
  | ChoiceChallenge
  | BuildChallenge
  | ProjectionChallenge
  | ProjectionDrawChallenge
  | MapChallenge
  | MatchChallenge
  | SequenceChallenge

export interface MissionDefinition {
  readonly id: MissionId
  readonly number: number
  readonly title: string
  readonly shortTitle: string
  readonly tpCode: string
  readonly objective: string
  readonly story: string
  readonly color: 'coral' | 'teal' | 'yellow' | 'purple' | 'blue' | 'green'
  readonly icon: string
  readonly challenges: readonly Challenge[]
}

const cube2 = createRectangularPrism({ width: 2, height: 2, depth: 2 })
const cube3 = createRectangularPrism({ width: 3, height: 3, depth: 3 })
const balok232 = createRectangularPrism({ width: 2, height: 3, depth: 2 })
const balok321 = createRectangularPrism({ width: 3, height: 2, depth: 1 })

const lStructure: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
]

/** Satu blok belakang-kanan sengaja salah untuk tantangan perbaiki bangunan. */
const lStructureWithMisplacedBlock: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 0, z: 1 },
]

const staircase: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 2, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: 0, y: 2, z: 0 },
]

/** Jejak berbentuk L dengan satu tumpukan; dipakai agar tampak atas bermakna. */
const lFootprintTower: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 2, z: 0 },
]

const bridge: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 2, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 2, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 2, y: 0, z: 1 },
]

/** Gerbang sederhana: alas, dua tiang, lalu palang atas. */
const gateStructure: Shape = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 2, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 2, y: 1, z: 0 },
  { x: 0, y: 2, z: 0 },
  { x: 1, y: 2, z: 0 },
  { x: 2, y: 2, z: 0 },
]

function projectionOptions(
  object: Shape,
  view: ProjectionView,
  incorrectObjects: readonly Shape[],
  correctIndex = 0,
): readonly OrthographicProjection[] {
  const options = incorrectObjects.map((candidate) => deriveOrthographicProjection(candidate, view))
  options.splice(correctIndex, 0, deriveOrthographicProjection(object, view))
  return options
}

export const missions: readonly MissionDefinition[] = [
  {
    id: 'diagnostic',
    number: 0,
    title: 'Pintu Kota Meow',
    shortTitle: 'Diagnostik',
    tpCode: 'Pemetaan awal',
    objective: 'Mio ingin mengetahui apa yang sudah kamu pahami sebelum petualangan dimulai.',
    story: 'Pintu Kota Meow hanya terbuka setelah Mio tahu cara terbaik membantumu belajar.',
    color: 'yellow',
    icon: '🐾',
    challenges: [
      {
        type: 'choice',
        id: 'd-1',
        prompt: 'Manakah yang merupakan bangun ruang?',
        options: ['Segitiga', 'Kubus', 'Lingkaran'],
        correctIndex: 1,
        explanation: 'Kubus memiliki panjang, lebar, dan tinggi sehingga menempati ruang.',
        hints: ['Bayangkan bentuk yang dapat dipegang seperti dadu.'],
        visual: 'cube',
      },
      {
        type: 'choice',
        id: 'd-2',
        prompt: 'Sebuah kotak yang lebih panjang daripada lebarnya paling mirip …',
        options: ['Balok', 'Kubus', 'Segitiga'],
        correctIndex: 0,
        explanation: 'Jika panjang, lebar, dan tinggi tidak semuanya sama, bentuknya paling mirip balok.',
        hints: ['Bandingkan: apakah semua rusuknya sama panjang?'],
        visual: 'cuboid',
      },
      {
        type: 'choice',
        id: 'd-3',
        prompt: 'Bagian tempat beberapa rusuk bertemu disebut …',
        options: ['Titik sudut', 'Bidang', 'Tampak atas'],
        correctIndex: 0,
        explanation: 'Titik sudut adalah titik pertemuan rusuk-rusuk pada bangun ruang.',
        hints: ['Cari bagian yang tampak seperti ujung tajam pada dadu.'],
      },
      {
        type: 'choice',
        id: 'd-4',
        prompt: 'Jika kamu melihat sebuah kotak dari atas, itu disebut …',
        options: ['Tampak samping', 'Tampak depan', 'Tampak atas'],
        correctIndex: 2,
        explanation: 'Tampak atas diperoleh saat mata melihat bangun dari arah atas.',
        hints: ['Bayangkan kamu seekor burung yang terbang di atas kotak.'],
      },
      {
        type: 'choice',
        id: 'd-5',
        prompt: 'Dadu paling mirip kubus karena …',
        options: [
          'semua rusuknya sama panjang',
          'hanya punya satu bidang',
          'bentuknya datar',
        ],
        correctIndex: 0,
        explanation: 'Pada kubus, semua rusuk memiliki panjang yang sama.',
        hints: ['Bandingkan semua arah ukurannya.'],
        visual: 'cube',
      },
      {
        type: 'choice',
        id: 'd-6',
        prompt: 'Pada peta berpetak, posisi taman dapat ditunjukkan dengan …',
        options: ['nama warna saja', 'pasangan kolom dan baris, misalnya kolom 3 baris 2', 'besar-kecil bangun'],
        correctIndex: 1,
        explanation: 'Peta berpetak memakai pasangan kolom dan baris agar lokasi mudah ditemukan.',
        hints: ['Seperti permainan papan: cari kotak menurut kolom dan baris.'],
      },
    ],
  },
  {
    id: 'pencari-kotak',
    number: 1,
    title: 'Pencari Kotak',
    shortTitle: 'Cari bentuk',
    tpCode: 'TP-1',
    objective: 'Membedakan representasi 2D dan 3D serta mengenali kubus dan balok.',
    story: 'Mio harus memilih kardus yang tepat untuk membawa bahan bangunan Kota Meow.',
    color: 'coral',
    icon: '📦',
    challenges: [
      {
        type: 'choice',
        id: 'p-1',
        prompt: 'Bentuk mana yang paling tepat untuk dadu mainan Mio?',
        options: ['Persegi', 'Kubus', 'Balok'],
        correctIndex: 1,
        explanation: 'Dadu ideal memiliki semua rusuk sama panjang, sehingga model matematikanya kubus.',
        hints: ['Dadu tidak tampak memanjang pada satu arah.'],
        visual: 'cube',
      },
      {
        type: 'match',
        id: 'p-2',
        prompt: 'Gudang Mio: taruh setiap benda atau gambar di tempat yang cocok.',
        items: [
          { id: 'dadu', label: 'Dadu Mio', emoji: '🎲' },
          { id: 'kotak-sepatu', label: 'Kotak sepatu', emoji: '👟' },
          { id: 'ubin', label: 'Gambar persegi pada denah', emoji: '🟨' },
          { id: 'kardus-buku', label: 'Kardus buku', emoji: '📚' },
        ],
        targets: [
          { id: 'kubus', label: 'Mirip kubus', emoji: '🧊', helper: 'Ketiga arahnya hampir sama panjang.' },
          { id: 'balok', label: 'Mirip balok', emoji: '📦', helper: 'Ada arah yang lebih panjang atau lebih pendek.' },
          { id: 'datar', label: 'Gambar datar', emoji: '📄', helper: 'Hanya panjang dan lebar.' },
        ],
        correctMatches: { dadu: 'kubus', 'kotak-sepatu': 'balok', ubin: 'datar', 'kardus-buku': 'balok' },
        explanation: 'Benda nyata tidak selalu seideal model matematika, sehingga kita menyebutnya mirip kubus atau mirip balok. Gambar persegi pada denah adalah bentuk datar, jadi bukan bangun ruang.',
        hints: ['Coba bayangkan apakah benda atau gambar itu mempunyai panjang, lebar, dan tinggi.', 'Dadu sama panjang ke tiga arah; kotak sepatu dan kardus buku cenderung memanjang.'],
      },
      {
        type: 'choice',
        id: 'p-3',
        prompt: 'Ciri balok yang berbeda dari kubus adalah …',
        options: ['semua rusuknya sama panjang', 'rusuk-rusuknya tidak semuanya sama panjang', 'tidak mempunyai bidang'],
        correctIndex: 1,
        explanation: 'Pada balok, rusuk-rusuknya tidak semuanya sama panjang. Pada kubus semua rusuk sama panjang.',
        hints: ['Bandingkan ukuran rusuk kubus dengan kotak sepatu.'],
        visual: 'cuboid',
      },
      {
        type: 'choice',
        id: 'p-4',
        prompt: 'Manakah pernyataan yang benar tentang bangun ruang?',
        options: [
          'Bangun ruang hanya mempunyai panjang dan lebar.',
          'Bangun ruang mempunyai panjang, lebar, dan tinggi.',
          'Semua bidang bangun ruang selalu berbentuk persegi.',
        ],
        correctIndex: 1,
        explanation: 'Bangun ruang mempunyai panjang, lebar, dan tinggi sehingga menempati ruang.',
        hints: ['Coba bayangkan memegang sebuah kotak.'],
        visual: 'mixed',
      },
    ],
  },
  {
    id: 'detektif-kumis',
    number: 2,
    title: 'Detektif Kumis',
    shortTitle: 'Ciri bangun',
    tpCode: 'TP-2',
    objective: 'Mengidentifikasi dan membandingkan bidang, rusuk, titik sudut, serta ciri kubus dan balok.',
    story: 'Ada label bangunan yang tertukar. Bantu Mio menelitinya dengan mata detektif!',
    color: 'teal',
    icon: '🔎',
    challenges: [
      {
        type: 'choice',
        id: 'k-1',
        prompt: 'Berapa banyak rusuk yang dimiliki satu kubus?',
        options: ['6 rusuk', '8 rusuk', '12 rusuk'],
        correctIndex: 2,
        explanation: 'Kubus memiliki 12 rusuk: empat di atas, empat di bawah, dan empat rusuk tegak.',
        hints: ['Hitung tepi kubus: empat di atas, empat di bawah, lalu empat yang tegak.'],
        visual: 'cube',
      },
      {
        type: 'match',
        id: 'k-2',
        prompt: 'Label Detektif: pasangkan setiap petunjuk dengan bagian kubus yang tepat.',
        items: [
          { id: 'permukaan', label: 'Permukaan datar seperti sisi kardus', emoji: '🟨' },
          { id: 'garis', label: 'Garis tempat dua bidang bertemu', emoji: '📏' },
          { id: 'ujung', label: 'Titik tempat beberapa rusuk bertemu', emoji: '📍' },
        ],
        targets: [
          { id: 'bidang', label: 'Bidang', emoji: '▰', helper: 'Permukaan datar.' },
          { id: 'rusuk', label: 'Rusuk', emoji: '╱', helper: 'Garis pertemuan dua bidang.' },
          { id: 'titik-sudut', label: 'Titik sudut', emoji: '•', helper: 'Ujung pertemuan rusuk.' },
        ],
        correctMatches: { permukaan: 'bidang', garis: 'rusuk', ujung: 'titik-sudut' },
        explanation: 'Bidang adalah permukaan, rusuk adalah garis pertemuan bidang, dan titik sudut adalah ujung tempat rusuk bertemu.',
        hints: ['Bayangkan sisi, tepi, dan ujung sebuah kardus.', 'Tentukan: petunjuk ini menjelaskan permukaan, garis, atau ujung?'],
      },
      {
        type: 'choice',
        id: 'k-3',
        prompt: 'Bidang pada kubus berbentuk …',
        options: ['Segitiga', 'Persegi', 'Lingkaran'],
        correctIndex: 1,
        explanation: 'Setiap bidang kubus berbentuk persegi.',
        hints: ['Lihat satu permukaan datar pada dadu.'],
        visual: 'cube',
      },
      {
        type: 'choice',
        id: 'k-4',
        prompt: 'Manakah perbedaan yang tepat antara kubus dan balok?',
        options: [
          'Kubus tidak mempunyai rusuk, sedangkan balok mempunyai rusuk.',
          'Balok hanya mempunyai satu bidang, sedangkan kubus mempunyai enam bidang.',
          'Kubus memiliki bidang persegi sama besar; balok dapat memiliki bidang persegi panjang dengan ukuran berbeda.',
        ],
        correctIndex: 2,
        explanation: 'Kubus dan balok sama-sama memiliki bidang, rusuk, dan titik sudut. Perbedaan yang mudah diamati ada pada bentuk dan ukuran bidangnya.',
        hints: ['Bandingkan satu bidang pada kubus dengan satu bidang pada balok.', 'Kubus tampak sama panjang ke segala arah; balok dapat memanjang pada satu arah.'],
        visual: 'mixed',
      },
    ],
  },
  {
    id: 'bengkel-blok',
    number: 3,
    title: 'Bengkel Blok',
    shortTitle: 'Susun blok',
    tpCode: 'TP-3 & TP-4',
    objective: 'Mengonstruksi dan mengurai kubus, balok, serta bangun gabungannya dengan blok satuan digital.',
    story: 'Bahan bangunan sudah tiba! Susun blok agar rumah kucing tidak roboh.',
    color: 'purple',
    icon: '🧱',
    challenges: [
      {
        type: 'build',
        id: 'b-1',
        prompt: 'Susun balok kecil: 3 kolom × 2 lantai × 1 baris. Samakan dengan cetak biru Mio.',
        target: balok321,
        grid: { width: 3, height: 2, depth: 1 },
        matchMode: 'exact',
        explanation: 'Kamu membangun balok: ukurannya tidak sama pada semua arah.',
        hints: [
          'Mulai dari lantai 1: isi tiga kolom pada satu baris.',
          'Tambahkan satu lantai lagi tepat di atasnya.',
        ],
      },
      {
        type: 'build',
        id: 'b-2',
        prompt: 'Mini game Perbaiki Susunan: satu blok sudah berada di titik yang keliru. Pindahkan hingga semua posisi sama seperti cetak biru Mio.',
        target: lStructure,
        grid: { width: 2, height: 2, depth: 2 },
        startingShape: lStructureWithMisplacedBlock,
        matchMode: 'exact',
        explanation: 'Bangun gabungan dapat diurai menjadi blok satuan. Satu blok yang berpindah dapat membuat susunan tidak lagi sama dengan cetak biru.',
        hints: [
          'Bandingkan blok yang sudah terpasang dengan tanda target: ada satu yang perlu dihapus dan satu yang perlu diisi.',
          'Dua blok berada di lantai depan; satu blok di atas kiri, dan satu lagi di belakang kiri.',
        ],
      },
      {
        type: 'build',
        id: 'b-3',
        prompt: 'Susun tangga untuk Mio: tiga blok di bawah, dua di tengah, dan satu paling atas.',
        target: staircase,
        grid: { width: 3, height: 3, depth: 1 },
        matchMode: 'exact',
        explanation: 'Tangga tersusun dari tiga lapisan; setiap lapisan lebih pendek satu blok.',
        hints: ['Bangun dari lantai terbawah terlebih dahulu.', 'Kurangi satu blok setiap naik lantai.'],
      },
      {
        type: 'sequence',
        id: 'b-4',
        prompt: 'Ikuti strategi Mio: urutkan bagian tangga dari paling bawah sampai paling atas.',
        items: [
          { id: 'alas', label: 'Buat tiga blok pada lantai paling bawah', emoji: '🧱' },
          { id: 'tengah', label: 'Tambahkan dua blok pada lantai tengah', emoji: '🧱' },
          { id: 'puncak', label: 'Letakkan satu blok sebagai puncak', emoji: '⭐' },
        ],
        initialOrder: ['puncak', 'alas', 'tengah'],
        correctOrder: ['alas', 'tengah', 'puncak'],
        explanation: 'Tangga dibangun dari alas ke atas: tiga blok di bawah, dua di tengah, lalu satu sebagai puncak.',
        hints: ['Bagian paling bawah harus dibuat sebelum bagian yang berada di atasnya.', 'Urutkan dari lantai bawah, lantai tengah, lalu puncak.'],
      },
    ],
  },
  {
    id: 'menara-tiga-arah',
    number: 4,
    title: 'Menara Tiga Arah',
    shortTitle: 'Tiga arah',
    tpCode: 'TP-5',
    objective: 'Menentukan tampak depan, atas, dan samping dari bangun ruang/gabungannya.',
    story: 'Mio menerima denah tanpa gambar 3D. Bantu ia membaca menara dari tiga arah.',
    color: 'blue',
    icon: '👁️',
    challenges: [
      {
        type: 'projection',
        id: 't-1',
        prompt: 'Putar model jika perlu. Manakah tampak depan dari struktur ini?',
        object: lStructure,
        view: 'front',
        options: projectionOptions(lStructure, 'front', [balok321, staircase], 2),
        correctIndex: 2,
        explanation: 'Tampak depan memperlihatkan lebar dan tinggi struktur, bukan kedalamannya.',
        hints: ['Bayangkan kamu berdiri tepat di depan struktur.', 'Abaikan blok yang hanya berbeda posisi depan-belakang.'],
      },
      {
        type: 'projection-draw',
        id: 't-2',
        prompt: 'Cetak Biru: nyalakan semua petak yang ditempati struktur saat dilihat dari atas.',
        object: lFootprintTower,
        view: 'top',
        expected: deriveOrthographicProjection(lFootprintTower, 'top'),
        explanation: 'Tampak atas menunjukkan jejak blok di lantai, bukan tingginya. Tiga blok yang bertumpuk di satu titik tetap terlihat sebagai satu petak dari atas.',
        hints: ['Lihat seperti burung yang terbang tepat di atas struktur.', 'Cari setiap tempat di lantai yang ditempati setidaknya satu blok.'],
      },
      {
        type: 'projection',
        id: 't-3',
        prompt: 'Pilih tampak samping kanan dari struktur Kota Meow ini.',
        object: bridge,
        view: 'right',
        options: projectionOptions(bridge, 'right', [balok232, cube2], 1),
        correctIndex: 1,
        explanation: 'Tampak samping kanan memperlihatkan kedalaman dan tinggi struktur.',
        hints: ['Berdirilah di sisi kanan model.', 'Lihat tinggi blok pada bagian depan-belakang.'],
      },
    ],
  },
  {
    id: 'kota-meow',
    number: 5,
    title: 'Arsitek Kota Meow',
    shortTitle: 'Proyek kota',
    tpCode: 'TP-6',
    objective: 'Membandingkan struktur dan menentukan lokasi pada peta berpetak melalui proyek akhir.',
    story: 'Kota Meow hampir selesai. Tentukan lokasi bangunan agar semua kucing mudah menemukannya.',
    color: 'green',
    icon: '🏙️',
    challenges: [
      {
        type: 'choice',
        id: 'm-1',
        prompt: 'Bangunan mana yang paling tepat disebut bangun gabungan?',
        options: [
          'Satu kubus saja.',
          'Satu balok saja.',
          'Dua atau lebih bangun ruang yang disusun menjadi satu struktur.',
        ],
        correctIndex: 2,
        explanation: 'Bangun gabungan tersusun dari dua atau lebih bangun ruang yang menjadi satu struktur.',
        hints: ['Cari pilihan yang terdiri dari lebih dari satu bagian 3D.'],
        visual: 'mixed',
      },
      {
        type: 'map',
        id: 'm-2',
        prompt: 'Letakkan Taman Kucing pada kolom 3, baris 2.',
        columns: 5,
        rows: 4,
        target: { column: 2, row: 1 },
        targetLabel: 'Taman Kucing',
        explanation: 'Kolom dihitung dari kiri ke kanan; baris dihitung dari bawah ke atas.',
        hints: ['Cari kolom ketiga terlebih dahulu, lalu naik ke baris kedua.'],
      },
      {
        type: 'build',
        id: 'm-3',
        prompt: 'Bangun Gerbang Kota Meow sama seperti cetak biru Mio.',
        target: gateStructure,
        grid: { width: 3, height: 3, depth: 1 },
        matchMode: 'exact',
        explanation: 'Kamu sudah memakai penalaran spasial untuk membangun bangun gabungan berbentuk gerbang.',
        hints: ['Buat alas tiga blok di lantai 1.', 'Bangun dua tiang di kolom kiri dan kanan, lalu tutup dengan palang tiga blok di lantai 3.'],
      },
    ],
  },
]

export const missionById = Object.fromEntries(
  missions.map((mission) => [mission.id, mission]),
) as Record<MissionId, MissionDefinition>

export const learningStatuses = ['Mandiri', 'Berkembang', 'Perlu dukungan'] as const
export type LearningStatus = (typeof learningStatuses)[number]
