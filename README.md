# MeowMath — Kota Meow

PWA pembelajaran Matematika SD/MI kelas V untuk mengenali, membangun, dan memvisualisasikan kubus, balok, serta gabungannya. MeowMath dirancang sebagai pendamping pembelajaran kelas: tidak ada akun anak, iklan, pelacak, atau pengiriman data ke server.

## Jalankan

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

```bash
npm test
npm run build
npm run preview
```

`npm run build` menghasilkan PWA pada folder `dist/`. Setelah aplikasi pertama kali dibuka saat tersambung, service worker menyimpan aset aplikasi sehingga misi dapat dibuka kembali saat offline.

## Yang tersedia pada MVP

- Profil nama panggilan lokal; tidak memakai email maupun akun.
- Diagnostik awal dan lima misi Kota Meow yang berurutan.
- Kubus, balok, bangun gabungan, konstruksi dari blok satuan, serta tampak depan–atas–samping.
- Tantangan susun memeriksa koordinat setiap blok pada denah target; siluet yang sama tetapi digeser ke posisi lain tidak diterima.
- Model 3D yang dapat diputar, mode tampak baku, petunjuk bertingkat, dan umpan balik langsung.
- Soal misi bervariasi: pilihan konsep, pasangkan kartu dengan seret atau ketuk, susun blok, urutkan langkah, dan gambar tampak ortografis.
- Satu menu **Materi Bangun Ruang** untuk resource dan model 3D yang dapat diputar: kubus, balok, prisma segitiga/segiempat, limas segitiga/segiempat, tabung, kerucut, dan bola.
- **Laboratorium Kubus** berada di dalam Materi Bangun Ruang untuk menyorot bidang, rusuk, dan titik sudut; misi tetap dipakai untuk mengukur pemahaman.
- Menu **Jaring-jaring 3D** interaktif: anak memilih bangun, menyentuh bidang berwarna, memeriksa susunan, lalu melihat jaring-jaring dilipat bertahap dalam model 3D yang dapat diputar; bola dijelaskan sebagai pengecualian.
- Menu **CP · TP · ATP** yang membedakan ringkasan acuan resmi, rancangan TP/ATP MeowMath, dan keputusan yang tetap berada pada sekolah.
- **Studio Arsitek Mio** adalah satu kanvas kreasi untuk sembilan bangun ruang: pilih bentuk, atur koordinat X–Y–Z, letakkan atau pindahkan tanpa tumpang tindih, lihat sumbu 3D, lalu simpan karya lokal per profil.
- Bacaan instruksi Bahasa Indonesia melalui fitur suara perangkat, dengan teks selalu tersedia.
- Progres, karya arsitektur, dan ringkasan guru dalam IndexedDB lokal.
- Kontrol audio dan mode kurangi gerakan.

## Struktur penting

| Lokasi | Isi |
| --- | --- |
| `src/content/missions.ts` | Bank konten misi, jawaban, petunjuk, dan TP terkait. |
| `src/content/learningResources.ts` | Resource bangun ruang, jaring-jaring, serta data menu CP, TP, dan ATP. |
| `src/lib/geometry.ts` | Mesin grid/voxel, rotasi, validasi struktur, dan proyeksi ortografis. |
| `src/lib/progress.ts` | Skema IndexedDB untuk profil, hasil, karya arsitektur, dan pengaturan lokal. |
| `src/components/` | Pemutar misi, model 3D, materi, jaring-jaring, dan studio arsitektur koordinat. |
| `docs/kurikulum-atp.md` | Peta CP–TP–ATP Fase C serta batas kurikulum MeowMath. |
| `docs/unit-meowmath-kelas-v.md` | Unit kelas V enam sesi, diagnostik, rubrik, dan panduan guru. |

## Catatan pedagogis

Target penilaian inti MeowMath tetap kubus, balok, gabungannya, tampak tiga arah, dan peta berpetak. Semua bangun ruang tersedia bersama dalam menu materi; jaring-jaring dan bentuk lain memperluas pemahaman tanpa menggantikan target TP-1 sampai TP-6. Rumus volume dan luas permukaan hanya tampil sebagai referensi pengayaan; banyaknya blok satuan dipakai untuk membaca struktur, bukan latihan rumus volume.

Rancangan mengacu pada Matematika Fase C, elemen Geometri. CP resmi dan rancangan TP/ATP MeowMath dibedakan dengan jelas di dokumen kurikulum agar aplikasi tetap berfungsi sebagai media pendamping, bukan pengganti keputusan kurikulum satuan pendidikan.

## Privasi dan reset

Semua data murid tersimpan di browser perangkat yang digunakan. Guru dapat membuka menu **Untuk Guru** untuk melihat ringkasan lokal, dan menu **Pengaturan** untuk menghapus semua data perangkat. Menghapus data tidak dapat dibatalkan.
