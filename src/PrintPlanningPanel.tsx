import { useEffect, useState } from 'react'
import { checkPrintSetup, PRINT_LIMITS, type PrintField } from './model/printPlanning'
import { formatLength, fromDisplay, toDisplay } from './model/units'
import { useDesignStore } from './store/designStore'
import { usePrintStore } from './store/printStore'

const names: Record<PrintField, string> = {
  buildLength: 'Usable length',
  buildWidth: 'Usable width',
  buildHeight: 'Usable height',
  extrusionWidth: 'Extrusion width',
}

function PrintFieldControl({ field }: { field: PrintField }) {
  const value = usePrintStore(state => state.setup[field])
  const setValue = usePrintStore(state => state.setValue)
  const unit = useDesignStore(state => state.view.unit)
  const isExtrusion = field === 'extrusionWidth'
  const shown = value === null ? '' : String(+(isExtrusion ? value * 1000 : toDisplay(value, unit)).toFixed(isExtrusion ? 2 : 3))
  const [draft, setDraft] = useState(shown)
  useEffect(() => setDraft(shown), [shown])
  const commit = () => {
    if (!draft.trim()) { setValue(field, null); return }
    const input = Number(draft)
    const meters = isExtrusion ? input / 1000 : fromDisplay(input, unit)
    setValue(field, meters)
    if (!Number.isFinite(meters) || meters <= 0 || meters > PRINT_LIMITS[field]) setDraft(shown)
  }
  return <label className="print-field"><span>{names[field]} <small>{isExtrusion ? 'mm' : unit === 'metric' ? 'm' : 'ft'}</small></span><input type="number" min="0.001" max={isExtrusion ? PRINT_LIMITS[field] * 1000 : toDisplay(PRINT_LIMITS[field], unit)} step={isExtrusion ? '0.01' : '0.001'} value={draft} placeholder="Not set" onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }}/></label>
}

export function PrintPlanningPanel() {
  const body = useDesignStore(state => state.design.body)
  const unit = useDesignStore(state => state.view.unit)
  const setup = usePrintStore(state => state.setup)
  const showEnvelope = usePrintStore(state => state.showEnvelope)
  const setShowEnvelope = usePrintStore(state => state.setShowEnvelope)
  const clear = usePrintStore(state => state.clear)
  const notice = usePrintStore(state => state.notice)
  const result = checkPrintSetup(body, setup)
  return <section className="panel-section print-planning" aria-labelledby="print-planning-title">
    <h3 id="print-planning-title">Whole-shell fit <span>SINGLE PIECE</span></h3>
    <p>Enter usable machine space to check this shell as one piece. This does not divide it into printable parts.</p>
    <div className="print-fields">{(['buildLength', 'buildWidth', 'buildHeight', 'extrusionWidth'] as const).map(field => <PrintFieldControl key={field} field={field}/>)}</div>
    <div className={`print-status ${result.fits === false ? 'print-fail' : result.fits === true ? 'print-pass' : ''}`} role="status">{result.fits === null ? 'Enter all three usable dimensions to check one-piece fit.' : result.fits ? 'The one-piece shell fits by dimensions.' : 'The one-piece shell exceeds the box.'}</div>
    <ul className="print-axis-list">{result.axes.map(axis => <li key={axis.field} className={axis.fits === false ? 'print-fail' : axis.fits === true ? 'print-pass' : ''}><span>{axis.field[0].toUpperCase() + axis.field.slice(1)}</span><b>{formatLength(axis.shell, unit)} / {axis.usable === null ? 'not set' : formatLength(axis.usable, unit)}</b>{axis.remaining !== null && <small>{axis.remaining < 0 ? `Short by ${formatLength(-axis.remaining, unit)}` : `${formatLength(axis.remaining, unit)} spare`}</small>}</li>)}</ul>
    <p className="print-caveat">This compares the unrotated shell only. It excludes chassis and tongue, and does not assess supports or tool access. Splitting it would require a separate seam and joint plan.</p>
    <h4>Thickness sanity check</h4>
    {result.thickness ? <ul className="print-thickness-list">{result.thickness.map(item => <li key={item.field} className={item.meetsOneWidth ? 'print-pass' : 'print-fail'}><span>{item.field[0].toUpperCase() + item.field.slice(1)}</span><b>{Math.round(item.thickness * 1000)} mm</b><small>{item.widths.toFixed(1)} extrusion widths{item.meetsOneWidth ? '' : ' · below one width'}</small></li>)}</ul> : <p className="print-caveat">Enter an extrusion width to compare it with wall, roof, and floor thickness.</p>}
    <p className="print-caveat">One-width checks are illustrative and do not establish printability or strength.</p>
    <div className="print-actions"><label><input type="checkbox" checked={showEnvelope} onChange={event => setShowEnvelope(event.target.checked)}/> Show machine box</label><button type="button" onClick={clear}>Clear setup</button></div>
    <p className="print-caveat">Machine values are saved only in this browser, separately from design JSON.</p>
    {notice && <p className="print-storage-notice" role="alert">{notice}</p>}
  </section>
}
