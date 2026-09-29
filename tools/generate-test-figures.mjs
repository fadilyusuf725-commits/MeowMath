import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const toolDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = dirname(toolDirectory)
const figuresDirectory = join(projectDirectory, 'docs', 'sumber', 'figures')

const colours = {
  ink: '#243142',
  muted: '#617083',
  paper: '#ffffff',
  board: '#f4f7fb',
  line: '#cbd5e1',
  purple: '#725fa7',
  purpleSoft: '#eee9f8',
  blue: '#72a6d8',
  blueLight: '#bcdaf3',
  blueDark: '#4f83b6',
  coral: '#ee8b9e',
  yellow: '#f5c85b',
  green: '#89cba9',
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function svg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gambar soal MeowMath"><defs><marker id="arrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M 0 0 L 10 4 L 0 8 z" fill="${colours.purple}"/></marker></defs><rect width="100%" height="100%" fill="${colours.paper}"/>${content}</svg>`
}

function text(x, y, value, size = 20, options = {}) {
  const anchor = options.anchor ?? 'start'
  const fill = options.fill ?? colours.ink
  const weight = options.weight ?? 600
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`
}

function rounded(x, y, width, height, options = {}) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${options.radius ?? 14}" fill="${options.fill ?? colours.paper}" stroke="${options.stroke ?? colours.line}" stroke-width="${options.width ?? 2}"/>`
}

function arrow(x1, y1, x2, y2, label = '') {
  const labelMarkup = label ? text((x1 + x2) / 2, Math.min(y1, y2) - 12, label, 16, { anchor: 'middle', fill: colours.purple, weight: 700 }) : ''
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colours.purple}" stroke-width="4" stroke-linecap="round" marker-end="url(#arrow)"/>${labelMarkup}`
}

