import { Composition } from 'remotion'
import { FPS } from './theme'
import { TOTAL, Trailer } from './Trailer'

export const Root = () => (
  <>
    <Composition id="Trailer-16x9" component={Trailer} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="Trailer-9x16" component={Trailer} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
  </>
)
