import { create } from 'zustand'
import { EMPTY_PRINT_SETUP, parsePrintSetup, validatePrintSetup, type PrintField, type PrintSetup } from '../model/printPlanning'

const STORAGE_KEY = 'trailer-lab-print-setup-v1'

function loadSetup(): { setup: PrintSetup; notice: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { setup: raw ? parsePrintSetup(raw) : { ...EMPTY_PRINT_SETUP }, notice: '' }
  } catch {
    return { setup: { ...EMPTY_PRINT_SETUP }, notice: 'Saved print setup could not be restored. Enter machine values again.' }
  }
}

const initial = loadSetup()
interface PrintState {
  setup: PrintSetup
  showEnvelope: boolean
  notice: string
  setValue: (field: PrintField, value: number | null) => void
  setShowEnvelope: (value: boolean) => void
  clear: () => void
}

function saveSetup(setup: PrintSetup): string {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(setup)); return '' }
  catch { return 'Print setup could not be saved in this browser. It remains available until refresh.' }
}

export const usePrintStore = create<PrintState>((set, get) => ({
  setup: initial.setup,
  showEnvelope: true,
  notice: initial.notice,
  setValue: (field, value) => {
    try {
      const setup = validatePrintSetup({ ...get().setup, [field]: value })
      set({ setup, notice: saveSetup(setup) })
    } catch (error) { set({ notice: String(error) }) }
  },
  setShowEnvelope: showEnvelope => set({ showEnvelope }),
  clear: () => {
    const setup = { ...EMPTY_PRINT_SETUP }
    set({ setup, notice: saveSetup(setup) })
  },
}))
