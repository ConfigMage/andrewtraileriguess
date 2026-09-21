import { FEET, type Unit } from './types'
export const toDisplay = (meters: number, unit: Unit) => unit === 'imperial' ? meters / FEET : meters
export const fromDisplay = (value: number, unit: Unit) => unit === 'imperial' ? value * FEET : value
export function formatLength(meters: number, unit: Unit, precision = 1) {
  if (unit === 'metric') return `${meters.toFixed(2)} m`
  const totalInches = Math.round((meters / 0.0254) * 10 ** precision) / 10 ** precision
  const feet = Math.floor(totalInches / 12)
  const inches = +(totalInches - feet * 12).toFixed(precision)
  return `${feet} ft ${inches} in`
}
export function formatArea(squareMeters: number, unit: Unit) { return unit === 'metric' ? `${squareMeters.toFixed(1)} m²` : `${(squareMeters / (FEET * FEET)).toFixed(1)} ft²` }
