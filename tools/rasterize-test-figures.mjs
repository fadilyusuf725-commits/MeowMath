import { readdir } from 'node:fs/promises'
import { dirname, join, parse } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const toolDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = dirname(toolDirectory)
const figuresDirectory = join(projectDirectory, 'docs', 'sumber', 'figures')
const requestedFigureNames = process.argv.slice(2).map((name) => name.endsWith('.svg') ? name : `${name}.svg`)
const allSvgFiles = (await readdir(figuresDirectory)).filter((name) => /^[ab]-(?:\d\d|map)\.svg$/.test(name)).sort()
const svgFiles = requestedFigureNames.length === 0 ? allSvgFiles : requestedFigureNames

for (const svgFile of svgFiles) {
  if (!allSvgFiles.includes(svgFile)) throw new Error(`Gambar tidak ditemukan: ${svgFile}`)
}

const browser = await chromium.launch({ headless: true })
try {
  for (const svgFile of svgFiles) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 })
    await page.goto(pathToFileURL(join(figuresDirectory, svgFile)).href, { waitUntil: 'load' })
    await page.locator('svg').screenshot({ path: join(figuresDirectory, `${parse(svgFile).name}.png`) })
    await page.close()
    console.log(`PNG_WRITTEN ${svgFile}`)
  }
} finally {
  await browser.close()
}
