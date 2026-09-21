export type Nose = 'flat' | 'rounded' | 'wedge' | 'teardrop'
export type Roof = 'flat' | 'slightArch' | 'rounded'
export type Structure = 'solid' | 'ribbed' | 'honeycomb' | 'lattice'
export type Side = 'driver' | 'passenger'
export type Unit = 'imperial' | 'metric'
export type OpeningKind = 'door' | 'window'
export interface Body { length: number; width: number; height: number; clearance: number; wall: number; roofThickness: number; floorThickness: number; nose: Nose; roof: Roof; structure: Structure }
export interface Opening { id: string; kind: OpeningKind; side: Side; x: number; y: number; width: number; height: number }
export interface DesignRules { minimumOpeningSpacing: number; wheelWellClearance: number; minimumWallThickness: number; maximumWallThickness: number }
export interface Design { schemaVersion: 1; metadata: { name: string; createdAt: string; modifiedAt: string }; body: Body; chassis: { axles: 'single' | 'tandem' }; openings: Opening[]; material: { color: string }; designRules: DesignRules }
export interface RuleWarning { code: string; openingIds: string[]; message: string; actual?: number; target?: number }
export const LIMITS = {
  length: [3.05, 8.54], width: [1.52, 2.74], height: [1.83, 3.05], clearance: [0.25, 0.76],
  wall: [0.012, 0.09], roofThickness: [0.012, 0.12], floorThickness: [0.018, 0.15],
} as const
export const FEET = 0.3048
export const TONGUE_LENGTH = 1.2
export const MAX_OPENINGS = 40
