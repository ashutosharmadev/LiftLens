// What the body map shows for each part of the body. When a later version
// measures more parts, this list is the one place to change.

export type FrontRegionId = 'head' | 'shoulders' | 'chest' | 'arms' | 'waist' | 'hips' | 'legs'
export type BackRegionId =
  | 'upperBack'
  | 'rearShoulders'
  | 'backArms'
  | 'lats'
  | 'lowerBack'
  | 'glutes'
  | 'hamstrings'
  | 'calves'
export type RegionId = FrontRegionId | BackRegionId

export interface Region {
  id: RegionId
  /** Which figure the part is drawn on. */
  view: 'front' | 'back'
  label: string
  measured: boolean
  /** What LiftLens does with this part, shown when it's tapped. */
  detail: string
}

const NOT_MEASURED = 'Not measured in V1. LiftLens V1 measures only your shoulders and waist.'
const BACK_NOT_MEASURED = "Not measured. LiftLens V1 takes a front photo only, so it can't see your back."

function back(id: BackRegionId, label: string): Region {
  return { id, view: 'back', label, measured: false, detail: BACK_NOT_MEASURED }
}

export const REGIONS: Region[] = [
  { id: 'head', view: 'front', label: 'Head and neck', measured: false, detail: NOT_MEASURED },
  {
    id: 'shoulders',
    view: 'front',
    label: 'Shoulders',
    measured: true,
    detail: 'Measured edge to edge across the outside of your shoulders. It is the top half of your ratio.',
  },
  { id: 'chest', view: 'front', label: 'Chest', measured: false, detail: NOT_MEASURED },
  { id: 'arms', view: 'front', label: 'Arms', measured: false, detail: NOT_MEASURED },
  {
    id: 'waist',
    view: 'front',
    label: 'Waist',
    measured: true,
    detail: 'Measured edge to edge, 65% of the way down from your shoulders to your hips. It is the bottom half of your ratio.',
  },
  { id: 'hips', view: 'front', label: 'Hips', measured: false, detail: NOT_MEASURED },
  { id: 'legs', view: 'front', label: 'Legs', measured: false, detail: NOT_MEASURED },
  back('upperBack', 'Upper back'),
  back('rearShoulders', 'Rear shoulders'),
  back('backArms', 'Triceps and forearms'),
  back('lats', 'Lats'),
  back('lowerBack', 'Lower back'),
  back('glutes', 'Glutes'),
  back('hamstrings', 'Hamstrings'),
  back('calves', 'Calves'),
]

export function region(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id)!
}
