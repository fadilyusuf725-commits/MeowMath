import { describe, expect, it } from 'vitest'
import { getMioReply } from './MeowMathChat'

describe('petunjuk lokal Mio', () => {
  it('memberi penjelasan yang tepat untuk topik geometri yang umum', () => {
    expect(getMioReply('Apa bedanya kubus dan balok?')).toContain('6 bidang, 12 rusuk, dan 8 titik sudut')
    expect(getMioReply('Bagaimana membaca tampak atas?')).toContain('Tampak atas melihat dari atas')
    expect(getMioReply('Apa itu jaring-jaring?')).toContain('Jaring-jaring adalah bidang-bidang datar')
  })

  it('tetap memberi arah belajar yang aman untuk pertanyaan di luar topik', () => {
    expect(getMioReply('Apa warna kesukaanmu?')).toContain('Aku belum yakin')
  })
})
