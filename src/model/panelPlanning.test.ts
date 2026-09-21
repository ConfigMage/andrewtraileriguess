import { describe, expect, it } from 'vitest'
import { createDesign } from './presets'
import { PANEL_LIMIT, planPanels } from './panelPlanning'
import { EMPTY_PRINT_SETUP } from './printPlanning'

const machine = { ...EMPTY_PRINT_SETUP, buildLength: 0.256, buildWidth: 0.256, buildHeight: 0.256 }

describe('build-volume panel plan', () => {
  it('requires all usable dimensions and rejects a thickness too large for the box', () => {
    const design = createDesign()
    expect(planPanels(design, EMPTY_PRINT_SETUP).status).toBe('incomplete')
    expect(planPanels(design, { ...machine, buildWidth: 0.01 }).status).toBe('blocked')
  })

  it('bounds every planned section for a 256 mm cube and accounts for the six surfaces', () => {
    const design = createDesign()
    const plan = planPanels(design, machine)
    expect(plan.status).toBe('ready')
    expect(plan.panels.length).toBeGreaterThan(500)
    expect(plan.panels.length).toBeLessThan(PANEL_LIMIT)
    expect(Object.values(plan.counts).every(count => count > 0)).toBe(true)
    for (const panel of plan.panels) {
      expect(panel.bounds.x1 - panel.bounds.x0).toBeLessThanOrEqual(machine.buildLength! + 1e-7)
      expect(panel.bounds.y1 - panel.bounds.y0).toBeLessThanOrEqual(machine.buildHeight! + 1e-7)
      expect(panel.bounds.z1 - panel.bounds.z0).toBeLessThanOrEqual(machine.buildWidth! + 1e-7)
    }
  })

  it('is deterministic and reacts to machine size and body geometry', () => {
    const design = createDesign()
    const small = planPanels(design, machine)
    expect(planPanels(design, machine).panels.map(panel => panel.id)).toEqual(small.panels.map(panel => panel.id))
    const larger = planPanels(design, { ...machine, buildLength: 0.5, buildWidth: 0.5, buildHeight: 0.5 })
    expect(larger.status).toBe('ready')
    expect(larger.panels.length).toBeLessThan(small.panels.length)
    const longer = planPanels({ ...design, body: { ...design.body, length: design.body.length + 0.25 } }, machine)
    expect(longer.panels.length).toBeGreaterThan(small.panels.length)
  })

  it('does not fill an opening with wall panels', () => {
    const design = createDesign()
    const plan = planPanels(design, machine)
    const opening = design.openings[0]
    const y0 = design.body.floorThickness + opening.y
    const y1 = y0 + opening.height
    const inside = plan.panels.filter(panel => panel.surface === `${opening.side} wall`).filter(panel => {
      const b = panel.bounds
      return (b.x0 + b.x1) / 2 > opening.x && (b.x0 + b.x1) / 2 < opening.x + opening.width && (b.y0 + b.y1) / 2 > y0 && (b.y0 + b.y1) / 2 < y1
    })
    expect(inside).toHaveLength(0)
    expect(plan.openingConflicts.length).toBeGreaterThan(0)
  })

  it('caps pathological tiny-volume plans before allocation', () => {
    expect(planPanels(createDesign(), { ...machine, buildLength: 0.001, buildWidth: 0.001, buildHeight: 0.001 }).status).toBe('blocked')
  })
})
