import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDesign } from './presets'
import { checkPrintSetup, EMPTY_PRINT_SETUP, parsePrintSetup, validatePrintSetup } from './printPlanning'
import { usePrintStore } from '../store/printStore'

afterEach(() => vi.unstubAllGlobals())

describe('print setup', () => {
  const body = createDesign().body

  it('does not claim a fit from missing or partial machine dimensions', () => {
    expect(checkPrintSetup(body, EMPTY_PRINT_SETUP).fits).toBeNull()
    expect(checkPrintSetup(body, EMPTY_PRINT_SETUP).thickness).toBeNull()
    const partial = { ...EMPTY_PRINT_SETUP, buildLength: body.length - 0.1 }
    const result = checkPrintSetup(body, partial)
    expect(result.fits).toBeNull()
    expect(result.axes[0].fits).toBe(false)
    expect(result.axes[1].fits).toBeNull()
  })

  it('compares the unrotated shell against each entered dimension', () => {
    const exact = { ...EMPTY_PRINT_SETUP, buildLength: body.length, buildWidth: body.width, buildHeight: body.height }
    expect(checkPrintSetup(body, exact).fits).toBe(true)
    const undersized = { ...exact, buildWidth: body.width - 0.15 }
    const result = checkPrintSetup(body, undersized)
    expect(result.fits).toBe(false)
    expect(result.axes.find(axis => axis.field === 'width')?.remaining).toBeCloseTo(-0.15)
    expect(checkPrintSetup({ ...body, length: body.length + 0.01 }, exact).fits).toBe(false)
  })

  it('checks thickness against one user-entered extrusion width', () => {
    const result = checkPrintSetup(body, { ...EMPTY_PRINT_SETUP, extrusionWidth: 0.03 })
    expect(result.thickness?.find(item => item.field === 'wall')?.meetsOneWidth).toBe(false)
    expect(result.thickness?.find(item => item.field === 'roof')?.meetsOneWidth).toBe(true)
    const equal = checkPrintSetup(body, { ...EMPTY_PRINT_SETUP, extrusionWidth: body.wall })
    expect(equal.thickness?.find(item => item.field === 'wall')?.meetsOneWidth).toBe(true)
  })

  it('rejects corrupt, nonfinite, and out-of-range saved setup', () => {
    expect(parsePrintSetup(JSON.stringify(EMPTY_PRINT_SETUP))).toEqual(EMPTY_PRINT_SETUP)
    expect(() => parsePrintSetup('{')).toThrow('invalid')
    expect(() => validatePrintSetup({ ...EMPTY_PRINT_SETUP, buildLength: Number.POSITIVE_INFINITY })).toThrow()
    expect(() => validatePrintSetup({ ...EMPTY_PRINT_SETUP, extrusionWidth: -0.01 })).toThrow()
    expect(() => parsePrintSetup(JSON.stringify({ ...EMPTY_PRINT_SETUP, buildWidth: '10' }))).toThrow('invalid')
  })

  it('keeps the edited setup in memory if browser storage fails', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('Blocked') } })
    usePrintStore.setState({ setup: { ...EMPTY_PRINT_SETUP }, notice: '' })
    usePrintStore.getState().setValue('buildLength', 7)
    expect(usePrintStore.getState().setup.buildLength).toBe(7)
    expect(usePrintStore.getState().notice).toContain('could not be saved')
  })
})
