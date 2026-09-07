/**
 * Data materi yang dipakai oleh menu Materi, Kurikulum, dan Jaring-jaring.
 *
 * Catatan kurikulum: CP adalah acuan resmi pada akhir Fase C. TP, ATP, urutan
 * misi, dan status penguasaan adalah rancangan MeowMath yang perlu diselaraskan
 * lagi oleh sekolah melalui KOSP-nya.
 */

export type SolidId =
  | 'kubus'
  | 'balok'
  | 'prisma-segitiga'
  | 'prisma-segiempat'
  | 'limas-segiempat'
  | 'limas-segitiga'
  | 'tabung'
  | 'kerucut'
  | 'bola'

export type NetAvailability = 'tersedia' | 'tidak-dapat-dibentangkan'

export interface SolidProperty {
  readonly label: string
  readonly value: string
  readonly explanation?: string
}

export interface EverydayExample {
  readonly name: string
  readonly description: string
}

export interface NetPiece {
  readonly amount: number
  readonly shape: string
}

export interface NetDescription {
  readonly id: string
  readonly title: string
  readonly availability: NetAvailability
  readonly description: string
  readonly pieces: readonly NetPiece[]
  readonly possibilities: string
  readonly explorationPrompt: string
  readonly caution?: string
}

export interface EnrichmentFormula {
  readonly name: string
  readonly expression: string
  readonly variables: string
  readonly purpose: string
  readonly scopeLabel: 'Pengayaan di luar fokus penilaian MeowMath v1'
}

export interface SolidResource {
  readonly id: SolidId
  readonly name: string
  readonly icon: string
  readonly classification: 'Bangun ruang sisi datar' | 'Bangun ruang sisi lengkung'
  readonly definition: string
  readonly whyLearnThis: string
  readonly relatedTpCodes: readonly string[]
  readonly properties: readonly SolidProperty[]
  readonly everydayExamples: readonly EverydayExample[]
  readonly possibleNets: readonly NetDescription[]
  readonly formulas: readonly EnrichmentFormula[]
}

const formulaScope = 'Pengayaan di luar fokus penilaian MeowMath v1' as const

/**
 * Pustaka bangun ruang. Benda sehari-hari disengaja menggunakan kata "mirip"
 * supaya murid tidak menyamakan benda fisik yang tidak sempurna dengan model
 * matematika ideal.
 */
