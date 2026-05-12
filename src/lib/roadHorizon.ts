import type { RoadHorizonClipSet } from '../types'
import { getStateSegment } from './routeEngine'

/**
 * Percent-based CSS clip-path polygons for each state along the Lansing → Utah route.
 * Coordinates: y toward top of element = smaller % (ridge); flat Great Lakes uses gentle ridges only.
 * Left and right ridge endpoints are matched (same y%) so duplicated hill tiles loop without a seam.
 */
const clipsByStateId: Record<string, RoadHorizonClipSet> = {
  MI: {
    far: 'polygon(0% 100%, 0% 50%, 6% 50%, 14% 51%, 24% 48%, 34% 50%, 44% 47%, 54% 49%, 64% 46%, 74% 49%, 84% 47%, 94% 50%, 100% 50%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 54%, 12% 54%, 28% 56%, 44% 52%, 60% 55%, 76% 52%, 92% 54%, 100% 54%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 59%, 18% 57%, 38% 60%, 58% 58%, 78% 61%, 100% 59%, 100% 100%)',
  },
  IN: {
    far: 'polygon(0% 100%, 0% 47%, 8% 44%, 18% 47%, 28% 42%, 38% 46%, 48% 40%, 58% 45%, 68% 41%, 78% 46%, 88% 43%, 100% 47%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 52%, 14% 50%, 30% 53%, 46% 48%, 62% 52%, 78% 49%, 100% 52%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 57%, 22% 54%, 45% 58%, 68% 55%, 100% 57%, 100% 100%)',
  },
  IL: {
    far: 'polygon(0% 100%, 0% 45%, 10% 43%, 22% 46%, 34% 40%, 46% 44%, 58% 39%, 70% 43%, 82% 41%, 100% 45%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 50%, 16% 48%, 34% 51%, 52% 47%, 70% 50%, 100% 50%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 55%, 24% 53%, 48% 56%, 72% 54%, 100% 55%, 100% 100%)',
  },
  IA: {
    far: 'polygon(0% 100%, 0% 40%, 10% 41%, 25% 45%, 40% 37%, 55% 43%, 70% 35%, 85% 41%, 100% 40%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 48%, 18% 46%, 38% 50%, 58% 44%, 78% 49%, 100% 48%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 54%, 28% 52%, 52% 55%, 76% 53%, 100% 54%, 100% 100%)',
  },
  NE: {
    far: 'polygon(0% 100%, 0% 40%, 12% 39%, 28% 43%, 44% 35%, 60% 41%, 76% 33%, 92% 39%, 100% 40%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 46%, 20% 44%, 42% 48%, 64% 43%, 86% 47%, 100% 46%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 53%, 26% 50%, 54% 54%, 82% 51%, 100% 53%, 100% 100%)',
  },
  WY: {
    far: 'polygon(0% 100%, 0% 40%, 9% 32%, 18% 38%, 28% 26%, 38% 34%, 48% 22%, 58% 32%, 68% 24%, 78% 36%, 88% 28%, 100% 40%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 46%, 14% 40%, 30% 46%, 46% 36%, 62% 44%, 78% 38%, 100% 46%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 53%, 20% 48%, 44% 52%, 68% 49%, 100% 53%, 100% 100%)',
  },
  UT: {
    far: 'polygon(0% 100%, 0% 54%, 12% 54%, 12% 38%, 32% 38%, 32% 46%, 52% 46%, 52% 32%, 72% 32%, 72% 44%, 88% 44%, 88% 54%, 100% 54%, 100% 100%)',
    mid: 'polygon(0% 100%, 0% 48%, 18% 52%, 18% 44%, 42% 44%, 42% 52%, 66% 52%, 66% 42%, 100% 48%, 100% 100%)',
    near: 'polygon(0% 100%, 0% 58%, 24% 56%, 48% 59%, 72% 57%, 100% 58%, 100% 100%)',
  },
}

const defaultClips = clipsByStateId.MI!

/** Horizon silhouettes keyed to current route state (MI … UT). */
export const getRoadHorizonClips = (progress: number): RoadHorizonClipSet => {
  const seg = getStateSegment(progress)
  const id = seg?.id ?? 'MI'
  return clipsByStateId[id] ?? defaultClips
}
