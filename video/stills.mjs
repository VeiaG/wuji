// Пробні кадри: node stills.mjs 16x9 30,120,... — зберігає в out/stills
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import fs from 'node:fs'
import path from 'node:path'

const [, , aspects = '16x9,9x16', frameArg = '40,150,260,330,420,560,700,800'] = process.argv
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') })
fs.mkdirSync('out/stills', { recursive: true })
for (const a of aspects.split(',')) {
  const composition = await selectComposition({ serveUrl, id: `Trailer-${a}` })
  for (const frame of frameArg.split(',').map(Number)) {
    const output = `out/stills/${a}-${String(frame).padStart(3, '0')}.png`
    await renderStill({ composition, serveUrl, frame, output, scale: 0.5 })
    console.log(output)
  }
}
