import { useEffect, useMemo, useState } from 'react'
import { planPanels, type PanelSurface } from './model/panelPlanning'
import { checkPrintSetup, PRINT_LIMITS, type PrintField } from './model/printPlanning'
import { formatLength, fromDisplay, toDisplay } from './model/units'
import { useDesignStore } from './store/designStore'
import { usePrintStore } from './store/printStore'

const names: Record<PrintField, string> = {
  buildLength: 'Usable length', buildWidth: 'Usable width', buildHeight: 'Usable height', extrusionWidth: 'Extrusion width',
}
const families: PanelSurface[] = ['passenger wall', 'driver wall', 'roof', 'floor', 'front end', 'rear end']

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
  const design = useDesignStore(state => state.design)
  const unit = useDesignStore(state => state.view.unit)
  const setup = usePrintStore(state => state.setup)
  const showEnvelope = usePrintStore(state => state.showEnvelope)
  const setShowEnvelope = usePrintStore(state => state.setShowEnvelope)
  const showSeams = usePrintStore(state => state.showSeams)
  const setShowSeams = usePrintStore(state => state.setShowSeams)
  const selectedPanel = usePrintStore(state => state.selectedPanel)
  const setSelectedPanel = usePrintStore(state => state.setSelectedPanel)
  const clear = usePrintStore(state => state.clear)
  const notice = usePrintStore(state => state.notice)
  const result = checkPrintSetup(design.body, setup)
  const plan = useMemo(() => planPanels(design, setup), [design, setup])
  const index = Math.min(selectedPanel, Math.max(0, plan.panels.length - 1))
  const panel = plan.panels[index]
  const size = panel && { length: panel.bounds.x1 - panel.bounds.x0, width: panel.bounds.z1 - panel.bounds.z0, height: panel.bounds.y1 - panel.bounds.y0 }
  return <section className="panel-section print-planning" aria-labelledby="print-planning-title">
    <h3 id="print-planning-title">Print setup <span>CONCEPT PLAN</span></h3>
    <p>Enter your machine's usable space. The plan divides the shell surfaces into sections within that box.</p>
    <div className="print-fields">{(['buildLength', 'buildWidth', 'buildHeight', 'extrusionWidth'] as const).map(field => <PrintFieldControl key={field} field={field}/>)}</div>
    <div className={`print-status ${plan.status === 'blocked' ? 'print-fail' : plan.status === 'ready' ? 'print-pass' : ''}`} role="status">{plan.status === 'ready' ? `${plan.panels.length.toLocaleString()} planned shell sections` : plan.reason}</div>
    {plan.status === 'ready' && <>
      <div className="panel-counts">{families.map(family => <button type="button" key={family} disabled={plan.counts[family] === 0} onClick={() => setSelectedPanel(plan.panels.findIndex(panel => panel.surface === family))}><span>{family}</span><b>{plan.counts[family]}</b></button>)}</div>
      <div className="panel-select"><button type="button" disabled={index <= 0} onClick={() => setSelectedPanel(index - 1)} aria-label="Previous section">‹</button><label>Section <input type="number" min="1" max={plan.panels.length} value={index + 1} onChange={event => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= plan.panels.length) setSelectedPanel(next - 1) }}/></label><span>of {plan.panels.length.toLocaleString()}</span><button type="button" disabled={index >= plan.panels.length - 1} onClick={() => setSelectedPanel(index + 1)} aria-label="Next section">›</button></div>
      {panel && size && <div className="panel-detail"><b>{panel.id}</b><span>{panel.surface}</span><small>Envelope: {formatLength(size.length, unit)} L × {formatLength(size.width, unit)} W × {formatLength(size.height, unit)} H</small><small>From front: {formatLength(panel.bounds.x0, unit)} to {formatLength(panel.bounds.x1, unit)}</small></div>}
      <label className="panel-toggle"><input type="checkbox" checked={showSeams} onChange={event => setShowSeams(event.target.checked)}/> Show seams and selected section</label>
      {plan.openingConflicts.length > 0 && <p className="panel-warning" role="status">{plan.openingConflicts.length} opening{plan.openingConflicts.length === 1 ? '' : 's'} intersect planned cut lines: {plan.openingConflicts.join(', ')}. Review framing and joints.</p>}
    </>}
    <p className="print-caveat">Sections are a visual cut plan with bounding boxes. They are not separate printable solids. Joints, allowances, supports, and strength have not been designed or validated.</p>
    <details className="print-fit-details"><summary>Whole-shell fit and thickness checks</summary>
      <div className={`print-status ${result.fits === false ? 'print-fail' : result.fits === true ? 'print-pass' : ''}`} role="status">{result.fits === null ? 'Enter all three usable dimensions to check one-piece fit.' : result.fits ? 'The one-piece shell fits by dimensions.' : 'The one-piece shell exceeds the box.'}</div>
      <ul className="print-axis-list">{result.axes.map(axis => <li key={axis.field} className={axis.fits === false ? 'print-fail' : axis.fits === true ? 'print-pass' : ''}><span>{axis.field[0].toUpperCase() + axis.field.slice(1)}</span><b>{formatLength(axis.shell, unit)} / {axis.usable === null ? 'not set' : formatLength(axis.usable, unit)}</b>{axis.remaining !== null && <small>{axis.remaining < 0 ? `Short by ${formatLength(-axis.remaining, unit)}` : `${formatLength(axis.remaining, unit)} spare`}</small>}</li>)}</ul>
      <h4>Thickness sanity check</h4>
      {result.thickness ? <ul className="print-thickness-list">{result.thickness.map(item => <li key={item.field} className={item.meetsOneWidth ? 'print-pass' : 'print-fail'}><span>{item.field[0].toUpperCase() + item.field.slice(1)}</span><b>{Math.round(item.thickness * 1000)} mm</b><small>{item.widths.toFixed(1)} extrusion widths{item.meetsOneWidth ? '' : ' · below one width'}</small></li>)}</ul> : <p className="print-caveat">Enter an extrusion width to compare it with wall, roof, and floor thickness.</p>}
      <p className="print-caveat">One-width checks are illustrative and do not establish printability or strength.</p>
    </details>
    <div className="print-actions"><label><input type="checkbox" checked={showEnvelope} onChange={event => setShowEnvelope(event.target.checked)}/> Show machine box</label><button type="button" onClick={clear}>Clear setup</button></div>
    <p className="print-caveat">Machine values are saved only in this browser, separately from design JSON.</p>
    {notice && <p className="print-storage-notice" role="alert">{notice}</p>}
  </section>
}
