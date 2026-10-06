// Відновлює статичні файли, яких немає в git: шрифти й котики з сайту, обкладинки з media.wuji.world.
// Знімки старого сайту — node shoot-old.cjs, музика — python music.py.
import fs from 'node:fs'
import books from './src/books.json' with { type: 'json' }

const copy = (from, to) => {
  fs.mkdirSync(to.slice(0, to.lastIndexOf('/')), { recursive: true })
  if (!fs.existsSync(to)) fs.copyFileSync(from, to)
}

for (const f of ['Unbounded-ExtraBold.ttf', 'Onest-Medium.ttf', 'Onest-Bold.ttf']) {
  copy(`../src/fonts/${f}`, `public/fonts/${f}`)
}
for (const cat of ['aska', 'oskar']) {
  for (const n of [1, 2, 3]) copy(`../public/${cat}/${n}.jpg`, `public/cats/${cat}-${n}.jpg`)
}

fs.mkdirSync('public/covers', { recursive: true })
for (const b of books) {
  const out = `public/${b.cover}`
  if (fs.existsSync(out)) continue
  const res = await fetch(b.coverUrl)
  if (!res.ok) {
    console.warn('не вдалося', b.coverUrl)
    continue
  }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()))
  console.log(out)
}
