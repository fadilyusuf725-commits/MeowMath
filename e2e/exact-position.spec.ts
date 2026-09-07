import { expect, test, type Page } from '@playwright/test'

async function completeChoiceMission(page: Page, correctChoices: readonly number[]) {
  for (const [step, choice] of correctChoices.entries()) {
    await page.locator('.choice-button').nth(choice).click()
    await page.getByRole('button', { name: 'Periksa jawaban' }).click()
    await expect(page.getByText('Hebat, tepat!')).toBeVisible()
    await page.getByRole('button', { name: step === correctChoices.length - 1 ? 'Selesaikan misi' : 'Lanjutkan' }).click()
  }
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()
}

async function solveMatchGame(page: Page, pairs: readonly [string, string][]) {
  for (const [itemId, targetId] of pairs) {
    await page.getByTestId(`drag-item-${itemId}`).click()
    await page.getByTestId(`drop-zone-${targetId}`).click()
  }
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()
}

async function completePencariKotak(page: Page) {
  await page.locator('.choice-button').nth(1).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await solveMatchGame(page, [['dadu', 'kubus'], ['kotak-sepatu', 'balok'], ['ubin', 'datar'], ['kardus-buku', 'balok']])
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.locator('.choice-button').nth(1).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.locator('.choice-button').nth(1).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Selesaikan misi' }).click()
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()
}

async function completeDetektifKumis(page: Page) {
  await page.locator('.choice-button').nth(2).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await solveMatchGame(page, [['permukaan', 'bidang'], ['garis', 'rusuk'], ['ujung', 'titik-sudut']])
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.locator('.choice-button').nth(1).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.locator('.choice-button').nth(2).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Selesaikan misi' }).click()
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()
}

test('bangun dengan siluet sama di koordinat lain tidak diterima sebagai jawaban', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Posisi')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()

  await page.getByRole('button', { name: /Misi Kota Meow/ }).click()
  await page.getByRole('button', { name: /^Mulai misi/ }).click()
  await completeChoiceMission(page, [1, 0, 0, 2, 0, 1])
  await page.locator('article').filter({ hasText: 'Pencari Kotak' }).getByRole('button', { name: /Mulai misi/ }).click()
  await completePencariKotak(page)
  await page.locator('article').filter({ hasText: 'Detektif Kumis' }).getByRole('button', { name: /Mulai misi/ }).click()
  await completeDetektifKumis(page)

  await page.locator('article').filter({ hasText: 'Bengkel Blok' }).getByRole('button', { name: /Mulai misi/ }).click()
  await expect(page.getByRole('heading', { name: /Susun balok kecil/ })).toBeVisible()

  // Soal pertama memakai ukuran grid yang sama persis dengan cetak biru.
  // Susun keenam blok pada satu baris dan dua lantai.
  for (const floor of [1, 2]) {
    for (const column of [1, 2, 3]) {
      await page.getByRole('button', { name: `Tambah blok kolom ${column}, baris 1, lantai ${floor}; posisi target` }).click()
    }
  }
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()

  // Soal perbaikan sengaja dimulai dari koordinat salah. Struktur yang hampir
  // sama tidak diterima sampai blok dipindahkan ke titik cetak biru.
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Belum tepat, coba lagi.')).toBeVisible()
  await expect(page.locator('.builder-cell.is-misplaced')).toHaveCount(1)
  await expect(page.locator('.builder-cell.is-target')).toHaveCount(1)
  await page.getByRole('button', { name: 'Hapus blok kolom 2, baris 2, lantai 1' }).click()
  await page.getByRole('button', { name: 'Tambah blok kolom 1, baris 2, lantai 1; posisi target' }).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()

  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  for (const [floor, columns] of [[1, [1, 2, 3]], [2, [1, 2]], [3, [1]]] as const) {
    for (const column of columns) {
      await page.getByRole('button', { name: `Tambah blok kolom ${column}, baris 1, lantai ${floor}` }).click()
    }
  }
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()

  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  const sequenceGame = page.getByTestId('mini-game-b-4')
  await sequenceGame.getByTestId('sequence-item-puncak').getByRole('button', { name: /Turunkan/ }).click()
  await sequenceGame.getByTestId('sequence-item-puncak').getByRole('button', { name: /Turunkan/ }).click()
  await expect(sequenceGame.getByTestId('mini-game-status')).toContainText('berpindah ke posisi 3')
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()
  await page.getByRole('button', { name: 'Selesaikan misi' }).click()
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()

  await page.locator('article').filter({ hasText: 'Menara Tiga Arah' }).getByRole('button', { name: /Mulai misi/ }).click()
  await page.locator('.projection-card').nth(2).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()

  const painter = page.getByTestId('mini-game-t-2')
  await painter.getByRole('button', { name: 'Nyalakan petak kolom 1, baris 1' }).click()
  await expect(painter.getByTestId('mini-game-status')).toContainText('1 petak')
  await painter.getByRole('button', { name: 'Urungkan petak terakhir' }).click()
  await expect(painter.getByTestId('mini-game-status')).toContainText('0 petak')
  for (const [column, row] of [[1, 1], [2, 1], [1, 2]] as const) {
    await painter.getByRole('button', { name: `Nyalakan petak kolom ${column}, baris ${row}` }).click()
  }
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()
})
