import { expect, test } from '@playwright/test'

test('Materi tetap ringkas tanpa panel model tambahan', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Sita')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()

  await page.getByRole('button', { name: /Materi Bangun Ruang/ }).click()
  await expect(page.getByRole('heading', { name: 'Materi Bangun Ruang' })).toBeVisible()
  await expect(page.getByText('Mengapa dipelajari?')).toHaveCount(0)
  await expect(page.getByText('AJAK MODELNYA BERPUTAR')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Laboratorium bagian kubus' })).toHaveCount(0)
  await page.getByText('Kalau masih penasaran').click()
  await expect(page.getByRole('heading', { name: 'Bagian yang perlu diperhatikan' })).toBeVisible()
})
