import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { halfWidth, roofY, sideZ } from '../model/profiles'
import type { PanelBounds, PanelPlan, PlannedPanel, PanelSurface } from '../model/panelPlanning'
import type { Body } from '../model/types'

type Point = [number, number, number]
const pair = (out: number[], a: Point, b: Point) => out.push(...a, ...b)
function edgePoint(body: Body, panel: PlannedPanel, a: number, b: number): Point {
  switch (panel.surface) {
    case 'passenger wall': return [a, b, sideZ(body, 'passenger', a) + 0.012]
    case 'driver wall': return [a, b, sideZ(body, 'driver', a) - 0.012]
    case 'roof': {
      const z = Math.max(-halfWidth(body, a), Math.min(halfWidth(body, a), b))
      return [a, roofY(body, a, z) + 0.014, z]
    }
    case 'floor': {
      const z = Math.max(-halfWidth(body, a), Math.min(halfWidth(body, a), b))
      return [a, body.floorThickness + 0.015, z]
    }
    case 'front end': return [-0.013, a, b]
    case 'rear end': return [body.length + 0.013, a, b]
  }
}
function panelLines(body: Body, panels: PlannedPanel[]) {
  const out: number[] = []
  for (const panel of panels) {
    const { a0, a1, b0, b1 } = panel.span
    const sides: [number, number, number, number][] = [[a0, b0, a1, b0], [a1, b0, a1, b1], [a1, b1, a0, b1], [a0, b1, a0, b0]]
    for (const [startA, startB, endA, endB] of sides) {
      const steps = panel.surface === 'roof' || panel.surface === 'floor' ? 3 : 1
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps, t1 = (i + 1) / steps
        const a = edgePoint(body, panel, startA + (endA - startA) * t0, startB + (endB - startB) * t0)
        const b = edgePoint(body, panel, startA + (endA - startA) * t1, startB + (endB - startB) * t1)
        if (panel.surface.endsWith('end') && a[1] > roofY(body, panel.surface === 'front end' ? 0 : body.length, a[2]) && b[1] > roofY(body, panel.surface === 'front end' ? 0 : body.length, b[2])) continue
        pair(out, a, b)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  return geometry
}
function boundsLines(bounds: PanelBounds) {
  const { x0, x1, y0, y1, z0, z1 } = bounds
  const p: Point[] = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
  const coords: number[] = []
  for (const [a,b] of edges) pair(coords,p[a],p[b])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coords,3))
  return geometry
}
export function PanelOverlay({ body, plan, selectedIndex, clip, source }: { body: Body; plan: PanelPlan; selectedIndex: number; clip: THREE.Plane[]; source: Record<PanelSurface, THREE.BufferGeometry> }) {
  const seams = useMemo(() => panelLines(body, plan.panels), [body, plan])
  const selected = plan.panels[Math.min(selectedIndex, plan.panels.length - 1)]
  const outline = useMemo(() => selected ? boundsLines(selected.bounds) : new THREE.BufferGeometry(), [selected])
  const patchClip = useMemo(() => {
    if (!selected) return clip
    const b = selected.bounds, margin = 0.0001
    return [...clip,
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -b.x0 + margin),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), b.x1 + margin),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -b.y0 + margin),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), b.y1 + margin),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -b.z0 + margin),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), b.z1 + margin)]
  }, [selected, clip])
  useEffect(() => () => { seams.dispose(); outline.dispose() }, [seams, outline])
  if (plan.status !== 'ready') return null
  return <group>
    <lineSegments geometry={seams} renderOrder={8}><lineBasicMaterial color="#225a70" transparent opacity={0.72} depthTest={false} clippingPlanes={clip}/></lineSegments>
    {selected && <mesh geometry={source[selected.surface]} renderOrder={9}><meshBasicMaterial color="#f1a45a" transparent opacity={0.58} depthTest={false} depthWrite={false} side={THREE.DoubleSide} clippingPlanes={patchClip}/></mesh>}
    {selected && <lineSegments geometry={outline} renderOrder={9}><lineBasicMaterial color="#db762f" depthTest={false} clippingPlanes={clip}/></lineSegments>}
  </group>
}
