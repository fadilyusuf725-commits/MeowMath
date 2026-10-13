import { useState, type FormEvent } from 'react'

type ChatRole = 'assistant' | 'user'

type ChatMessage = {
  readonly id: string
  readonly role: ChatRole
  readonly text: string
}

const quickPrompts = [
  'Apa bedanya kubus dan balok?',
  'Bagaimana membaca tampak atas?',
  'Apa itu jaring-jaring?',
  'Aku bingung mulai dari mana.',
] as const

const welcomeMessage: ChatMessage = {
  id: 'mio-sapaan',
  role: 'assistant',
  text: 'Halo! Aku Mio. Aku bisa memberi petunjuk singkat tentang bangun ruang. Pilih pertanyaan di bawah atau tulis pertanyaanmu sendiri.',
}

function normaliseQuestion(question: string): string {
  return question.toLocaleLowerCase('id-ID').trim().replace(/\s+/g, ' ')
}

/**
 * Petunjuk lokal berbasis kata kunci. Fungsi ini sengaja tidak menghubungi
 * layanan luar agar tetap jujur, aman, dan dapat dipakai tanpa internet.
 */
export function getMioReply(question: string): string {
  const text = normaliseQuestion(question)

  if (/(kubus).*(balok)|(balok).*(kubus)/.test(text)) {
    return 'Kubus dan balok sama-sama memiliki 6 bidang, 12 rusuk, dan 8 titik sudut. Bedanya, semua bidang kubus berbentuk persegi yang sama besar, sedangkan bidang balok berbentuk persegi panjang dan ukurannya dapat berbeda.'
  }
  if (/tampak|atas|depan|samping/.test(text)) {
    return 'Pilih satu arah pandang dulu. Tampak atas melihat dari atas, tampak depan melihat dari depan, dan tampak samping melihat dari sisi. Bayangkan kamu memotret bangun dari arah itu tanpa memindahkannya.'
  }
  if (/jaring|lipat/.test(text)) {
    return 'Jaring-jaring adalah bidang-bidang datar yang masih terbuka. Saat dilipat pada rusuknya, bidang-bidang itu bertemu dan membentuk bangun ruang. Coba buka menu “Buka dan lipat”, lalu geser penggesernya perlahan.'
  }
  if (/koordinat|sumbu|xyz|arsitek|studio/.test(text)) {
    return 'Di Studio Arsitek, X bergerak ke samping, Y bergerak ke atas, dan Z bergerak ke depan atau belakang. Pilih titik terlebih dahulu, lalu letakkan bangun. Satu titik hanya boleh ditempati satu bangun agar tidak bertumpuk.'
  }
  if (/kubus/.test(text)) {
    return 'Kubus mempunyai 6 bidang persegi yang sama besar. Coba cari 12 rusuknya, lalu putar model untuk menemukan titik sudut yang semula tersembunyi.'
  }
  if (/balok/.test(text)) {
    return 'Balok memiliki 6 bidang, 12 rusuk, dan 8 titik sudut. Bidang yang saling berhadapan mempunyai bentuk dan ukuran yang sama.'
  }
  if (/prisma/.test(text)) {
    return 'Prisma mempunyai dua alas yang sama bentuk dan sejajar. Nama prismanya mengikuti bentuk alasnya, misalnya prisma segitiga memiliki alas berbentuk segitiga.'
  }
  if (/limas/.test(text)) {
    return 'Limas mempunyai satu alas dan bidang-bidang tegak yang bertemu pada satu puncak. Coba hitung bentuk alasnya untuk mengetahui nama limas itu.'
  }
  if (/tabung/.test(text)) {
    return 'Tabung mempunyai dua alas berbentuk lingkaran yang sama besar dan satu selimut lengkung. Jika selimutnya dibuka, bentuknya menjadi persegi panjang.'
  }
  if (/kerucut/.test(text)) {
    return 'Kerucut mempunyai satu alas berbentuk lingkaran dan satu puncak. Saat selimutnya dibuka, bentuknya seperti juring atau kipas.'
  }
  if (/bola/.test(text)) {
    return 'Bola seluruh permukaannya lengkung dan tidak memiliki rusuk atau titik sudut. Karena permukaannya lengkung utuh, bola tidak mempunyai jaring-jaring datar yang tepat.'
  }
  if (/bidang|sisi|rusuk|titik sudut/.test(text)) {
    return 'Bidang atau sisi adalah permukaan datar pada bangun. Rusuk adalah garis pertemuan dua bidang, sedangkan titik sudut adalah tempat beberapa rusuk bertemu. Putar model agar bagian yang tersembunyi ikut terlihat.'
  }
  if (/bingung|mulai|bantu|tolong/.test(text)) {
    return 'Tidak apa-apa kalau masih bingung. Mulailah dari “Lihat bentuk”: pilih satu bangun, putar modelnya, lalu cari bidang, rusuk, dan titik sudut. Setelah itu kamu bisa mencoba satu misi.'
  }

  return 'Aku belum yakin dengan pertanyaan itu. Coba tulis satu kata penting seperti “kubus”, “balok”, “tampak atas”, “jaring-jaring”, “prisma”, atau “limas”. Kamu juga bisa membuka menu Materi untuk melihat modelnya.'
}

