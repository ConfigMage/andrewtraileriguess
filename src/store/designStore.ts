import { create } from 'zustand'
import type { Body, Design, Opening, Unit } from '../model/types'
import { MAX_OPENINGS } from '../model/types'
import { createDesign } from '../model/presets'
import { parseDesign } from '../model/serialization'
import { updateBody, validateDesign } from '../model/validation'
const ACTIVE_KEY = 'trailer-lab-active-v1'
const SAVES_KEY = 'trailer-lab-saves-v1'
const clone = (d: Design) => structuredClone(d)
const same = (a: Design, b: Design) => JSON.stringify(a) === JSON.stringify(b)
function touch(design: Design): Design { return { ...design, metadata: { ...design.metadata, modifiedAt: new Date().toISOString() } } }
function readInitial(): { design: Design; notice: string } {
  try { const raw = localStorage.getItem(ACTIVE_KEY); return raw ? { design: parseDesign(raw), notice: '' } : { design: createDesign(), notice: '' } }
  catch (error) { return { design: createDesign(), notice: `Saved design could not be restored. Working from Adventure Prototype. ${String(error)}` } }
}
const initial = readInitial()
export type ViewState = { section: boolean; sectionAt: number; chassis: boolean; dimensions: boolean; grid: boolean; transparent: boolean; structure: boolean; camera: string; unit: Unit }
interface State {
  design: Design; selectedId: string | null; view: ViewState; notice: string; past: Design[]; future: Design[]; gestureStart: Design | null
  setNotice: (message: string) => void; setSelected: (id: string | null) => void; setView: (patch: Partial<ViewState>) => void
  beginGesture: () => void; preview: (edit: (design: Design) => Design) => void; commitGesture: () => void; cancelGesture: () => void
  edit: (edit: (design: Design) => Design) => void; replace: (design: Design) => void; undo: () => void; redo: () => void
  setBody: <K extends keyof Body>(key: K, value: Body[K], preview?: boolean) => void
  addOpening: (kind: Opening['kind'], side: Opening['side']) => void; updateOpening: (id: string, patch: Partial<Opening>, preview?: boolean) => void; duplicateOpening: (id: string) => void; deleteOpening: (id: string) => void
  saveNamed: (name: string) => void; loadNamed: (name: string) => void; listSaves: () => string[]
}
function writeActive(design: Design): string {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(design)); return '' } catch { return 'Autosave unavailable. Current design remains in memory.' }
}
function withCommit(state: State, next: Design) {
  const validated = validateDesign(touch(next))
  if (same(state.design, validated)) return state
  const notice = writeActive(validated)
  return { design: validated, past: [...state.past, clone(state.design)].slice(-50), future: [], gestureStart: null, notice }
}
export const useDesignStore = create<State>((set, get) => ({
  design: initial.design, selectedId: null,
  view: { section: false, sectionAt: 0.52, chassis: true, dimensions: true, grid: true, transparent: false, structure: true, camera: 'Perspective', unit: 'imperial' },
  notice: initial.notice, past: [], future: [], gestureStart: null,
  setNotice: notice => set({ notice }), setSelected: selectedId => set({ selectedId }), setView: patch => set(s => ({ view: { ...s.view, ...patch } })),
  beginGesture: () => set(s => s.gestureStart ? s : { gestureStart: clone(s.design) }),
  preview: edit => set(s => { try { const next = validateDesign(edit(clone(s.design))); return { design: next, notice: '' } } catch (error) { return { notice: String(error) } } }),
  commitGesture: () => set(s => { if (!s.gestureStart || same(s.gestureStart, s.design)) return { gestureStart: null }; const next = touch(s.design); return { design: next, past: [...s.past, s.gestureStart].slice(-50), future: [], gestureStart: null, notice: writeActive(next) } }),
  cancelGesture: () => set(s => s.gestureStart ? { design: s.gestureStart, gestureStart: null } : s),
  edit: edit => set(s => { try { return withCommit(s, edit(clone(s.design))) } catch (error) { return { notice: String(error) } } }),
  replace: design => set(s => { try { return { ...withCommit(s, validateDesign(design)), selectedId: null } } catch (error) { return { notice: String(error) } } }),
  undo: () => set(s => { const previous = s.past.at(-1); if (!previous) return s; const next = clone(previous); return { design: next, past: s.past.slice(0, -1), future: [clone(s.design), ...s.future].slice(0, 50), selectedId: null, notice: writeActive(next) } }),
  redo: () => set(s => { const next = s.future[0]; if (!next) return s; const design = clone(next); return { design, past: [...s.past, clone(s.design)].slice(-50), future: s.future.slice(1), selectedId: null, notice: writeActive(design) } }),
  setBody: (key, value, preview = false) => { const operation = (d: Design) => updateBody(d, key, value); if (preview) get().preview(operation); else get().edit(operation) },
  addOpening: (kind, side) => { if (get().design.openings.length >= MAX_OPENINGS) { set({ notice: `Maximum ${MAX_OPENINGS} openings` }); return } const id = `opening-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; get().edit(d => { d.openings.push({ id, kind, side, x: Math.min(2.1, d.body.length - 1.1), y: kind === 'door' ? 0 : 1, width: kind === 'door' ? 0.8 : 0.85, height: kind === 'door' ? 1.9 : 0.7 }); return d }); set({ selectedId: id }) },
  updateOpening: (id, patch, preview = false) => { const operation = (d: Design) => { const opening = d.openings.find(o => o.id === id); if (opening) Object.assign(opening, patch); return d }; if (preview) get().preview(operation); else get().edit(operation) },
  duplicateOpening: id => { const opening = get().design.openings.find(o => o.id === id); if (!opening || get().design.openings.length >= MAX_OPENINGS) return; const newId = `opening-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; get().edit(d => { d.openings.push({ ...opening, id: newId, x: Math.min(d.body.length - opening.width, opening.x + opening.width + 0.2) }); return d }); set({ selectedId: newId }) },
  deleteOpening: id => { get().edit(d => ({ ...d, openings: d.openings.filter(o => o.id !== id) })); set({ selectedId: null }) },
  saveNamed: name => { try { const trimmed = name.trim().slice(0, 80); if (!trimmed) throw new Error('Enter a name'); const raw = localStorage.getItem(SAVES_KEY); const values: Record<string, Design> = raw ? JSON.parse(raw) : {}; values[trimmed] = clone(get().design); localStorage.setItem(SAVES_KEY, JSON.stringify(values)); set({ notice: `Saved ${trimmed} locally.` }) } catch (error) { set({ notice: `Save failed. Current design remains in memory. ${String(error)}` }) } },
  loadNamed: name => { try { const raw = localStorage.getItem(SAVES_KEY); const values: Record<string, unknown> = raw ? JSON.parse(raw) : {}; if (!values[name]) throw new Error('Save not found'); get().replace(validateDesign(values[name])); set({ notice: `Loaded ${name}.` }) } catch (error) { set({ notice: `Load failed. ${String(error)}` }) } },
  listSaves: () => { try { const raw = localStorage.getItem(SAVES_KEY); return raw ? Object.keys(JSON.parse(raw)).sort() : [] } catch { return [] } },
}))