export const solidResources: readonly SolidResource[] = [
  {
    id: 'kubus',
    name: 'Kubus',
    icon: '🧊',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang yang memiliki enam bidang berbentuk persegi dengan semua rusuk sama panjang.',
    whyLearnThis: 'Kubus adalah model awal yang mudah diputar, disusun dari unit, dan dibandingkan dengan balok.',
    relatedTpCodes: ['TP-1', 'TP-2', 'TP-3', 'TP-4', 'TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '6 bidang datar berbentuk persegi yang sama besar.' },
      { label: 'Rusuk', value: '12 rusuk, semuanya sama panjang.' },
      { label: 'Titik sudut', value: '8 titik sudut.' },
      { label: 'Permukaan lengkung', value: 'Tidak ada; semua bidangnya datar.' },
    ],
    everydayExamples: [
      { name: 'Dadu', description: 'Dadu dengan sisi lurus dan ukuran sama mirip kubus.' },
      { name: 'Es batu', description: 'Es batu yang dicetak sama panjang ke tiga arah mirip kubus.' },
      { name: 'Kotak kado kecil', description: 'Kotak kado yang panjang, lebar, dan tingginya sama mirip kubus.' },
    ],
    possibleNets: [
      {
        id: 'kubus-11-jaring',
        title: 'Sebelas bentuk jaring-jaring kubus',
        availability: 'tersedia',
        description: 'Jaring-jaring kubus tersusun dari enam persegi sama besar yang tersambung pada sisi-sisinya dan dapat dilipat menjadi satu kubus tanpa saling menutupi.',
        pieces: [{ amount: 6, shape: 'persegi sama besar' }],
        possibilities: 'Ada 11 susunan jaring-jaring kubus yang berbeda. Susunan harus memiliki jalur lipatan yang membuat setiap persegi menjadi satu bidang kubus.',
        explorationPrompt: 'Pilih enam persegi yang tersambung. Sebelum melipat, prediksi persegi mana yang akan menjadi bidang atas.',
        caution: 'Enam persegi yang sekadar tersambung belum tentu dapat dilipat menjadi kubus.',
      },
    ],
    formulas: [
      {
        name: 'Volume kubus',
        expression: 'V = s × s × s = s³',
        variables: 's = panjang rusuk',
        purpose: 'Menghitung ruang yang ditempati kubus.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan kubus',
        expression: 'L = 6 × s²',
        variables: 's = panjang rusuk',
        purpose: 'Menghitung luas seluruh bidang kubus.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'balok',
    name: 'Balok',
    icon: '📦',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang yang memiliki enam bidang berbentuk persegi panjang; bidang yang berhadapan sama bentuk dan ukurannya.',
    whyLearnThis: 'Balok membantu murid membedakan ukuran yang dapat sama atau berbeda, lalu membangun struktur dengan arah panjang, lebar, dan tinggi.',
    relatedTpCodes: ['TP-1', 'TP-2', 'TP-3', 'TP-4', 'TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '6 bidang datar; terdiri dari tiga pasang persegi panjang yang berhadapan.' },
      { label: 'Rusuk', value: '12 rusuk; rusuk yang sejajar memiliki panjang yang sama.' },
      { label: 'Titik sudut', value: '8 titik sudut.' },
      { label: 'Permukaan lengkung', value: 'Tidak ada; semua bidangnya datar.' },
    ],
    everydayExamples: [
      { name: 'Kotak sepatu', description: 'Kotak sepatu yang berbentuk memanjang mirip balok.' },
      { name: 'Buku tebal', description: 'Buku dengan sampul datar dan ukuran panjang, lebar, tinggi yang berbeda mirip balok.' },
      { name: 'Kotak susu', description: 'Kotak susu berbentuk kotak dengan enam bidang datar mirip balok.' },
    ],
    possibleNets: [
      {
        id: 'balok-enam-persegi-panjang',
        title: 'Jaring-jaring balok',
        availability: 'tersedia',
        description: 'Jaring-jaring balok tersusun dari enam persegi panjang: tiga pasang yang sama ukuran untuk bidang-bidang berhadapan.',
        pieces: [
          { amount: 2, shape: 'persegi panjang berukuran panjang × lebar' },
          { amount: 2, shape: 'persegi panjang berukuran panjang × tinggi' },
          { amount: 2, shape: 'persegi panjang berukuran lebar × tinggi' },
        ],
        possibilities: 'Susunannya dapat berbeda-beda selama enam bidang dapat dilipat tanpa bertumpuk dan setiap pasangan bidang berhadapan tetap cocok ukurannya.',
        explorationPrompt: 'Cocokkan dahulu pasangan bidang yang sama. Lalu pilih satu bidang sebagai alas dan bayangkan empat bidang sampingnya berdiri.',
      },
    ],
    formulas: [
      {
        name: 'Volume balok',
        expression: 'V = p × l × t',
        variables: 'p = panjang, l = lebar, t = tinggi',
        purpose: 'Menghitung ruang yang ditempati balok.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan balok',
        expression: 'L = 2 × (p × l + p × t + l × t)',
        variables: 'p = panjang, l = lebar, t = tinggi',
        purpose: 'Menghitung luas keenam bidang balok.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'prisma-segitiga',
    name: 'Prisma Segitiga',
    icon: '🔺',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang dengan dua bidang alas dan tutup berbentuk segitiga yang sejajar dan sama bentuk, serta tiga bidang tegak berbentuk persegi panjang.',
    whyLearnThis: 'Murid dapat membandingkan bangun yang memiliki alas segitiga dengan kubus dan balok yang seluruh bidangnya segiempat.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '5 bidang datar: 2 segitiga dan 3 persegi panjang.' },
      { label: 'Rusuk', value: '9 rusuk.' },
      { label: 'Titik sudut', value: '6 titik sudut.' },
      { label: 'Permukaan lengkung', value: 'Tidak ada.' },
    ],
    everydayExamples: [
      { name: 'Atap tenda sederhana', description: 'Tenda dengan dua ujung segitiga yang sejajar dan sisi tegak datar mirip prisma segitiga.' },
      { name: 'Kemasan cokelat batang tertentu', description: 'Kemasan yang penampang ujungnya segitiga dan memanjang lurus mirip prisma segitiga.' },
    ],
    possibleNets: [
      {
        id: 'prisma-segitiga-dua-tiga',
        title: 'Dua segitiga dan tiga persegi panjang',
        availability: 'tersedia',
        description: 'Jaring-jaring prisma segitiga memuat dua segitiga kongruen sebagai alas dan tutup, serta tiga persegi panjang sebagai bidang tegaknya.',
        pieces: [
          { amount: 2, shape: 'segitiga yang sama bentuk dan ukuran' },
          { amount: 3, shape: 'persegi panjang' },
        ],
        possibilities: 'Tiga persegi panjang dapat disusun seperti pita, lalu satu segitiga ditempel pada masing-masing ujung pita. Variasi letak segitiga juga dapat dibuat.',
        explorationPrompt: 'Cari tiga sisi segitiga. Setiap sisi harus berpasangan dengan salah satu persegi panjang pada jaring-jaring.',
      },
    ],
    formulas: [
      {
        name: 'Volume prisma segitiga',
        expression: 'V = luas alas × tinggi prisma',
        variables: 'luas alas = luas segitiga; tinggi prisma = jarak kedua segitiga sejajar',
        purpose: 'Menghitung ruang yang ditempati prisma.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan prisma segitiga',
        expression: 'L = 2 × luas alas + keliling alas × tinggi prisma',
        variables: 'alas berbentuk segitiga',
        purpose: 'Menghitung luas dua segitiga dan tiga bidang tegak.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'prisma-segiempat',
    name: 'Prisma Segiempat',
    icon: '🔷',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang dengan dua alas berbentuk segiempat yang sejajar dan sama bentuk, dihubungkan oleh empat bidang tegak. Balok merupakan salah satu contoh khusus prisma segiempat dengan alas persegi panjang.',
    whyLearnThis: 'Prisma segiempat membantu murid melihat hubungan keluarga bangun: balok bukan bentuk yang berdiri sendiri, melainkan salah satu jenis prisma.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '6 bidang datar: 2 segiempat yang kongruen sebagai alas dan tutup, serta 4 bidang tegak.' },
      { label: 'Rusuk', value: '12 rusuk.' },
      { label: 'Titik sudut', value: '8 titik sudut.' },
      { label: 'Ciri penting', value: 'Dua alas selalu sejajar dan sama bentuk; jarak antarlas disebut tinggi prisma.' },
    ],
    everydayExamples: [
      { name: 'Balok', description: 'Balok dapat dipandang sebagai prisma segiempat yang alasnya berbentuk persegi panjang.' },
      { name: 'Model kemasan beralas jajar genjang', description: 'Kemasan dengan dua ujung segiempat miring yang sama dan sejajar dapat mirip prisma segiempat.' },
    ],
    possibleNets: [
      {
        id: 'prisma-segiempat-dua-empat',
        title: 'Dua segiempat dan empat bidang tegak',
        availability: 'tersedia',
        description: 'Jaring-jaring prisma segiempat memiliki dua segiempat yang sama bentuk serta empat bidang tegak yang menghubungkannya.',
        pieces: [
          { amount: 2, shape: 'segiempat yang sama bentuk dan ukuran' },
          { amount: 4, shape: 'bidang tegak berbentuk persegi panjang atau jajargenjang' },
        ],
        possibilities: 'Empat bidang tegak dapat disusun seperti pita. Kedua segiempat ditempel pada ujung atau sisi pita yang ukurannya sesuai.',
        explorationPrompt: 'Bandingkan dengan balok. Bagian mana yang tetap sama, dan bagian mana yang dapat berubah bentuk?',
      },
    ],
    formulas: [
      {
        name: 'Volume prisma segiempat',
        expression: 'V = luas alas × tinggi prisma',
        variables: 'tinggi prisma = jarak tegak lurus antara dua alas sejajar',
        purpose: 'Menghitung ruang yang ditempati prisma.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan prisma segiempat',
        expression: 'L = 2 × luas alas + keliling alas × tinggi prisma',
        variables: 'alas berbentuk segiempat',
        purpose: 'Menghitung luas dua alas dan empat bidang tegak.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'limas-segiempat',
    name: 'Limas Segiempat',
    icon: '🔻',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang dengan satu alas berbentuk segiempat dan empat bidang tegak berbentuk segitiga yang bertemu pada satu titik puncak.',
    whyLearnThis: 'Limas membantu murid melihat perbedaan antara bangun yang memiliki dua alas sejajar dan bangun yang semua sisi tegaknya bertemu pada puncak.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '5 bidang datar: 1 alas segiempat dan 4 bidang tegak segitiga.' },
      { label: 'Rusuk', value: '8 rusuk: 4 rusuk alas dan 4 rusuk tegak menuju puncak.' },
      { label: 'Titik sudut', value: '5 titik sudut: 4 pada alas dan 1 puncak.' },
      { label: 'Permukaan lengkung', value: 'Tidak ada.' },
    ],
    everydayExamples: [
      { name: 'Atap gazebo berbentuk piramida', description: 'Atap dengan alas segiempat dan empat bidang datar yang bertemu di puncak mirip limas segiempat.' },
      { name: 'Hiasan piramida', description: 'Benda hias dengan satu puncak dan alas persegi mirip limas segiempat.' },
    ],
    possibleNets: [
      {
        id: 'limas-segiempat-satu-empat',
        title: 'Satu segiempat dan empat segitiga',
        availability: 'tersedia',
        description: 'Jaring-jaring limas segiempat memiliki satu segiempat sebagai alas dan empat segitiga sebagai bidang tegak.',
        pieces: [
          { amount: 1, shape: 'segiempat sebagai alas' },
          { amount: 4, shape: 'segitiga sebagai bidang tegak' },
        ],
        possibilities: 'Bentuk paling mudah dikenali menempelkan satu segitiga pada setiap sisi alas. Ada variasi lain apabila beberapa segitiga saling tersambung sebelum dilipat.',
        explorationPrompt: 'Temukan titik yang akan menjadi puncak: ujung jauh dari keempat segitiga akan bertemu di sana.',
      },
    ],
    formulas: [
      {
        name: 'Volume limas',
        expression: 'V = ⅓ × luas alas × tinggi limas',
        variables: 'tinggi limas = jarak tegak lurus dari puncak ke alas',
        purpose: 'Menghitung ruang yang ditempati limas.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan limas',
        expression: 'L = luas alas + jumlah luas keempat segitiga',
        variables: 'setiap bidang tegak berbentuk segitiga',
        purpose: 'Menghitung luas seluruh bidang limas.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'limas-segitiga',
    name: 'Limas Segitiga',
    icon: '🔺',
    classification: 'Bangun ruang sisi datar',
    definition: 'Bangun ruang dengan satu alas berbentuk segitiga dan tiga bidang tegak berbentuk segitiga yang bertemu pada satu titik puncak. Bentuk khusus dengan empat segitiga sama besar disebut tetrahedron.',
    whyLearnThis: 'Limas segitiga memperlihatkan bangun ruang yang seluruh bidangnya segitiga dan membantu membedakan limas dari prisma.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang/sisi', value: '4 bidang datar berbentuk segitiga.' },
      { label: 'Rusuk', value: '6 rusuk.' },
      { label: 'Titik sudut', value: '4 titik sudut.' },
      { label: 'Ciri penting', value: 'Semua bidang tegak bertemu pada satu puncak; limas hanya memiliki satu alas.' },
    ],
    everydayExamples: [
      { name: 'Dadu empat sisi', description: 'Dadu berbentuk tetrahedron dengan empat bidang segitiga mirip limas segitiga.' },
      { name: 'Hiasan tetrahedron', description: 'Hiasan dari empat karton segitiga yang bertemu di puncak mirip limas segitiga.' },
    ],
    possibleNets: [
      {
        id: 'limas-segitiga-empat-segitiga',
        title: 'Empat segitiga yang saling tersambung',
        availability: 'tersedia',
        description: 'Jaring-jaring limas segitiga terdiri dari satu segitiga alas dan tiga segitiga bidang tegak.',
        pieces: [{ amount: 4, shape: 'segitiga yang sisi-sisinya saling cocok' }],
        possibilities: 'Cara paling mudah adalah menempelkan satu segitiga pada setiap sisi segitiga alas. Tiga ujung luarnya akan bertemu pada puncak.',
        explorationPrompt: 'Bayangkan tiga segitiga di sekeliling alas berdiri. Ujung mana yang akan bertemu di puncak?',
      },
    ],
    formulas: [
      {
        name: 'Volume limas segitiga',
        expression: 'V = ⅓ × luas alas × tinggi limas',
        variables: 'alas berbentuk segitiga; tinggi limas tegak lurus terhadap alas',
        purpose: 'Menghitung ruang yang ditempati limas.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan limas segitiga',
        expression: 'L = jumlah luas keempat segitiga',
        variables: 'alas dan tiga bidang tegak berbentuk segitiga',
        purpose: 'Menghitung luas seluruh bidang limas.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'tabung',
    name: 'Tabung',
    icon: '🥫',
    classification: 'Bangun ruang sisi lengkung',
    definition: 'Bangun ruang dengan dua alas berbentuk lingkaran yang sejajar dan sama besar, dihubungkan oleh satu selimut lengkung.',
    whyLearnThis: 'Tabung memperluas perbandingan dari sisi datar ke sisi lengkung dan menunjukkan bahwa jaring-jaring tidak selalu tersusun dari poligon saja.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang datar', value: '2 bidang datar berbentuk lingkaran: alas dan tutup.' },
      { label: 'Sisi lengkung', value: '1 selimut lengkung.' },
      { label: 'Rusuk', value: '2 rusuk lengkung, yaitu pertemuan selimut dengan kedua lingkaran.' },
      { label: 'Titik sudut', value: 'Tidak memiliki titik sudut.' },
    ],
    everydayExamples: [
      { name: 'Kaleng', description: 'Kaleng yang alas dan tutupnya bulat serta sisi tegaknya melengkung mirip tabung.' },
      { name: 'Gulungan tisu', description: 'Gulungan tisu tanpa memperhatikan lubangnya dapat digunakan sebagai contoh yang mirip tabung.' },
    ],
    possibleNets: [
      {
        id: 'tabung-dua-lingkaran-satu-persegi-panjang',
        title: 'Dua lingkaran dan satu persegi panjang',
        availability: 'tersedia',
        description: 'Saat selimut tabung dibuka, bentuknya menjadi persegi panjang. Dua lingkaran menjadi alas dan tutup.',
        pieces: [
          { amount: 2, shape: 'lingkaran sama besar' },
          { amount: 1, shape: 'persegi panjang sebagai selimut' },
        ],
        possibilities: 'Dua lingkaran dapat ditempel pada dua sisi panjang persegi panjang. Panjang sisi tersebut harus sama dengan keliling lingkaran.',
        explorationPrompt: 'Bayangkan label pada kaleng dilepas dan diratakan. Bentuk apakah label itu?',
      },
    ],
    formulas: [
      {
        name: 'Volume tabung',
        expression: 'V = π × r² × t',
        variables: 'r = jari-jari alas, t = tinggi tabung',
        purpose: 'Menghitung ruang yang ditempati tabung.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan tabung',
        expression: 'L = 2 × π × r × (r + t)',
        variables: 'r = jari-jari alas, t = tinggi tabung',
        purpose: 'Menghitung luas dua lingkaran dan selimut tabung.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'kerucut',
    name: 'Kerucut',
    icon: '🍦',
    classification: 'Bangun ruang sisi lengkung',
    definition: 'Bangun ruang dengan satu alas berbentuk lingkaran dan satu selimut lengkung yang mengerucut pada satu titik puncak.',
    whyLearnThis: 'Kerucut memberi contoh bahwa satu titik puncak dapat muncul pada bangun bersisi lengkung, berbeda dari limas yang bidang tegaknya datar.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang datar', value: '1 bidang datar berbentuk lingkaran sebagai alas.' },
      { label: 'Sisi lengkung', value: '1 selimut lengkung.' },
      { label: 'Rusuk', value: '1 rusuk lengkung pada pertemuan alas dan selimut.' },
      { label: 'Titik sudut', value: '1 titik puncak.' },
    ],
    everydayExamples: [
      { name: 'Cone es krim', description: 'Cone es krim tanpa isinya mirip kerucut.' },
      { name: 'Topi pesta', description: 'Topi pesta yang beralas bulat dan meruncing di atas mirip kerucut.' },
    ],
    possibleNets: [
      {
        id: 'kerucut-lingkaran-juring',
        title: 'Satu lingkaran dan satu juring lingkaran',
        availability: 'tersedia',
        description: 'Jaring-jaring kerucut terdiri dari satu lingkaran sebagai alas dan satu juring lingkaran sebagai selimut.',
        pieces: [
          { amount: 1, shape: 'lingkaran sebagai alas' },
          { amount: 1, shape: 'juring lingkaran sebagai selimut' },
        ],
        possibilities: 'Panjang busur juring harus sama dengan keliling lingkaran alas agar keduanya tepat bertemu saat dilipat.',
        explorationPrompt: 'Jika kertas berbentuk juring digulung hingga ujungnya bertemu, di mana letak puncak kerucut?',
      },
    ],
    formulas: [
      {
        name: 'Volume kerucut',
        expression: 'V = ⅓ × π × r² × t',
        variables: 'r = jari-jari alas, t = tinggi kerucut',
        purpose: 'Menghitung ruang yang ditempati kerucut.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan kerucut',
        expression: 'L = π × r × (r + s)',
        variables: 'r = jari-jari alas, s = garis pelukis',
        purpose: 'Menghitung luas alas dan selimut kerucut.',
        scopeLabel: formulaScope,
      },
    ],
  },
  {
    id: 'bola',
    name: 'Bola',
    icon: '⚽',
    classification: 'Bangun ruang sisi lengkung',
    definition: 'Bangun ruang yang seluruh permukaannya melengkung; semua titik pada permukaan berjarak sama dari titik pusat.',
    whyLearnThis: 'Bola menjadi pembanding penting karena tidak memiliki bidang datar, rusuk, atau titik sudut.',
    relatedTpCodes: ['Pengayaan setelah TP-2', 'Pengayaan setelah TP-5'],
    properties: [
      { label: 'Bidang datar', value: 'Tidak ada.' },
      { label: 'Sisi lengkung', value: '1 permukaan lengkung utuh.' },
      { label: 'Rusuk', value: 'Tidak ada.' },
      { label: 'Titik sudut', value: 'Tidak ada.' },
      { label: 'Pusat dan jari-jari', value: 'Memiliki satu titik pusat; jari-jari adalah jarak dari pusat ke permukaan.' },
    ],
    everydayExamples: [
      { name: 'Bola sepak', description: 'Bola sepak yang bulat merata mirip bola dalam matematika.' },
      { name: 'Kelereng', description: 'Kelereng yang benar-benar bulat mirip bola.' },
    ],
    possibleNets: [
      {
        id: 'bola-tanpa-jaring-datar',
        title: 'Tidak memiliki jaring-jaring datar tepat',
        availability: 'tidak-dapat-dibentangkan',
        description: 'Permukaan bola tidak dapat diratakan menjadi satu jaring-jaring datar yang tepat tanpa meregangkan, mengerutkan, atau menyobek permukaannya.',
        pieces: [],
        possibilities: 'Globe atau kulit bola dapat dibuat dari banyak potongan melengkung, tetapi itu adalah pendekatan fisik, bukan jaring-jaring datar tepat seperti pada kubus.',
        explorationPrompt: 'Bandingkan kulit jeruk yang dibuka dengan jaring-jaring kubus. Bagian mana yang tidak dapat menjadi datar sempurna?',
      },
    ],
    formulas: [
      {
        name: 'Volume bola',
        expression: 'V = ⁴⁄₃ × π × r³',
        variables: 'r = jari-jari bola',
        purpose: 'Menghitung ruang yang ditempati bola.',
        scopeLabel: formulaScope,
      },
      {
        name: 'Luas permukaan bola',
        expression: 'L = 4 × π × r²',
        variables: 'r = jari-jari bola',
        purpose: 'Menghitung luas permukaan lengkung bola.',
        scopeLabel: formulaScope,
      },
    ],
  },
] as const

export const solidResourceById: Readonly<Record<SolidId, SolidResource>> = Object.fromEntries(
  solidResources.map((resource) => [resource.id, resource]),
) as Readonly<Record<SolidId, SolidResource>>

export interface SourceLink {
  readonly label: string
  readonly href: string
  readonly note: string
}

export interface OfficialCpFocus {
  readonly code: string
  readonly summary: string
  readonly meowMathTranslation: string
}

export interface LearningObjectiveResource {
  readonly code: string
  readonly objective: string
  readonly materialScope: string
  readonly learningEvidence: string
  readonly missionName: string
}

export interface AtpStepResource {
  readonly order: number
  readonly tpCode: string
  readonly focus: string
  readonly coreExperience: string
  readonly formativeEvidence: string
  readonly suggestedPlacement: string
}

export interface CurriculumMenuData {
  readonly title: string
  readonly phaseLabel: string
  readonly curriculumNotice: string
  readonly officialCp: {
    readonly statusLabel: 'Acuan resmi'
    readonly title: string
    readonly subject: string
    readonly phase: string
    readonly element: string
    readonly summaryNotice: string
    readonly focuses: readonly OfficialCpFocus[]
    readonly sources: readonly SourceLink[]
  }
  readonly meowMathProposal: {
    readonly statusLabel: 'Usulan MeowMath'
    readonly title: string
    readonly purpose: string
    readonly boundaries: readonly string[]
    readonly learningObjectives: readonly LearningObjectiveResource[]
    readonly atpFlow: string
    readonly atpSteps: readonly AtpStepResource[]
    readonly unitNote: string
    readonly source: SourceLink
  }
  readonly schoolDecision: {
    readonly statusLabel: 'Keputusan satuan pendidikan'
    readonly note: string
  }
}

/**
 * Data untuk menu "CP, TP, dan ATP". Teks CP di sini adalah ringkasan
 * operasional, bukan salinan atau pengganti naskah regulasi resmi.
 */
export const curriculumMenuData: CurriculumMenuData = {
  title: 'Peta Belajar MeowMath',
  phaseLabel: 'Matematika SD/MI · Fase C · Elemen Geometri',
  curriculumNotice:
    'CP resmi menyatakan capaian akhir Fase C. TP, ATP, nama misi, dan ambang penguasaan di bawah merupakan rancangan MeowMath yang dapat disesuaikan guru.',
  officialCp: {
    statusLabel: 'Acuan resmi',
    title: 'Capaian Pembelajaran Matematika Fase C — Elemen Geometri',
    subject: 'Matematika SD/MI/Program Paket A',
    phase: 'Fase C (umumnya kelas V–VI)',
    element: 'Geometri',
    summaryNotice:
      'Ringkasan operasional untuk perencanaan aplikasi; guru perlu memeriksa naskah CP dan ketentuan yang berlaku di satuan pendidikan.',
    focuses: [
      {
        code: 'CP-GEO-1',
        summary: 'Mengonstruksi dan mengurai kubus, balok, serta gabungannya.',
        meowMathTranslation: 'Murid menyusun dan membongkar struktur dari balok satuan digital, lalu menjelaskan susunannya.',
      },
      {
        code: 'CP-GEO-2',
        summary: 'Mengenali visualisasi spasial dari tampak depan, atas, dan samping.',
        meowMathTranslation: 'Murid memutar model, memprediksi tampak, lalu memeriksa representasi ortografis sederhana.',
      },
      {
        code: 'CP-GEO-3',
        summary: 'Membandingkan karakteristik antarbangun datar dan antarbangun ruang.',
        meowMathTranslation: 'Murid membandingkan bidang/sisi, rusuk, titik sudut, dan bentuk sisi kubus serta balok.',
      },
      {
        code: 'CP-GEO-4',
        summary: 'Menentukan lokasi pada peta dengan sistem berpetak.',
        meowMathTranslation: 'Murid menempatkan bangunan Kota Meow pada petak yang tepat dan menjelaskan lokasinya.',
      },
    ],
    sources: [
      {
        label: 'Kepka BSKAP 046/H/KR/2025 dan panduan Matematika',
        href: 'https://repositori.kemendikdasmen.go.id/33608/',
        note: 'Acuan CP Matematika Fase C dan panduan mata pelajaran, 2025.',
      },
      {
        label: 'Penegasan perubahan CP 2026',
        href: 'https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti',
        note: 'Penegasan bahwa perubahan 2026 berlaku untuk Agama dan Budi Pekerti.',
      },
    ],
  },
  meowMathProposal: {
    statusLabel: 'Usulan MeowMath',
    title: 'TP dan ATP Geometri Fase C — Unit Kelas V',
    purpose:
      'Enam TP ini adalah rancangan pembelajaran MeowMath untuk fondasi kelas V menuju capaian akhir Fase C; ini bukan TP atau ATP yang ditetapkan pemerintah.',
    boundaries: [
      'Fokus utama v1: kubus, balok, gabungannya, tampak tiga arah, dan peta berpetak.',
      'Benda sehari-hari disebut mirip kubus atau balok, bukan dianggap model matematika ideal.',
      'Rumus volume dan luas permukaan disediakan sebagai referensi pengayaan, bukan target skor MeowMath v1.',
      'Jaring-jaring dan bangun ruang selain kubus serta balok adalah pembekalan/pengayaan dan tidak mengubah target inti TP-1 sampai TP-6.',
    ],
    learningObjectives: [
      {
        code: 'TP-1',
        objective: 'Murid dapat membedakan representasi dua dimensi dan tiga dimensi serta mengenali kubus dan balok melalui benda, gambar, atau model.',
        materialScope: '2D dan 3D; kubus; balok; konteks benda sekitar.',
        learningEvidence: 'Memilah representasi dan menyebut alasan bahwa benda nyata hanya mirip kubus/balok.',
        missionName: 'Pencari Kotak',
      },
      {
        code: 'TP-2',
        objective: 'Murid dapat mengidentifikasi dan membandingkan karakteristik kubus dan balok.',
        materialScope: 'Bidang/sisi, rusuk, titik sudut, serta bentuk sisi kubus dan balok.',
        learningEvidence: 'Menandai unsur bangun dan menyampaikan sedikitnya satu persamaan serta satu perbedaan yang benar.',
        missionName: 'Detektif Kumis',
      },
      {
        code: 'TP-3',
        objective: 'Murid dapat mengonstruksi dan mengurai kubus atau balok menggunakan balok satuan digital.',
        materialScope: 'Penyusunan unit, posisi antarbagiannya, dan penguraian struktur sederhana.',
        learningEvidence: 'Membuat struktur sesuai target dan menjelaskan bagian penyusunnya.',
        missionName: 'Bengkel Blok',
      },
      {
        code: 'TP-4',
        objective: 'Murid dapat mengonstruksi dan mengurai gabungan kubus dan balok dengan lebih dari satu strategi yang masuk akal.',
        materialScope: 'Struktur gabungan, bagian tampak/tersembunyi, dan strategi penguraian.',
        learningEvidence: 'Menyelesaikan bangun target serta menjelaskan dua cara penguraian atau alasan memilih satu cara.',
        missionName: 'Gudang Kota Meow',
      },
      {
        code: 'TP-5',
        objective: 'Murid dapat mengenali dan menentukan tampak depan, atas, dan samping dari kubus, balok, atau gabungannya.',
        materialScope: 'Visualisasi spasial dan representasi ortografis sederhana.',
        learningEvidence: 'Memilih atau membuat tiga tampak yang konsisten dengan satu model tiga dimensi.',
        missionName: 'Menara Tiga Arah',
      },
      {
        code: 'TP-6',
        objective: 'Murid dapat membandingkan karakteristik struktur dan menentukan lokasi objek pada peta berpetak.',
        materialScope: 'Perbandingan struktur dan lokasi pada grid/peta berpetak.',
        learningEvidence: 'Membuat pilihan desain berdasarkan ciri struktur dan menempatkan bangunan pada lokasi yang tepat.',
        missionName: 'Arsitek Kota Meow',
      },
    ],
    atpFlow:
      'mengenali representasi → menganalisis ciri → mengonstruksi/mengurai bangun tunggal → mengonstruksi/mengurai gabungan → memvisualisasikan dari tiga arah → menerapkan dalam proyek dan peta berpetak',
    atpSteps: [
      {
        order: 1,
        tpCode: 'TP-1',
        focus: 'Mengenali representasi dan jenis bangun.',
        coreExperience: 'Mengamati benda/model, memilah 2D–3D, lalu membandingkan kubus dan balok.',
        formativeEvidence: 'Klasifikasi kartu/model dan alasan lisan singkat.',
        suggestedPlacement: 'Awal pengembangan materi; dapat dimulai di kelas V.',
      },
      {
        order: 2,
        tpCode: 'TP-2',
        focus: 'Mengidentifikasi dan membandingkan karakteristik.',
        coreExperience: 'Menyorot bidang/sisi, rusuk, titik sudut, serta mencatat persamaan dan perbedaan.',
        formativeEvidence: 'Penandaan unsur pada model dan tabel perbandingan.',
        suggestedPlacement: 'Setelah TP-1; dapat dilanjutkan di kelas V.',
      },
      {
        order: 3,
        tpCode: 'TP-3',
        focus: 'Mengonstruksi dan mengurai bangun tunggal.',
        coreExperience: 'Menyusun kubus atau balok dari unit digital, lalu membongkarnya menjadi bagian penyusun.',
        formativeEvidence: 'Produk struktur dan penjelasan urutan atau komponen penyusun.',
        suggestedPlacement: 'Kelas V, setelah murid mengenali ciri bangun.',
      },
      {
        order: 4,
        tpCode: 'TP-4',
        focus: 'Mengonstruksi dan mengurai gabungan.',
        coreExperience: 'Membangun struktur gabungan, menemukan bagian tersembunyi, dan membandingkan strategi penguraian.',
        formativeEvidence: 'Tantangan bangun gabungan dan alasan strategi.',
        suggestedPlacement: 'Kelas V akhir atau penguatan awal kelas VI, sesuai kesiapan.',
      },
      {
        order: 5,
        tpCode: 'TP-5',
        focus: 'Visualisasi spasial tiga arah.',
        coreExperience: 'Memutar bangun, memprediksi tampak depan–atas–samping, lalu memeriksa dengan mode tampak baku.',
        formativeEvidence: 'Tiga tampak yang cocok dengan satu model dan refleksi kesalahan.',
        suggestedPlacement: 'Setelah pengalaman konstruksi cukup; kelas V akhir atau kelas VI.',
      },
      {
        order: 6,
        tpCode: 'TP-6',
        focus: 'Transfer pada proyek dan peta berpetak.',
        coreExperience: 'Membandingkan desain struktur, menempatkannya di peta Kota Meow, dan menjelaskan keputusan.',
        formativeEvidence: 'Produk proyek, lokasi grid, dan penjelasan lisan atau tulisan.',
        suggestedPlacement: 'Penutup ATP Fase C; dapat menjadi proyek penutup kelas V atau kelas VI.',
      },
    ],
    unitNote:
      'Jika waktu terbatas, kelas V dapat memprioritaskan TP-1 sampai TP-4 dan pengenalan TP-5. Kelas VI dapat memakai data ini untuk penguatan, remedial, dan transfer.',
    source: {
      label: 'Panduan perumusan TP dan penyusunan ATP',
      href: 'https://pusatinformasi.rumahpendidikan.kemendikdasmen.go.id/hc/id/articles/52513306767897-Perumusan-Tujuan-Pembelajaran-TP-dan-Penyusunan-Alur-Tujuan-Pembelajaran-ATP',
      note: 'Rujukan prinsip penyusunan TP dan ATP; urutan MeowMath tetap merupakan usulan aplikasi.',
    },
  },
  schoolDecision: {
    statusLabel: 'Keputusan satuan pendidikan',
    note:
      'Sekolah atau guru menetapkan pembagian kelas V–VI, alokasi waktu, KKTP, penyesuaian KOSP, dan pelaporan hasil belajar. MeowMath menyediakan bukti belajar, bukan keputusan tersebut.',
  },
}

export const learningResourceMenuIntro = {
  title: 'Materi Bangun Ruang',
  description:
    'Kenali ciri, contoh benda yang mirip, model 3D, dan jaring-jaring berbagai bangun ruang bersama Mio.',
  netNotice:
    'Jaring-jaring adalah bentuk datar yang dapat dilipat menjadi bangun ruang. Untuk bangun bersisi lengkung, jaring-jaring dapat memuat lingkaran atau juring; bola tidak memiliki jaring-jaring datar tepat.',
} as const
