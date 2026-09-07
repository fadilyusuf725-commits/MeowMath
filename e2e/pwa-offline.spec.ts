import { expect, test } from '@playwright/test'

test('shell MeowMath dapat dibuka kembali saat offline setelah kunjungan pertama', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Bangun Kota Meow/i })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Bangun Kota Meow/i })).toBeVisible()
})

test('misi interaktif tetap dapat dibuka saat offline setelah kunjungan pertama', async ({ page, context }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Raka')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()
  await expect(page.getByRole('heading', { name: /Halo, Raka/i })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.getByRole('button', { name: /Misi Kota Meow/ }).click()
  await page.getByRole('button', { name: /^Mulai misi/ }).click()
  await expect(page.getByRole('heading', { name: 'Pintu Kota Meow' })).toBeVisible()
})

test('materi dan studio arsitektur dapat dimuat saat offline setelah kunjungan pertama', async ({ page, context }) => {
  await page.goto('/')
  await page.getByLabel('Nama panggilan').fill('Tari')
  await page.getByRole('button', { name: /Masuk ke Kota Meow/ }).click()
  await expect(page.getByRole('heading', { name: /Halo, Tari/i })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.getByRole('button', { name: /Materi Bangun Ruang/ }).click()
  await expect(page.getByRole('heading', { name: 'Materi Bangun Ruang' })).toBeVisible()
  await page.getByRole('button', { name: 'Kembali ke menu utama Kota Meow', exact: true }).click()
  await page.getByRole('button', { name: /Studio Arsitek/ }).click()
  await expect(page.getByRole('heading', { name: 'Studio Arsitek Mio' })).toBeVisible()
})
