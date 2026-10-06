import { useEffect, useState } from 'react'
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile } from 'remotion'
import { BeforeScene, ExtrasScene, HOME_DURATION, HomeScene, LogoScene, OutroScene, ReaderScene } from './scenes'
import { loadFonts } from './theme'

export const SCENES = [
  { id: 'before', duration: 90, component: BeforeScene },
  { id: 'logo', duration: 90, component: LogoScene },
  { id: 'home', duration: HOME_DURATION, component: HomeScene },
  { id: 'reader', duration: 180, component: ReaderScene },
  { id: 'extras', duration: 120, component: ExtrasScene },
  { id: 'outro', duration: 120, component: OutroScene },
]

export const TOTAL = SCENES.reduce((s, x) => s + x.duration, 0)

export const Trailer = () => {
  const [handle] = useState(() => delayRender('fonts'))
  useEffect(() => {
    loadFonts().then(() => continueRender(handle))
  }, [handle])

  let from = 0
  return (
    <AbsoluteFill style={{ background: '#080808' }}>
      {/* Синтезована доріжка: python music.py → public/music.wav */}
      <Audio src={staticFile('music.wav')} />
      {SCENES.map(({ id, duration, component: Scene }) => {
        const seq = (
          <Sequence key={id} name={id} from={from} durationInFrames={duration}>
            <Scene />
          </Sequence>
        )
        from += duration
        return seq
      })}
    </AbsoluteFill>
  )
}