function createMessages(question: string, currentLength: number): readonly ChatMessage[] {
  const cleanQuestion = question.trim()
  if (!cleanQuestion) return []
  const baseId = `pesan-${currentLength + 1}`
  return [
    { id: `${baseId}-murid`, role: 'user', text: cleanQuestion },
    { id: `${baseId}-mio`, role: 'assistant', text: getMioReply(cleanQuestion) },
  ]
}

/** Pendamping belajar lokal yang memberi petunjuk singkat, bukan layanan AI daring. */
export function MeowMathChat() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<readonly ChatMessage[]>([welcomeMessage])

  function sendQuestion(nextQuestion: string) {
    setMessages((current) => [...current, ...createMessages(nextQuestion, current.length)])
    setQuestion('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.trim()) return
    sendQuestion(question)
  }

  return (
    <section className="meowmath-chat" aria-labelledby="meowmath-chat-heading">
      <div className="meowmath-chat__panel">
        <header className="meowmath-chat__header">
          <div>
            <p className="eyebrow">TANYA MIO</p>
            <h2 id="meowmath-chat-heading">Butuh petunjuk kecil?</h2>
            <p>Mio membantu kamu berpikir, bukan langsung memberi jawaban misi.</p>
          </div>
          <span aria-hidden="true">🐱</span>
        </header>

        <div className="meowmath-chat__quick-prompts" aria-label="Pertanyaan cepat untuk Mio">
          {quickPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => sendQuestion(prompt)}>{prompt}</button>
          ))}
        </div>

        <div className="meowmath-chat__messages" aria-label="Percakapan dengan Mio" aria-live="polite" aria-relevant="additions" role="log">
          {messages.map((message) => (
            <div className={`meowmath-chat__message meowmath-chat__message--${message.role}`} key={message.id}>
              <p className="meowmath-chat__bubble"><span className="sr-only">{message.role === 'assistant' ? 'Mio berkata: ' : 'Kamu berkata: '}</span>{message.text}</p>
            </div>
          ))}
        </div>

        <form className="meowmath-chat__composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="meowmath-chat-question">Tulis pertanyaan untuk Mio</label>
          <input
            id="meowmath-chat-question"
            maxLength={160}
            onChange={(event) => setQuestion(event.currentTarget.value)}
            placeholder="Contoh: Apa itu rusuk?"
            type="text"
            value={question}
          />
          <button className="primary-button" type="submit">Kirim</button>
        </form>
        <p className="meowmath-chat__privacy">Petunjuk Mio bekerja tanpa internet. Percakapan ini hanya ada selama halaman terbuka.</p>
      </div>
    </section>
  )
}

export default MeowMathChat
