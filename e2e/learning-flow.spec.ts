import { expect, test } from '@playwright/test'

test('murid dapat menyelesaikan diagnostik dan progresnya tersimpan lokal', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Nara')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()

  await expect(page.getByRole('heading', { name: /Halo, Nara/i })).toBeVisible()
  await page.getByRole('button', { name: /Misi Kota Meow/ }).click()
  await page.getByRole('button', { name: /^Mulai misi/ }).click()
  await expect(page.getByRole('heading', { name: 'Pintu Kota Meow' })).toBeVisible()

  const correctChoices = [1, 0, 0, 2, 0, 1]
  for (const [step, choice] of correctChoices.entries()) {
    await page.locator('.choice-button').nth(choice).click()
    await page.getByRole('button', { name: 'Periksa jawaban' }).click()
    await expect(page.getByText('Hebat, tepat!')).toBeVisible()
    await page.getByRole('button', { name: step === correctChoices.length - 1 ? 'Selesaikan misi' : 'Lanjutkan' }).click()
  }

  await expect(page.getByRole('dialog')).toContainText('Pintu Kota Meow selesai!')
  await page.getByRole('button', { name: /Kembali ke Kota Meow/ }).click()
  await expect(page.getByRole('button', { name: /^Ulangi misi/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: /Halo, Nara/i })).toBeVisible()
  await expect(page.getByText('Mandiri').first()).toBeVisible()
})
