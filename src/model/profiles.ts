import type { Body, Opening } from './types'
export function halfWidth(body: Body, x: number) {
  const t = Math.max(0, Math.min(1, x / Math.max(body.length * 0.27, 0.001)))
  const half = body.width / 2
  switch (body.nose) {
    case 'flat': return half
    case 'rounded': return half * (0.78 + 0.22 * Math.sin(t * Math.PI / 2))
    case 'wedge': return half * (0.34 + 0.66 * t)
    case 'teardrop': return half * (0.28 + 0.72 * Math.sin(t * Math.PI / 2) ** 1.7)
  }
}
export function roofRise(body: Body) { return body.roof === 'flat' ? 0 : body.roof === 'slightArch' ? Math.min(0.1, body.height * 0.04) : Math.min(0.31, body.height * 0.12) }
export function roofY(body: Body, x: number, z: number) {
  const ratio = Math.min(1, Math.abs(z) / Math.max(halfWidth(body, x), 0.001))
  return body.height - roofRise(body) * ratio ** (body.roof === 'rounded' ? 1.5 : 2)
}
export const wallTopY = (body: Body) => body.height - roofRise(body)
export function sideZ(body: Body, side: 'driver' | 'passenger', x: number, inset = 0) {
  return (side === 'passenger' ? 1 : -1) * (halfWidth(body, x) - inset)
}
export function openingBounds(body: Body, opening: Opening) {
  return { x0: opening.x, x1: opening.x + opening.width, y0: body.floorThickness + opening.y, y1: body.floorThickness + opening.y + opening.height }
}
export function interiorFloorArea(body: Body) {
  const steps = 100
  let area = 0
  for (let i = 0; i < steps; i++) area += Math.max(0, 2 * (halfWidth(body, body.length * (i + 0.5) / steps) - body.wall)) * body.length / steps
  return area
}
