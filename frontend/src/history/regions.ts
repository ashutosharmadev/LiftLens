// What the body map shows for each part of the body. When a later version
// measures more parts, this list is the one place to change.

export type RegionId = 'head' | 'shoulders' | 'chest' | 'arms' | 'waist' | 'hips' | 'legs'

export interface Region {
  id: RegionId
  label: string
  measured: boolean
  /** What LiftLens does with this part, shown when it's tapped. */
  detail: string
}

const NOT_MEASURED = 'Not measured in V1. LiftLens V1 measures only your shoulders and waist.'

export const REGIONS: Region[] = [
  { id: 'head', label: 'Head and neck', measured: false, detail: NOT_MEASURED },
  {
    id: 'shoulders',
    label: 'Shoulders',
    measured: true,
    detail: 'Measured edge to edge across the outside of your shoulders. It is the top half of your ratio.',
  },
  { id: 'chest', label: 'Chest', measured: false, detail: NOT_MEASURED },
  { id: 'arms', label: 'Arms', measured: false, detail: NOT_MEASURED },
  {
    id: 'waist',
    label: 'Waist',
    measured: true,
    detail: 'Measured edge to edge, 65% of the way down from your shoulders to your hips. It is the bottom half of your ratio.',
  },
  { id: 'hips', label: 'Hips', measured: false, detail: NOT_MEASURED },
  { id: 'legs', label: 'Legs', measured: false, detail: NOT_MEASURED },
]

export function region(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id)!
}
