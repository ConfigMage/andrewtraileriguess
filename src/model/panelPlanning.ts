import { halfWidth, openingBounds, roofRise, roofY, wallTopY } from './profiles'
import type { Design, Side } from './types'
import type { PrintSetup } from './printPlanning'

export type PanelSurface = 'passenger wall' | 'driver wall' | 'roof' | 'floor' | 'front end' | 'rear end'
export interface PanelBounds { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
export interface PlannedPanel {
  id: string
  surface: PanelSurface
  bounds: PanelBounds
  span: { a0: number; a1: number; b0: number; b1: number }
}
export interface PanelPlan {
  status: 'incomplete' | 'ready' | 'blocked'
  panels: PlannedPanel[]
  counts: Record<PanelSurface, number>
  openingConflicts: string[]
  reason: string | null
}

export const PANEL_LIMIT = 5000
const EPS = 1e-7
const surfaces: PanelSurface[] = ['passenger wall', 'driver wall', 'roof', 'floor', 'front end', 'rear end']
const blankCounts = () => Object.fromEntries(surfaces.map(surface => [surface, 0])) as Record<PanelSurface, number>
const empty = (status: PanelPlan['status'], reason: string | null): PanelPlan => ({ status, panels: [], counts: blankCounts(), openingConflicts: [], reason })
const extent = (bounds: PanelBounds) => ({ x: bounds.x1 - bounds.x0, y: bounds.y1 - bounds.y0, z: bounds.z1 - bounds.z0 })
const within = (bounds: PanelBounds, length: number, width: number, height: number) => {
  const size = extent(bounds)
  return size.x <= length + EPS && size.y <= height + EPS && size.z <= width + EPS
}
function cuts(low: number, high: number, max: number, landmarks: number[] = []) {
  const marks = [low, ...landmarks.filter(value => value > low + EPS && value < high - EPS), high].sort((a, b) => a - b)
  const result = [low]
  for (let i = 1; i < marks.length; i++) {
    const start = marks[i - 1], end = marks[i], count = Math.ceil((end - start) / max - EPS)
    for (let j = 1; j <= count; j++) result.push(start + (end - start) * j / count)
  }
  return result
}

export function planPanels(design: Design, setup: PrintSetup): PanelPlan {
  const { buildLength: length, buildWidth: width, buildHeight: height } = setup
  if (length === null || width === null || height === null) return empty('incomplete', 'Enter all three usable build dimensions to create a panel plan.')
  const { body } = design
  if (body.wall > Math.min(length, width) + EPS || body.roofThickness > height + EPS || body.floorThickness > height + EPS) {
    return empty('blocked', 'A wall, roof, or floor thickness exceeds the entered build volume in this orientation.')
  }
  const nx = Math.ceil(body.length / length - EPS), ny = Math.ceil(body.height / height - EPS), nz = Math.ceil(body.width / width - EPS)
  if (2 * (nx * ny + nx * nz + ny * nz) > PANEL_LIMIT) return empty('blocked', `This setup needs more than ${PANEL_LIMIT.toLocaleString()} surface cells. Increase the usable dimensions to inspect a plan.`)

  const panels: PlannedPanel[] = []
  const counts = blankCounts()
  let blocked = false
  const push = (surface: PanelSurface, a0: number, a1: number, b0: number, b1: number, bounds: PanelBounds) => {
    if (panels.length >= PANEL_LIMIT) { blocked = true; return }
    const id = `${surface.toUpperCase().replaceAll(' ', '-')}-${String(counts[surface] + 1).padStart(3, '0')}`
    panels.push({ id, surface, bounds, span: { a0, a1, b0, b1 } })
    counts[surface]++
  }
  const wallBounds = (side: Side, x0: number, x1: number, y0: number, y1: number): PanelBounds => {
    const w0 = halfWidth(body, x0), w1 = halfWidth(body, x1)
    return side === 'passenger'
      ? { x0, x1, y0, y1, z0: w0 - body.wall, z1: w1 }
      : { x0, x1, y0, y1, z0: -w1, z1: -w0 + body.wall }
  }
  const addWall = (side: Side, x0: number, x1: number, y0: number, y1: number, depth = 0) => {
    if (blocked) return
    const bounds = wallBounds(side, x0, x1, y0, y1)
    if (within(bounds, length, width, height)) { push(`${side} wall`, x0, x1, y0, y1, bounds); return }
    if (depth >= 18 || x1 - x0 < 0.00001) { blocked = true; return }
    const mid = (x0 + x1) / 2
    addWall(side, x0, mid, y0, y1, depth + 1)
    addWall(side, mid, x1, y0, y1, depth + 1)
  }
  for (const side of ['passenger', 'driver'] as const) {
    const openings = design.openings.filter(opening => opening.side === side).map(opening => openingBounds(body, opening))
    const xs = cuts(0, body.length, length, openings.flatMap(opening => [opening.x0, opening.x1]))
    const ys = cuts(body.floorThickness, wallTopY(body), height, openings.flatMap(opening => [opening.y0, opening.y1]))
    for (let i = 0; i < xs.length - 1 && !blocked; i++) for (let j = 0; j < ys.length - 1 && !blocked; j++) {
      const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1]
      const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2
      if (openings.some(opening => midX > opening.x0 + EPS && midX < opening.x1 - EPS && midY > opening.y0 + EPS && midY < opening.y1 - EPS)) continue
      addWall(side, x0, x1, y0, y1)
    }
  }
  const horizontalX = cuts(0, body.length, length)
  const horizontalZ = cuts(-body.width / 2, body.width / 2, width)
  const roofBounds = (x0: number, x1: number, z0: number, z1: number): PanelBounds => {
    const rise = roofRise(body), power = body.roof === 'rounded' ? 1.5 : 2
    const minHalf = halfWidth(body, x0), maxHalf = halfWidth(body, x1)
    const minAbs = z0 <= 0 && z1 >= 0 ? 0 : Math.min(Math.abs(z0), Math.abs(z1))
    const maxAbs = Math.max(Math.abs(z0), Math.abs(z1))
    const lower = body.height - rise * Math.min(1, maxAbs / minHalf) ** power - body.roofThickness
    const upper = body.height - rise * Math.min(1, minAbs / maxHalf) ** power
    return { x0, x1, y0: lower, y1: upper, z0, z1 }
  }
  const addRoof = (x0: number, x1: number, z0: number, z1: number, depth = 0) => {
    if (blocked) return
    const minAbs = z0 <= 0 && z1 >= 0 ? 0 : Math.min(Math.abs(z0), Math.abs(z1))
    if (minAbs >= halfWidth(body, x1) - EPS) return
    const bounds = roofBounds(x0, x1, z0, z1)
    if (within(bounds, length, width, height)) { push('roof', x0, x1, z0, z1, bounds); return }
    if (depth >= 18) { blocked = true; return }
    if (z1 - z0 > 0.01) {
      const mid = (z0 + z1) / 2
      addRoof(x0, x1, z0, mid, depth + 1)
      addRoof(x0, x1, mid, z1, depth + 1)
    } else {
      const mid = (x0 + x1) / 2
      addRoof(x0, mid, z0, z1, depth + 1)
      addRoof(mid, x1, z0, z1, depth + 1)
    }
  }
  for (let i = 0; i < horizontalX.length - 1 && !blocked; i++) for (let j = 0; j < horizontalZ.length - 1 && !blocked; j++) {
    const x0 = horizontalX[i], x1 = horizontalX[i + 1], z0 = horizontalZ[j], z1 = horizontalZ[j + 1]
    addRoof(x0, x1, z0, z1)
    const minAbs = z0 <= 0 && z1 >= 0 ? 0 : Math.min(Math.abs(z0), Math.abs(z1))
    if (minAbs < halfWidth(body, x1) - EPS) push('floor', x0, x1, z0, z1, { x0, x1, y0: 0, y1: body.floorThickness, z0, z1 })
  }
  for (const front of [true, false]) {
    const surface: PanelSurface = front ? 'front end' : 'rear end'
    const x = front ? 0 : body.length, x0 = front ? 0 : x - body.wall, x1 = front ? body.wall : x
    const endZ = cuts(-halfWidth(body, x), halfWidth(body, x), width)
    const endY = cuts(body.floorThickness, body.height, height)
    for (let i = 0; i < endZ.length - 1 && !blocked; i++) for (let j = 0; j < endY.length - 1 && !blocked; j++) {
      const z0 = endZ[i], z1 = endZ[i + 1], y0 = endY[j], y1 = endY[j + 1]
      const minAbs = z0 <= 0 && z1 >= 0 ? 0 : Math.min(Math.abs(z0), Math.abs(z1))
      if (y0 >= roofY(body, x, minAbs) - body.roofThickness - EPS) continue
      push(surface, y0, y1, z0, z1, { x0, x1, y0, y1, z0, z1 })
    }
  }
  if (blocked) return empty('blocked', `This layout exceeds the ${PANEL_LIMIT.toLocaleString()} panel preview limit or cannot fit a curved surface in the entered orientation.`)
  const openingConflicts = design.openings.filter(opening => {
    const box = openingBounds(body, opening)
    return panels.some(panel => {
      if (panel.surface !== `${opening.side} wall`) return false
      const { x0, x1, y0, y1 } = panel.bounds
      return [x0, x1].some(x => x > box.x0 + EPS && x < box.x1 - EPS) ||
        [y0, y1].some(y => y > box.y0 + EPS && y < box.y1 - EPS)
    })
  }).map(opening => opening.id)
  return { status: 'ready', panels, counts, openingConflicts, reason: null }
}
