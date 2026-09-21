import type { Design } from './types'
import { migrateDesign, validateDesign } from './validation'
export const MAX_FILE_BYTES = 1_000_000
export function parseDesign(text: string): Design {
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error('Design file exceeds 1 MB')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('Malformed JSON') }
  return migrateDesign(value)
}
export function exportDesign(design: Design) { return JSON.stringify(validateDesign(design), null, 2) }
