import { LIMITS, MAX_OPENINGS, type Body, type Design } from './types'
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const enumValue = (v: unknown, values: readonly string[]) => typeof v === 'string' && values.includes(v)
export function validateBody(body: Body): string[] {
  const errors: string[] = []
  for (const [key, range] of Object.entries(LIMITS)) { const value = body[key as keyof typeof LIMITS]; if (!number(value) || value < range[0] || value > range[1]) errors.push(`${key} must be between ${range[0]} and ${range[1]} m`) }
  if (!enumValue(body.nose, ['flat', 'rounded', 'wedge', 'teardrop'])) errors.push('Unknown nose profile')
  if (!enumValue(body.roof, ['flat', 'slightArch', 'rounded'])) errors.push('Unknown roof profile')
  if (!enumValue(body.structure, ['solid', 'ribbed', 'honeycomb', 'lattice'])) errors.push('Unknown wall structure')
  if (number(body.width) && number(body.wall) && body.width <= 2 * body.wall + 0.6) errors.push('Interior width is impossible')
  if (number(body.height) && number(body.floorThickness) && number(body.roofThickness) && body.height <= body.floorThickness + body.roofThickness + 1) errors.push('Interior height is impossible')
  return errors
}
export function validateDesign(input: unknown): Design {
  if (!isRecord(input)) throw new Error('Design must be a JSON object')
  if (input.schemaVersion !== 1) throw new Error(`Unsupported schema version: ${String(input.schemaVersion)}`)
  if (!isRecord(input.metadata) || typeof input.metadata.name !== 'string' || input.metadata.name.length > 80 || typeof input.metadata.createdAt !== 'string' || typeof input.metadata.modifiedAt !== 'string') throw new Error('Invalid metadata')
  if (!isRecord(input.body)) throw new Error('Missing body')
  const body = input.body as unknown as Body
  const errors = validateBody(body)
  if (errors.length) throw new Error(errors.join('; '))
  if (!isRecord(input.chassis) || !enumValue(input.chassis.axles, ['single', 'tandem'])) throw new Error('Invalid chassis')
  if (!Array.isArray(input.openings) || input.openings.length > MAX_OPENINGS) throw new Error(`Openings must be an array of at most ${MAX_OPENINGS}`)
  const ids = new Set<string>()
  for (const item of input.openings) {
    if (!isRecord(item) || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(item.id) || ids.has(item.id)) throw new Error('Invalid or duplicate opening ID')
    ids.add(item.id)
    if (!enumValue(item.kind, ['door', 'window']) || !enumValue(item.side, ['driver', 'passenger'])) throw new Error(`Invalid opening type or side: ${item.id}`)
    for (const key of ['x', 'y', 'width', 'height']) if (!number(item[key])) throw new Error(`Invalid ${key} for ${item.id}`)
    if ((item.width as number) < 0.3 || (item.width as number) > 2 || (item.height as number) < 0.25 || (item.height as number) > 2.5 || Math.abs(item.x as number) > 100 || Math.abs(item.y as number) > 100) throw new Error(`Opening dimensions out of range: ${item.id}`)
  }
  if (!isRecord(input.material) || typeof input.material.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(input.material.color)) throw new Error('Invalid material color')
  if (!isRecord(input.designRules)) throw new Error('Missing design rules')
  for (const key of ['minimumOpeningSpacing', 'wheelWellClearance', 'minimumWallThickness', 'maximumWallThickness']) if (!number(input.designRules[key]) || (input.designRules[key] as number) < 0 || (input.designRules[key] as number) > 1) throw new Error(`Invalid rule: ${key}`)
  if ((input.designRules.minimumWallThickness as number) > (input.designRules.maximumWallThickness as number)) throw new Error('Wall thickness rule range is impossible')
  return structuredClone(input) as unknown as Design
}
export function migrateDesign(input: unknown): Design { return validateDesign(input) }
export function updateBody(design: Design, key: keyof Body, value: Body[keyof Body]): Design {
  const candidate = structuredClone(design)
  candidate.body = { ...candidate.body, [key]: value }
  const errors = validateBody(candidate.body)
  if (errors.length) throw new Error(errors.join('; '))
  return candidate
}
