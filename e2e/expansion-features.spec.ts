import { expect, test } from '@playwright/test'

async function enterMeowMath(page: import('@playwright/test').Page, nickname = 'Dina') {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill(nickname)
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()
  await expect(page.getByRole('heading', { name: new RegExp(`Halo, ${nickname}`, 'i') })).toBeVisible()
}

async function openFromMainMenu(page: import('@playwright/test').Page, name: RegExp) {
  await page.getByRole('button', { name: 'Kembali ke menu utama Kota Meow', exact: true }).click()
  if (name.test('CP')) await page.getByText('Tempat untuk pendamping').click()
  await page.getByRole('button', { name }).click()
}

test('menu utama memisahkan materi, kurikulum, dan jaring-jaring dengan jelas', async ({ page }) => {
  await enterMeowMath(page, 'Lia')
  await expect(page.getByRole('heading', { name: 'Enam pintu Kota Meow' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Materi Bangun Ruang/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Jaring-jaring 3D/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Studio Arsitek/ })).toBeVisible()

  await page.getByRole('button', { name: /Materi Bangun Ruang/ }).click()
  await expect(page.getByRole('heading', { name: 'Materi Bangun Ruang' })).toBeVisible()
  await expect(page.locator('#resource-detail-heading')).toHaveText('Kubus')
  await expect(page.getByRole('tablist', { name: 'Pilih kelompok materi' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Prisma Segitiga sisi datar', exact: true })).toBeVisible()

  await openFromMainMenu(page, /Jaring-jaring 3D/)
  await expect(page.getByRole('heading', { name: 'Jaring-jaring bangun ruang' })).toBeVisible()
  await page.getByRole('button', { name: 'Periksa jaring-jaring' }).click()
  await expect(page.locator('.net-lab__feedback b')).toContainText('Ini jaring-jaring yang tepat.')

  await openFromMainMenu(page, /CP/)
  await expect(page.getByRole('heading', { name: 'Peta Belajar MeowMath' })).toBeVisible()
  await page.getByText('Dasar perjalanan').click()
  await expect(page.getByRole('heading', { name: /Capaian Pembelajaran Matematika Fase C/ })).toBeVisible()
  await page.getByText('Rute belajar MeowMath').click()
  await expect(page.getByText('TP-6', { exact: true })).toBeVisible()
})

test('materi dan jaring-jaring memberi model 3D untuk bangun pengayaan', async ({ page }) => {
  await enterMeowMath(page, 'Sita')

  await page.getByRole('button', { name: /Materi Bangun Ruang/ }).click()
  await expect(page.getByRole('button', { name: 'Prisma Segiempat sisi datar', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limas Segitiga sisi datar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limas Segiempat sisi datar', exact: true }).click()
  await expect(page.getByTestId('solid-explorer-limas-segiempat')).toBeVisible()
  await page.getByRole('button', { name: 'Tampilkan Limas Segiempat dari arah atas', exact: true }).click()

  await openFromMainMenu(page, /Jaring-jaring 3D/)
  await page.getByRole('tab', { name: 'Tabung', exact: true }).click()
  await expect(page.getByText('Dua lingkaran dan satu persegi panjang')).toBeVisible()
  await page.getByRole('tab', { name: '2. Lipat perlahan', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Langkah 1 dari 3: Buka selimut/ })).toBeVisible()
  await expect(page.getByTestId('net-fold-3d-cylinder')).toBeVisible()
  await page.getByRole('button', { name: /Lanjut/ }).click()
  await expect(page.getByRole('heading', { name: /Langkah 2 dari 3: Buat alas/ })).toBeVisible()
  await expect(page.getByText('Lipatan 50%', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Bola', exact: true }).click()
  await expect(page.getByText('Bola tidak punya jaring-jaring datar tepat')).toBeVisible()
})

test('karya studio arsitektur tersimpan kembali pada perangkat yang sama', async ({ page }) => {
  await enterMeowMath(page, 'Reno')
  await page.getByRole('button', { name: /Studio Arsitek/ }).click()
  await expect(page.getByRole('heading', { name: 'Jadilah arsitek Kota Meow' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Studio Arsitek Mio' })).toBeVisible()

  await page.getByRole('button', { name: 'Pilih Balok', exact: true }).click()
  await page.getByRole('button', { name: 'Letakkan bangun', exact: true }).click()
  await expect(page.getByText(/Balok diletakkan di X 1, Y 1, Z 1/)).toBeVisible()
  await page.getByRole('textbox', { name: 'NAMA KARYA' }).fill('Menara Reno')
  await page.getByRole('button', { name: 'Simpan karya', exact: true }).click()
  await expect(page.getByText('Karya tersimpan di perangkat ini. Mio sudah menambahkan papan nama!')).toBeVisible()
  await expect(page.locator('.saved-designs__open', { hasText: 'Menara Reno' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: /Halo, Reno/ })).toBeVisible()
  await page.getByRole('button', { name: /Studio Arsitek/ }).click()
  await page.locator('.saved-designs__open', { hasText: 'Menara Reno' }).click()
  await expect(page.getByRole('textbox', { name: 'NAMA KARYA' })).toHaveValue('Menara Reno')
  await expect(page.getByRole('button', { name: /Pilih Balok di X 1, Y 1, Z 1/ })).toBeVisible()
})

test('studio arsitektur menyatukan semua bangun dalam kanvas XYZ tanpa tumpang tindih', async ({ page }) => {
  await enterMeowMath(page, 'Ayu')
  await page.getByRole('button', { name: /Studio Arsitek/ }).click()

  await expect(page.getByTestId('architecture-unified-studio')).toBeVisible()
  await expect(page.getByText('Sumbu X–Y–Z', { exact: true })).toBeVisible()
  await expect(page.getByText('Kubus berada di tempat yang sama dengan semua bangun lain.')).toBeVisible()
  for (const solid of ['Kubus', 'Balok', 'Prisma Segitiga', 'Prisma Segiempat', 'Limas Segiempat', 'Limas Segitiga', 'Tabung', 'Kerucut', 'Bola']) {
    await expect(page.getByRole('button', { name: `Pilih ${solid}`, exact: true })).toBeVisible()
  }

  await page.getByRole('button', { name: 'Pilih Bola', exact: true }).click()
  await page.getByRole('button', { name: 'Letakkan bangun', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pilih Bola di X 1, Y 1, Z 1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Pilih Tabung', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('sudah terpakai')
  await page.getByRole('button', { name: 'Letakkan bangun', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('sudah terpakai')

  await page.getByRole('button', { name: 'Koordinat X berikutnya', exact: true }).click()
  await expect(page.getByText('Titik pilihan: X 2, Y 1, Z 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Letakkan bangun', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pilih Tabung di X 2, Y 1, Z 1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Pilih Bola di X 1, Y 1, Z 1', exact: true }).click()
  await page.getByRole('button', { name: 'Koordinat X berikutnya', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('sudah terpakai')
  await page.getByRole('button', { name: 'Koordinat X berikutnya', exact: true }).click()
  await page.getByRole('button', { name: 'Pindahkan bangun', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pilih Bola di X 3, Y 1, Z 1', exact: true })).toBeVisible()

  await expect(page.getByText('Klik petak untuk mengubah susunan')).toHaveCount(0)
})