function cube(x, y, size, options = {}) {
  const main = options.colour ?? colours.blue
  const left = options.left ?? colours.blueDark
  const top = options.top ?? colours.blueLight
  const label = options.label ?? ''
  const stroke = options.stroke ?? colours.ink
  const half = size / 2
  const quarter = size / 4
  const base = y + size * .78
  let markup = `<g>`
  markup += `<polygon points="${x + half},${y} ${x + size},${y + quarter} ${x + half},${y + half} ${x},${y + quarter}" fill="${top}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
  markup += `<polygon points="${x},${y + quarter} ${x + half},${y + half} ${x + half},${base} ${x},${y + size * .53}" fill="${left}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
  markup += `<polygon points="${x + half},${y + half} ${x + size},${y + quarter} ${x + size},${y + size * .53} ${x + half},${base}" fill="${main}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
  if (label) markup += text(x + half + 7, y + size * .61, label, Math.max(12, size * .19), { anchor: 'middle', fill: options.labelFill ?? '#ffffff', weight: 800 })
  markup += '</g>'
  return markup
}

function miniCube(x, y, size = 40, colour = colours.blue) {
  return cube(x, y, size, { colour, left: colours.blueDark, top: colours.blueLight, stroke: colours.ink })
}

function title(value, subtitle = '') {
  let markup = text(540, 42, value, 25, { anchor: 'middle', fill: colours.ink, weight: 800 })
  if (subtitle) markup += text(540, 70, subtitle, 17, { anchor: 'middle', fill: colours.muted, weight: 600 })
  return markup
}

function markableLetter(x, y, letter) {
  return `<circle cx="${x}" cy="${y - 6}" r="16" fill="#ffffff" stroke="${colours.purple}" stroke-width="2.5"/>${text(x, y + 1, letter, 18, { anchor: 'middle', fill: colours.purple, weight: 800 })}`
}

function topBoard(x, y, cells, options = {}) {
  const cell = options.cell ?? 72
  const boardWidth = cell * 2
  const boardHeight = cell * 2
  const frontLabel = options.frontLabel ?? true
  const heading = options.heading ?? ''
  const occupied = new Set(cells.map(([column, row]) => `${column},${row}`))
  let markup = ''
  if (heading) markup += text(x + boardWidth / 2, y - 26, heading, 17, { anchor: 'middle', fill: colours.muted, weight: 800 })
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const cellX = x + column * cell
      const cellY = y + row * cell
      markup += rounded(cellX, cellY, cell, cell, { radius: 6, fill: colours.board, stroke: colours.line, width: 1.7 })
      if (occupied.has(`${column},${row}`)) markup += miniCube(cellX + cell * .22, cellY + cell * .18, cell * .58)
    }
  }
  if (frontLabel) {
    markup += arrow(x + boardWidth / 2, y + boardHeight + 34, x + boardWidth / 2, y + boardHeight + 5)
    markup += text(x + boardWidth / 2, y + boardHeight + 57, 'DEPAN', 15, { anchor: 'middle', fill: colours.purple, weight: 800 })
  }
  return markup
}

function frontTile(x, y, size) {
  const inner = size * .18
  return `<g><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="7" fill="${colours.blueLight}" stroke="${colours.ink}" stroke-width="2.4"/><path d="M ${x + inner} ${y + inner} H ${x + size - inner} M ${x + inner} ${y + inner} V ${y + size - inner}" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/></g>`
}

function frontShape(x, y, cells, options = {}) {
  const size = options.size ?? 55
  const columns = options.columns ?? 2
  const occupied = new Set(cells.map(([column, row]) => `${column},${row}`))
  const rows = Math.max(...cells.map(([, row]) => row), 0) + 1
  let markup = ''
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!occupied.has(`${column},${row}`)) continue
      const cubeX = x + column * (size + 3)
      const cubeY = y + (rows - 1 - row) * (size + 3)
      markup += frontTile(cubeX, cubeY, size)
    }
  }
  return markup
}

function optionCards(items, options = {}) {
  const cardWidth = options.cardWidth ?? 245
  const cardHeight = options.cardHeight ?? 218
  const startX = options.startX ?? 20
  const startY = options.startY ?? 100
  const gap = options.gap ?? 16
  let markup = text(540, startY - 22, 'Silang huruf pada gambar pilihan yang tepat.', 18, { anchor: 'middle', fill: colours.purple, weight: 800 })
  items.forEach((item, index) => {
    const x = startX + index * (cardWidth + gap)
    const y = startY
    markup += rounded(x, y, cardWidth, cardHeight, { radius: 16, fill: '#fbfafc', stroke: '#d8cdec', width: 2 })
    markup += markableLetter(x + 28, y + 30, item.letter)
    markup += item.draw(x, y, cardWidth, cardHeight)
  })
  return markup
}

function topChoices(options, choiceOptions = {}) {
  return optionCards(options.map((item) => ({
    letter: item.letter,
    draw: (x, y, width) => topBoard(x + width / 2 - 62, y + 58, item.cells, { cell: 62, frontLabel: true }),
  })), choiceOptions)
}

function frontChoices(options, choiceOptions = {}) {
  return optionCards(options.map((item) => ({
    letter: item.letter,
    draw: (x, y, width, height) => {
      const drawingWidth = 116
      const drawX = x + width / 2 - drawingWidth / 2
      return frontShape(drawX, y + 57, item.cells, { size: 58, columns: 2 }) + text(x + width / 2, y + height - 15, 'dilihat dari depan', 14, { anchor: 'middle', fill: colours.muted, weight: 700 })
    },
  })), choiceOptions)
}

function rotationCompass(start, destination, options = {}) {
  const x = 540
  const y = 225
  const locations = {
    depan: [x, y + 145],
    kiri: [x - 220, y],
    kanan: [x + 220, y],
    belakang: [x, y - 145],
  }
  const arrowAnchors = {
    depan: [x, y + 105],
    kiri: [x - 140, y],
    kanan: [x + 140, y],
    belakang: [x, y - 105],
  }
  const [startX, startY] = arrowAnchors[start]
  const [destinationX, destinationY] = arrowAnchors[destination]
  let markup = '<circle cx="540" cy="225" r="88" fill="#f7f8fc" stroke="#243142" stroke-width="3"/>'
  markup += text(540, 215, 'KOTAK', 27, { anchor: 'middle', weight: 800 })
  markup += text(540, 245, 'dilihat dari atas', 16, { anchor: 'middle', fill: colours.muted, weight: 700 })
  for (const [name, [labelX, labelY]] of Object.entries(locations)) {
    const label = name.toUpperCase()
    const star = name === start ? '★ ' : ''
    markup += text(labelX, labelY + 6, `${star}${label}`, 20, { anchor: 'middle', fill: name === start ? colours.coral : colours.purple, weight: 800 })
  }
  if (options.cleanLeftToBack) {
    markup += `<path d="M 390 225 Q 410 126 525 112" fill="none" stroke="${colours.purple}" stroke-width="5" stroke-linecap="round" marker-end="url(#arrow)"/>`
  } else {
    const controlX = (startX + destinationX) / 2 + (start === 'depan' ? -75 : 75)
    const controlY = (startY + destinationY) / 2 + (start === 'kiri' ? -75 : 75)
    markup += `<path d="M ${startX} ${startY} Q ${controlX} ${controlY} ${destinationX} ${destinationY}" fill="none" stroke="${colours.purple}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 7" marker-end="url(#arrow)"/>`
  }
  markup += text(540, 405, 'Ikuti panah: kotak diputar seperempat putaran.', 18, { anchor: 'middle', fill: colours.muted, weight: 700 })
  return markup
}

function twoCubes(left, right, options = {}) {
  const x = options.x ?? 355
  const y = options.y ?? 115
  const size = options.size ?? 130
  const leftColour = options.leftColour ?? colours.coral
  const rightColour = options.rightColour ?? colours.blue
  let markup = cube(x, y, size, {
    colour: leftColour,
    left: options.leftSide ?? '#c9697d',
    top: options.leftTop ?? '#f6bdc8',
    label: left,
    labelFill: options.leftLabelFill,
  })
  markup += cube(x + size * 1.08, y, size, {
    colour: rightColour,
    left: options.rightSide ?? '#4f83b6',
    top: options.rightTop ?? '#bcdaf3',
    label: right,
    labelFill: options.rightLabelFill,
  })
  return markup
}

function rotateHalfArrow(x = 540, y = 300) {
  return `<path d="M ${x - 155} ${y} C ${x - 70} ${y + 92}, ${x + 70} ${y + 92}, ${x + 155} ${y}" fill="none" stroke="${colours.purple}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 7" marker-end="url(#arrow)"/>${text(x, y + 102, 'putar setengah putaran', 18, { anchor: 'middle', fill: colours.purple, weight: 800 })}`
}

function isometricVoxel(cx, cy, size, options = {}) {
  const halfWidth = size / 2
  const halfHeight = size / 4
  const sideHeight = size * .56
  const top = `${cx},${cy - halfHeight} ${cx + halfWidth},${cy} ${cx},${cy + halfHeight} ${cx - halfWidth},${cy}`
  const left = `${cx - halfWidth},${cy} ${cx},${cy + halfHeight} ${cx},${cy + halfHeight + sideHeight} ${cx - halfWidth},${cy + sideHeight}`
  const right = `${cx},${cy + halfHeight} ${cx + halfWidth},${cy} ${cx + halfWidth},${cy + sideHeight} ${cx},${cy + halfHeight + sideHeight}`
  return `<g><polygon points="${left}" fill="${options.left}" stroke="${colours.ink}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${right}" fill="${options.colour}" stroke="${colours.ink}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${top}" fill="${options.top}" stroke="${colours.ink}" stroke-width="2.4" stroke-linejoin="round"/></g>`
}

function connectedVoxelScene(cells, options = {}) {
  const size = options.size ?? 100
  const halfWidth = size / 2
  const halfHeight = size / 4
  const sideHeight = size * .56
  const originX = options.originX ?? 515
  const originY = options.originY ?? 160
  const palettes = [
    { colour: colours.blue, left: colours.blueDark, top: colours.blueLight },
    { colour: colours.green, left: '#62a27e', top: '#b8e0c8' },
    { colour: colours.coral, left: '#c9697d', top: '#f6bdc8' },
    { colour: colours.yellow, left: '#d7a93f', top: '#fee79b' },
  ]
  return cells
    .map((cell, index) => ({ cell, palette: palettes[index % palettes.length], index }))
    .sort((first, second) => {
      const firstDepth = first.cell[0] + first.cell[1]
      const secondDepth = second.cell[0] + second.cell[1]
      return firstDepth - secondDepth || first.cell[2] - second.cell[2] || first.index - second.index
    })
    .map(({ cell: [x, y, z], palette }) => isometricVoxel(
      originX + (x - y) * halfWidth,
      originY + (x + y) * halfHeight - z * sideHeight,
      size,
      palette,
    ))
    .join('')
}

function stackScene(rightTower = false) {
  const cells = rightTower
    ? [[0, 0, 0], [1, 0, 0], [1, 0, 1]]
    : [[0, 0, 0], [1, 0, 0], [0, 0, 1]]
  return connectedVoxelScene(cells, { originX: 515, originY: 160, size: 100 })
}

function frontViewCue() {
  return arrow(540, 338, 540, 286) + text(540, 358, 'DEPAN', 16, { anchor: 'middle', fill: colours.purple, weight: 800 })
}

function countScene(towerOnRight = false) {
  const cells = towerOnRight
    ? [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 0, 2]]
    : [[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 0, 2]]
  let markup = connectedVoxelScene(cells, { originX: 492, originY: 238, size: 96 })
  markup += text(540, 395, 'Hitung semua kubus yang tampak pada bangunan Mio.', 18, { anchor: 'middle', fill: colours.muted, weight: 700 })
  return markup
}

function comparisonBoard(cells, label, x, sharedView) {
  let markup = rounded(x, 104, 410, 285, { radius: 18, fill: '#fbfafc', stroke: '#d8cdec', width: 2 })
  markup += text(x + 205, 137, label, 21, { anchor: 'middle', fill: colours.purple, weight: 800 })
  markup += topBoard(x + 133, 183, cells, { cell: 72, frontLabel: false, heading: 'dilihat dari atas' })
  if (sharedView === 'depan') {
    markup += arrow(x + 205, 370, x + 205, 338)
    markup += text(x + 205, 384, 'dilihat dari depan', 14, { anchor: 'middle', fill: colours.purple, weight: 800 })
  } else {
    markup += arrow(x + 360, 333, x + 302, 333)
    markup += text(x + 205, 384, 'dilihat dari samping kanan', 14, { anchor: 'middle', fill: colours.purple, weight: 800 })
  }
  return markup
}

function townMap(mioColumn, placeColumn, placeName) {
  const x = 315
  const y = 140
  const cell = 105
  const rows = 4
  const columns = 4
  const columnLabels = ['A', 'B', 'C', 'D']
  let markup = text(540, 40, 'Peta Kota Meow', 27, { anchor: 'middle', weight: 800 })
  markup += text(540, 68, 'Cari letak Mio dan tempat yang dituju.', 17, { anchor: 'middle', fill: colours.muted, weight: 600 })
  for (let column = 0; column < columns; column += 1) {
    markup += text(x + column * cell + cell / 2, y - 18, columnLabels[column], 19, { anchor: 'middle', fill: colours.ink, weight: 800 })
  }
  for (let row = 0; row < rows; row += 1) {
    markup += text(x - 26, y + row * cell + cell / 2 + 7, String(row + 1), 19, { anchor: 'middle', fill: colours.ink, weight: 800 })
    for (let column = 0; column < columns; column += 1) {
      markup += rounded(x + column * cell, y + row * cell, cell, cell, { radius: 4, fill: '#fbfcfe', stroke: colours.line, width: 1.8 })
    }
  }
  const mioX = x + mioColumn * cell + cell / 2
  const mioY = y + cell + cell / 2
  markup += `<circle cx="${mioX}" cy="${mioY}" r="31" fill="#f4e9b4" stroke="${colours.ink}" stroke-width="2.5"/><path d="M ${mioX - 23} ${mioY - 22} L ${mioX - 12} ${mioY - 48} L ${mioX - 1} ${mioY - 23} M ${mioX + 1} ${mioY - 23} L ${mioX + 12} ${mioY - 48} L ${mioX + 23} ${mioY - 22}" fill="#f4e9b4" stroke="${colours.ink}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${mioX - 10}" cy="${mioY - 3}" r="3" fill="${colours.ink}"/><circle cx="${mioX + 10}" cy="${mioY - 3}" r="3" fill="${colours.ink}"/><path d="M ${mioX - 8} ${mioY + 13} Q ${mioX} ${mioY + 20} ${mioX + 8} ${mioY + 13}" fill="none" stroke="${colours.ink}" stroke-width="2"/>`
  markup += text(mioX, mioY + 51, 'Mio', 15, { anchor: 'middle', fill: colours.purple, weight: 800 })
  const placeX = x + placeColumn * cell + cell / 2
  const placeY = y + cell * 2 + cell / 2
  markup += `<path d="M ${placeX - 30} ${placeY - 4} L ${placeX} ${placeY - 33} L ${placeX + 30} ${placeY - 4} V ${placeY + 32} H ${placeX - 30} Z" fill="#f7b9c6" stroke="${colours.ink}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${placeX - 11}" y="${placeY + 8}" width="22" height="20" fill="#fff6df" stroke="${colours.ink}" stroke-width="2"/>`
  markup += text(placeX, placeY + 53, placeName, 14, { anchor: 'middle', fill: colours.coral, weight: 800 })
  return markup
}

function questionOne(cells, answers = [
  { letter: 'A', cells: [[0, 0]] },
  { letter: 'B', cells: [[0, 0], [1, 0]] },
  { letter: 'C', cells: [[0, 0], [0, 1]] },
  { letter: 'D', cells: [[0, 0], [1, 0], [0, 1]] },
]) {
  return svg(1080, 620, title('Bangunan Mio dilihat dari atas') + topBoard(468, 102, cells, { cell: 72, frontLabel: true, heading: 'posisi kubus dari atas' }) + frontChoices(answers, { startY: 340, cardHeight: 220 }))
}

function questionTwo(cellsOptions) {
  return svg(1080, 390, title('Pilih posisi kubus yang benar dari atas') + topChoices(cellsOptions, { startY: 108, cardHeight: 245 }))
}

function questionThree(rightTall) {
  const answers = rightTall
    ? [{ letter: 'A', cells: [[0, 0]] }, { letter: 'B', cells: [[0, 0], [1, 0], [0, 1]] }, { letter: 'C', cells: [[0, 0], [1, 0]] }, { letter: 'D', cells: [[0, 0], [1, 0], [1, 1]] }]
    : [{ letter: 'A', cells: [[0, 0]] }, { letter: 'B', cells: [[0, 0], [1, 0], [0, 1]] }, { letter: 'C', cells: [[0, 0], [1, 0]] }, { letter: 'D', cells: [[0, 0], [1, 0], [1, 1]] }]
  return svg(1080, 680, title('Bangunan Mio') + stackScene(rightTall) + frontViewCue() + frontChoices(answers, { startY: 400, cardHeight: 230 }))
}

function questionFour(start, destination, options = {}) {
  return svg(1080, 455, title('Putaran kotak Mio') + rotationCompass(start, destination, options))
}

function questionFive(left, right, leftColour, rightColour, options = {}) {
  return svg(1080, 510, title('Dua kubus Mio') + twoCubes(left, right, { leftColour, rightColour, ...options }) + rotateHalfArrow(540, 312))
}

function questionSix(initial, options) {
  return svg(1080, 700, title('Susunan kubus diputar setengah putaran') + topBoard(468, 93, initial, { cell: 72, frontLabel: true, heading: 'sebelum diputar' }) + rotateHalfArrow(540, 260) + topChoices(options, { startY: 420, cardHeight: 220 }))
}

function questionSeven(rightTower, options) {
  return svg(1080, 680, title('Menara kecil Mio') + stackScene(rightTower) + frontViewCue() + frontChoices(options, { startY: 400, cardHeight: 230 }))
}

function questionEight(leftBackStack) {
  return svg(1080, 450, title('Bangunan kubus Mio') + countScene(leftBackStack))
}

function questionNine(firstCells, secondCells, sharedView = 'depan') {
  return svg(1080, 425, title(`Dua bangunan dapat terlihat sama dari ${sharedView}`) + comparisonBoard(firstCells, 'Bangunan 1', 105, sharedView) + comparisonBoard(secondCells, 'Bangunan 2', 565, sharedView))
}

function questionMap(mioColumn, placeColumn, placeName) {
  return svg(1080, 665, townMap(mioColumn, placeColumn, placeName))
}

const allFigures = {
  'a-01.svg': questionOne([[0, 0], [0, 1], [1, 1]]),
  'a-02.svg': questionTwo([
    { letter: 'A', cells: [[1, 0], [0, 1], [1, 1]] },
    { letter: 'B', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [0, 1], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0], [0, 1]] },
  ]),
  'a-03.svg': questionThree(true),
  'a-04.svg': questionFour('depan', 'kiri'),
  'a-05.svg': questionFive('MERAH', 'BIRU', colours.coral, colours.blue),
  'a-06.svg': questionSix([[0, 0], [0, 1], [1, 1]], [
    { letter: 'A', cells: [[0, 0], [0, 1], [1, 1]] },
    { letter: 'B', cells: [[1, 0], [0, 1], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0], [0, 1]] },
  ]),
  'a-07.svg': questionSeven(false, [
    { letter: 'A', cells: [[0, 0], [1, 0], [0, 1]] },
    { letter: 'B', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0]] },
  ]),
  'a-08.svg': questionEight(false),
  'a-09.svg': questionNine([[0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]]),
  'a-map.svg': questionMap(1, 2, 'Toko kue'),
  'b-01.svg': questionOne([[1, 0], [0, 1], [1, 1]], [
    { letter: 'A', cells: [[0, 0]] },
    { letter: 'B', cells: [[0, 0], [0, 1]] },
    { letter: 'C', cells: [[0, 0], [1, 0], [0, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0]] },
  ]),
  'b-02.svg': questionTwo([
    { letter: 'A', cells: [[0, 0], [0, 1], [1, 1]] },
    { letter: 'B', cells: [[1, 0], [0, 1], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0]] },
  ]),
  'b-03.svg': questionThree(false),
  'b-04.svg': questionFour('kiri', 'belakang', { cleanLeftToBack: true }),
  'b-05.svg': questionFive('KUNING', 'HIJAU', colours.yellow, colours.green, {
    leftSide: '#d7a93f',
    leftTop: '#fee79b',
    leftLabelFill: colours.ink,
    rightSide: '#62a27e',
    rightTop: '#b8e0c8',
    rightLabelFill: colours.ink,
  }),
  'b-06.svg': questionSix([[0, 0], [1, 0], [1, 1]], [
    { letter: 'A', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'B', cells: [[0, 1], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [0, 1], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0], [0, 1]] },
  ]),
  'b-07.svg': questionSeven(true, [
    { letter: 'A', cells: [[0, 0], [1, 0], [0, 1]] },
    { letter: 'B', cells: [[0, 0], [1, 0], [1, 1]] },
    { letter: 'C', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { letter: 'D', cells: [[0, 0], [1, 0]] },
  ]),
  'b-08.svg': questionEight(true),
  'b-09.svg': questionNine([[0, 0], [0, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]], 'samping kanan'),
  'b-map.svg': questionMap(2, 0, 'Perpustakaan'),
}

const requestedFigureNames = process.argv.slice(2).map((name) => name.endsWith('.svg') ? name : `${name}.svg`)
const selectedFigures = requestedFigureNames.length === 0
  ? allFigures
  : Object.fromEntries(requestedFigureNames.map((name) => {
    if (!allFigures[name]) throw new Error(`Gambar tidak ditemukan: ${name}`)
    return [name, allFigures[name]]
  }))

await mkdir(figuresDirectory, { recursive: true })
await Promise.all(Object.entries(selectedFigures).map(([filename, content]) => writeFile(join(figuresDirectory, filename), content, 'utf8')))
console.log(`FIGURES_WRITTEN ${Object.keys(selectedFigures).length}`)
