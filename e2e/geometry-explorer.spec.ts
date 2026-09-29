import { expect, test } from '@playwright/test'

test('Laboratorium Kubus tersedia di Materi, bukan di tengah misi', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Sita')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()

  await page.getByRole('button', { name: /Materi Bangun Ruang/ }).click()
  await expect(page.getByRole('heading', { name: 'Materi Bangun Ruang' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Jelajahi bagian kubus' })).toBeVisible()

  await page.getByRole('tab', { name: 'Rusuk' }).click()
  await expect(page.getByRole('tab', { name: 'Rusuk' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Rusuk adalah garis tempat dua bidang bertemu.')).toBeVisible()

  await page.getByRole('tab', { name: 'Titik sudut' }).click()
  await expect(page.getByRole('tab', { name: 'Titik sudut' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Titik sudut adalah titik tempat beberapa rusuk bertemu.')).toBeVisible()
})
