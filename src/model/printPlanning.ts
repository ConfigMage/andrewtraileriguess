import type { Body } from './types'

export interface PrintSetup {
  buildLength: number | null
  buildWidth: number | null
  buildHeight: number | null
  extrusionWidth: number | null
}

export const EMPTY_PRINT_SETUP: PrintSetup = {
  buildLength: null,
  buildWidth: null,
  buildHeight: null,
  extrusionWidth: null,
}

export const PRINT_LIMITS = {
  buildLength: 100,
  buildWidth: 100,
  buildHeight: 100,
  extrusionWidth: 0.2,
} as const

export type PrintField = keyof PrintSetup
export type FitAxis = { field: 'length' | 'width' | 'height'; shell: number; usable: number | null; fits: boolean | null; remaining: number | null }
export type ThicknessCheck = { field: 'wall' | 'roof' | 'floor'; thickness: number; widths: number; meetsOneWidth: boolean }
export interface PrintCheck { axes: FitAxis[]; fits: boolean | null; thickness: ThicknessCheck[] | null }

export function validatePrintSetup(value: unknown): PrintSetup {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Print setup must be an object')
  const source = value as Record<string, unknown>
  const result = { ...EMPTY_PRINT_SETUP }
  for (const field of Object.keys(EMPTY_PRINT_SETUP) as PrintField[]) {
    const number = source[field]
    if (number === null) continue
    if (typeof number !== 'number' || !Number.isFinite(number) || number <= 0 || number > PRINT_LIMITS[field]) {
      throw new Error(`${field} must be positive and within the input limit`)
    }
    result[field] = number
  }
  return result
}

export function parsePrintSetup(raw: string): PrintSetup {
  try { return validatePrintSetup(JSON.parse(raw)) }
  catch { throw new Error('Saved print setup is invalid') }
}

export function checkPrintSetup(body: Body, setup: PrintSetup): PrintCheck {
  const axes: FitAxis[] = (['length', 'width', 'height'] as const).map(field => {
    const shell = body[field]
    const usable = setup[`build${field[0].toUpperCase()}${field.slice(1)}` as 'buildLength' | 'buildWidth' | 'buildHeight']
    return { field, shell, usable, fits: usable === null ? null : shell <= usable, remaining: usable === null ? null : usable - shell }
  })
  const fits = axes.some(axis => axis.fits === null) ? null : axes.every(axis => axis.fits)
  const thickness = setup.extrusionWidth === null ? null : ([
    { field: 'wall', thickness: body.wall },
    { field: 'roof', thickness: body.roofThickness },
    { field: 'floor', thickness: body.floorThickness },
  ] as const).map(item => ({ ...item, widths: item.thickness / setup.extrusionWidth!, meetsOneWidth: item.thickness >= setup.extrusionWidth! }))
  return { axes, fits, thickness }
}
