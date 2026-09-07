import { expect, test } from '@playwright/test'

async function completeDiagnostic(page: import('@playwright/test').Page) {
  const answers = [1, 0, 0, 2, 0, 1]
  for (const [index, answer] of answers.entries()) {
    await page.locator('.choice-button').nth(answer).click()
    await page.getByRole('button', { name: 'Periksa jawaban' }).click()
    await page.getByRole('button', { name: index === answers.length - 1 ? 'Selesaikan misi' : 'Lanjutkan' }).click()
  }
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()
}

test('Gudang Mio mendukung seret-lepas dan pilihan ketuk untuk memasangkan benda', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('MioKecil')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()
  await page.getByRole('button', { name: /Misi Kota Meow/ }).click()
  await page.getByRole('button', { name: /^Mulai misi/ }).click()
  await completeDiagnostic(page)

  await page.locator('article').filter({ hasText: 'Pencari Kotak' }).getByRole('button', { name: /Mulai misi/ }).click()
  await page.locator('.choice-button').nth(1).click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()

  const game = page.getByTestId('mini-game-p-2')
  await expect(game).toBeVisible()
  await game.getByTestId('drag-item-dadu').dragTo(game.getByTestId('drop-zone-balok'))
  await expect(game.getByTestId('mini-game-status')).toContainText('Dadu Mio dipasangkan ke Mirip balok')

  for (const [itemId, targetId] of [['kotak-sepatu', 'balok'], ['ubin', 'datar'], ['kardus-buku', 'balok']] as const) {
    await game.getByTestId(`drag-item-${itemId}`).click()
    await game.getByTestId(`drop-zone-${targetId}`).click()
  }
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Belum tepat, coba lagi.')).toBeVisible()

  await game.getByTestId('drag-item-dadu').click()
  await game.getByTestId('drop-zone-kubus').click()
  await page.getByRole('button', { name: 'Periksa jawaban' }).click()
  await expect(page.getByText('Hebat, tepat!')).toBeVisible()
})
