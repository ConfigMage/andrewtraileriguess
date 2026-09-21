import { FEET, type Design } from './types'
const stamp = () => new Date().toISOString()
export function createDesign(name = 'Adventure Prototype'): Design {
  const now = stamp()
  return { schemaVersion: 1, metadata: { name, createdAt: now, modifiedAt: now },
    body: { length: 16 * FEET, width: 8 * FEET, height: 8.5 * FEET, clearance: 1.5 * FEET, wall: 0.028, roofThickness: 0.035, floorThickness: 0.045, nose: 'wedge', roof: 'slightArch', structure: 'honeycomb' },
    chassis: { axles: 'tandem' },
    openings: [
      { id: 'door-a', kind: 'door', side: 'passenger', x: 1.7, y: 0, width: 0.8, height: 1.92 },
      { id: 'window-a', kind: 'window', side: 'passenger', x: 0.75, y: 1.08, width: 0.75, height: 0.7 },
      { id: 'window-b', kind: 'window', side: 'passenger', x: 3.43, y: 1.08, width: 0.85, height: 0.7 },
      { id: 'window-c', kind: 'window', side: 'driver', x: 1.55, y: 1.08, width: 0.95, height: 0.7 },
    ],
    material: { color: '#d8e1dd' },
    designRules: { minimumOpeningSpacing: 0.15, wheelWellClearance: 0.08, minimumWallThickness: 0.012, maximumWallThickness: 0.09 } }
}
export function preset(name: 'Compact 12 ft' | 'Adventure 16 ft' | 'Family 20 ft' | 'Blank / Custom 18 ft'): Design {
  const d = createDesign(name)
  if (name === 'Compact 12 ft') { d.body.length = 12 * FEET; d.body.nose = 'rounded'; d.body.roof = 'rounded'; d.chassis.axles = 'single'; d.openings = [{ id: 'door-a', kind: 'door', side: 'passenger', x: 1.75, y: 0, width: 0.75, height: 1.88 }] }
  if (name === 'Family 20 ft') { d.body.length = 20 * FEET; d.body.nose = 'teardrop'; d.body.roof = 'rounded'; d.openings[0].x = 3.2; d.openings[2].x = 4.4 }
  if (name === 'Blank / Custom 18 ft') { d.body.length = 18 * FEET; d.body.nose = 'flat'; d.body.roof = 'flat'; d.body.structure = 'solid'; d.chassis.axles = 'single'; d.openings = [] }
  return d
}
