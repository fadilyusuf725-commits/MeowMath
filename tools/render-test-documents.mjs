import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const toolDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = dirname(toolDirectory)
const sourceDirectory = join(projectDirectory, 'docs', 'sumber')
const outputDirectory = join(projectDirectory, 'docs', 'siap-pakai')
const defaultDocumentNames = ['01-Pretest-MeowMath-Kelas-V', '02-Posttest-MeowMath-Kelas-V']
const requestedArguments = process.argv.slice(2)
const suffixArgument = requestedArguments.find((argument) => argument.startsWith('--pdf-suffix='))
const pdfSuffix = suffixArgument ? suffixArgument.slice('--pdf-suffix='.length) : ''
const requestedDocumentNames = requestedArguments.filter((argument) => !argument.startsWith('--'))
const documentNames = requestedDocumentNames.length > 0 ? requestedDocumentNames : defaultDocumentNames

const printCss = `
  @page { size: A4; margin: 14mm 14mm 16mm; }
  html { color: #243142; }
  body { font-family: Aptos, Arial, sans-serif; font-size: 10.5pt; line-height: 1.42; margin: 0; }
  h1 { color: #41365a; font-size: 22pt; line-height: 1.12; margin: 0 0 4pt; text-align: center; }
  h1.title { text-align: center; }
  .subtitle { color: #75678d; font-size: 12pt; font-weight: 600; text-align: center; margin: 0 0 16pt; }
  h2 { border-bottom: 1.4pt solid #8d7ab8; color: #41365a; font-size: 14pt; margin: 19pt 0 7pt; padding-bottom: 3pt; break-after: avoid; }
  p { margin: 0 0 7pt; }
  ol { margin: 0 0 10pt 20pt; padding: 0; }
  li { margin: 0 0 3pt; }
  table { border-collapse: collapse; font-size: 9.5pt; margin: 7pt 0 12pt; width: 100%; }
  th { background: #eee9f8; color: #41365a; font-weight: 700; }
  th, td { border: .7pt solid #b9b0c8; padding: 4pt 5pt; text-align: left; vertical-align: top; }
  img { display: block; height: auto; margin: 7pt auto 11pt; max-width: 100%; break-inside: avoid; }
  strong { color: #332c40; }
`

function runPandoc(inputPath, outputPath) {
  execFileSync('pandoc', [inputPath, '--from=gfm', '--standalone', `--resource-path=${sourceDirectory}`, '--output', outputPath], { stdio: 'inherit' })
}

async function pruneLegacyOutputFiles() {
  const entries = await readdir(outputDirectory, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const fullPath = join(outputDirectory, entry.name)
    if (!entry.name.includes('Revisi')) {
      await unlink(fullPath)
    }
  }
}

function sanitizePdfMetadata(pdfPath) {
  const pythonCheckScript = `import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('pypdf') else 1)`
  try {
    execFileSync('python', ['-c', pythonCheckScript], { stdio: 'ignore' })
  } catch {
    execFileSync('python', ['-m', 'pip', 'install', '--break-system-packages', 'pypdf'], { stdio: 'inherit' })
  }

  const sanitizeScript = `
from pypdf import PdfReader, PdfWriter
import sys
pdf_path = sys.argv[1]
reader = PdfReader(pdf_path)
writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)
writer.add_metadata({
    '/Title': '',
    '/Author': '',
    '/Subject': '',
    '/Keywords': '',
    '/Creator': '',
    '/Producer': '',
    '/CreationDate': '',
    '/ModDate': '',
})
with open(pdf_path, 'wb') as fh:
    writer.write(fh)
`
  execFileSync('python', ['-c', sanitizeScript, pdfPath], { stdio: 'inherit' })
}

async function embedImages(html) {
  const references = [...html.matchAll(/src="figures\/([^"?#]+\.png)"/g)]
  let embedded = html
  for (const reference of references) {
    const image = await readFile(join(sourceDirectory, 'figures', reference[1]))
    embedded = embedded.replace(reference[0], `src="data:image/png;base64,${image.toString('base64')}"`)
  }
  return embedded
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'meowmath-test-docs-'))
await pruneLegacyOutputFiles()
const browser = await chromium.launch({ headless: true })

try {
  for (const name of documentNames) {
    const sourcePath = join(sourceDirectory, `${name}.md`)
    const docxPath = join(outputDirectory, `${name}.docx`)
    const htmlPath = join(temporaryDirectory, `${name}.html`)
    runPandoc(sourcePath, docxPath)
    runPandoc(sourcePath, htmlPath)
    const html = await embedImages(await readFile(htmlPath, 'utf8'))
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.addStyleTag({ content: printCss })
    await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), undefined, { timeout: 15000 })
    const pdfOutputPath = join(outputDirectory, `${name}${pdfSuffix}.pdf`)
    await page.pdf({
      path: pdfOutputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '14mm', bottom: '16mm', left: '14mm' },
    })
    sanitizePdfMetadata(pdfOutputPath)
    await page.close()
    console.log(`TEST_DOCUMENT_OK ${name}${pdfSuffix}`)
  }
} finally {
  await browser.close()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
