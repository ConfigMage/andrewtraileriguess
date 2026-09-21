import { openingBounds, wallTopY } from './profiles'
import type { Design, Opening, RuleWarning } from './types'
const overlaps = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0)
export function axlePositions(design: Design) { const x = design.body.length * 0.72; return design.chassis.axles === 'single' ? [x] : [x - 0.38, x + 0.38] }
export function ruleWarnings(design: Design): RuleWarning[] {
  const warnings: RuleWarning[] = []
  const { body, designRules: rules } = design
  const add = (code: string, openingIds: string[], message: string, actual?: number, target?: number) => warnings.push({ code, openingIds, message, actual, target })
  if (body.wall < rules.minimumWallThickness || body.wall > rules.maximumWallThickness) add('WALL_THICKNESS', [], 'Wall thickness is outside the configured concept range.', body.wall)
  for (const opening of design.openings) {
    const box = openingBounds(body, opening)
    if (box.x0 < 0 || box.x1 > body.length) add('BOUNDARY', [opening.id], `${opening.kind} crosses a front or rear body boundary.`, Math.min(box.x0, body.length - box.x1), 0)
    if (box.y0 < body.floorThickness) add('BELOW_FLOOR', [opening.id], `${opening.kind} extends below the finished floor.`, box.y0, body.floorThickness)
    if (box.y1 > wallTopY(body)) add('ROOF_OVERFLOW', [opening.id], `${opening.kind} reaches beyond the sidewall roof line.`, box.y1, wallTopY(body))
    for (const x of axlePositions(design)) {
      const radius = 0.43 + rules.wheelWellClearance
      if (overlaps(box.x0, box.x1, x - radius, x + radius) > 0 && box.y0 < 0.75 + rules.wheelWellClearance) { add('WHEEL_WELL', [opening.id], `${opening.kind} intersects the conceptual wheel-well zone.`); break }
    }
  }
  for (let i = 0; i < design.openings.length; i++) for (let j = i + 1; j < design.openings.length; j++) {
    const a: Opening = design.openings[i], b: Opening = design.openings[j]
    if (a.side !== b.side) continue
    const A = openingBounds(body, a), B = openingBounds(body, b)
    const dx = overlaps(A.x0, A.x1, B.x0, B.x1), dy = overlaps(A.y0, A.y1, B.y0, B.y1)
    if (dx > 0 && dy > 0) add('OVERLAP', [a.id, b.id], 'Openings overlap on the same wall.', Math.min(dx, dy), 0)
    else if (dy > 0 && dx <= 0 && -dx < rules.minimumOpeningSpacing) add('SPACING', [a.id, b.id], 'Openings are closer than the configured spacing.', -dx, rules.minimumOpeningSpacing)
    else if (dx > 0 && dy <= 0 && -dy < rules.minimumOpeningSpacing) add('SPACING', [a.id, b.id], 'Openings are closer than the configured spacing.', -dy, rules.minimumOpeningSpacing)
  }
  return warnings
}
