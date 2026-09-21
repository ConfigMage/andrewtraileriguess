import { useEffect, useRef, useState } from 'react'
import { TrailerScene } from './scene/TrailerScene'
import { PrintPlanningPanel } from './PrintPlanningPanel'
import { useDesignStore } from './store/designStore'
import { LIMITS, TONGUE_LENGTH, type Opening } from './model/types'
import { formatArea, formatLength, fromDisplay, toDisplay } from './model/units'
import { interiorFloorArea } from './model/profiles'
import { ruleWarnings } from './model/rules'
import { createDesign, preset } from './model/presets'
import { exportDesign, parseDesign } from './model/serialization'

const labels: Record<keyof typeof LIMITS,string>={length:'Body length',width:'Body width',height:'Body height',clearance:'Ground clearance',wall:'Wall thickness',roofThickness:'Roof thickness',floorThickness:'Floor thickness'}
const profileNames: Record<string,string>={flat:'Flat',rounded:'Rounded',wedge:'Wedge',teardrop:'Teardrop inspired',slightArch:'Slight arch',solid:'Solid',ribbed:'Ribbed',honeycomb:'Honeycomb',lattice:'Lattice'}
function Numeric({ value, min, max, step, onChange, onPreview, onGesture }: { value:number; min:number; max:number; step:number; onChange:(v:number)=>void; onPreview?:(v:number)=>void; onGesture?: {begin:()=>void;commit:()=>void} }) {
  const [draft,setDraft]=useState(String(+value.toFixed(3)))
  useEffect(()=>setDraft(String(+value.toFixed(3))),[value])
  const commit=()=>{const n=Number(draft);if(Number.isFinite(n)&&n>=min&&n<=max)onChange(n);else{setDraft(String(+value.toFixed(3)));useDesignStore.getState().setNotice(`Value must be between ${+min.toFixed(3)} and ${+max.toFixed(3)}.`)}}
  return <div className="numeric-row"><input type="range" aria-label="Adjust value" min={min} max={max} step={step} value={Math.min(max,Math.max(min,value))} onPointerDown={()=>onGesture?.begin()} onPointerUp={()=>onGesture?.commit()} onPointerCancel={()=>onGesture?.commit()} onChange={e=>{const n=Number(e.target.value);if(onPreview)onPreview(n);else onChange(n)}}/><input className="number-input" aria-label="Exact value" type="number" min={min} max={max} step={step} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/></div>
}
function DimensionControl({ field }: { field:keyof typeof LIMITS }) {
  const body=useDesignStore(s=>s.design.body),unit=useDesignStore(s=>s.view.unit),setBody=useDesignStore(s=>s.setBody),begin=useDesignStore(s=>s.beginGesture),commit=useDesignStore(s=>s.commitGesture)
  const display=toDisplay(body[field],unit),[min,max]=LIMITS[field],small=['wall','roofThickness','floorThickness'].includes(field)
  const unitLabel=small?'mm':unit==='imperial'?'ft':'m'
  const shown=small?body[field]*1000:display
  const low=small?min*1000:toDisplay(min,unit), high=small?max*1000:toDisplay(max,unit)
  const convert=(v:number)=>small?v/1000:fromDisplay(v,unit)
  return <label className="control"><span>{labels[field]} <small>{unitLabel}</small></span><Numeric value={shown} min={low} max={high} step={small?1:0.001} onChange={v=>setBody(field,convert(v))} onPreview={v=>setBody(field,convert(v),true)} onGesture={{begin,commit}}/></label>
}
function SelectControl<T extends string>({ label, value, options, onChange }: { label:string;value:T;options:T[];onChange:(v:T)=>void }) {return <label className="select-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value as T)}>{options.map(o=><option key={o} value={o}>{profileNames[o]??o}</option>)}</select></label>}
function OpeningEditor({ opening }: { opening:Opening }) {
  const update=useDesignStore(s=>s.updateOpening),duplicate=useDesignStore(s=>s.duplicateOpening),remove=useDesignStore(s=>s.deleteOpening),begin=useDesignStore(s=>s.beginGesture),commit=useDesignStore(s=>s.commitGesture),unit=useDesignStore(s=>s.view.unit),body=useDesignStore(s=>s.design.body)
  const editNumber=(key:'x'|'y'|'width'|'height', preview=false)=>(v:number)=>update(opening.id,{[key]:fromDisplay(v,unit)},preview)
  const range=(key:'x'|'y'|'width'|'height')=> key==='x'?[0,toDisplay(body.length,unit)]:key==='y'?[-0.5,toDisplay(body.height,unit)]:[toDisplay(0.3,unit),toDisplay(key==='height'?2.5:2,unit)]
  return <div className="opening-editor"><div className="inspector-title"><strong>{opening.kind==='door'?'Entry door':'Window'}</strong><span>{opening.id}</span></div>
    <SelectControl label="Side" value={opening.side} options={['driver','passenger']} onChange={v=>update(opening.id,{side:v})}/>
    {(['x','y','width','height'] as const).filter(key=>opening.kind==='window'||key!=='y').map(key=>{const [min,max]=range(key);return <label className="control" key={key}><span>{key==='x'?'From front':key==='y'?'Above floor':key[0].toUpperCase()+key.slice(1)} <small>{unit==='imperial'?'ft':'m'}</small></span><Numeric value={toDisplay(opening[key],unit)} min={min} max={max} step={0.02} onChange={editNumber(key)} onPreview={editNumber(key,true)} onGesture={{begin,commit}}/></label>})}
    <div className="button-row"><button onClick={()=>duplicate(opening.id)}>Duplicate</button><button className="danger" onClick={()=>remove(opening.id)}>Delete</button></div>
  </div>
}
function AppToolbar() {
  const design=useDesignStore(s=>s.design),view=useDesignStore(s=>s.view),setView=useDesignStore(s=>s.setView),undo=useDesignStore(s=>s.undo),redo=useDesignStore(s=>s.redo),past=useDesignStore(s=>s.past),future=useDesignStore(s=>s.future),replace=useDesignStore(s=>s.replace),setNotice=useDesignStore(s=>s.setNotice),save=useDesignStore(s=>s.saveNamed),load=useDesignStore(s=>s.loadNamed),list=useDesignStore(s=>s.listSaves)
  const file=useRef<HTMLInputElement>(null),[saveName,setSaveName]=useState(''),[saved,setSaved]=useState(''),[revision,setRevision]=useState(0)
  const download=()=>{const blob=new Blob([exportDesign(design)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${design.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'trailer-design'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  const importFile=async(file:File)=>{try{if(file.size>1_000_000)throw new Error('Design file exceeds 1 MB');const candidate=parseDesign(await file.text());replace(candidate);setNotice(`Imported ${candidate.metadata.name}.`)}catch(error){setNotice(`Import failed. Current design kept. ${String(error)}`)}}
  const names=list()
  return <header className="toolbar"><div className="brand"><span className="brand-mark">T<span>∕</span>L</span><span><b>TRAILER DESIGN LAB</b><small>CONCEPT WORKSPACE</small></span></div>
    <div className="toolbar-main"><select aria-label="Load preset" value="" onChange={e=>{if(e.target.value)replace(preset(e.target.value as Parameters<typeof preset>[0]))}}><option value="">Presets</option>{['Compact 12 ft','Adventure 16 ft','Family 20 ft','Blank / Custom 18 ft'].map(n=><option key={n}>{n}</option>)}</select>
      <button title="New blank design" onClick={()=>replace(preset('Blank / Custom 18 ft'))}>New</button><button title="Reset Adventure Prototype" onClick={()=>replace(createDesign())}>Reset</button>
      <span className="separator"/><button title="Undo (Ctrl or Cmd + Z)" disabled={!past.length} onClick={undo}>↶ Undo</button><button title="Redo (Ctrl or Cmd + Shift + Z)" disabled={!future.length} onClick={redo}>↷ Redo</button>
      <span className="separator"/><button className={view.section?'active':''} onClick={()=>setView({section:!view.section})}>▦ SECTION VIEW</button>
      <span className="separator"/><select aria-label="Display units" value={view.unit} onChange={e=>setView({unit:e.target.value as 'imperial'|'metric'})}><option value="imperial">Imperial</option><option value="metric">Metric</option></select>
      <button onClick={download}>Export JSON</button><button onClick={()=>file.current?.click()}>Import</button><input ref={file} className="hidden" type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);e.target.value=''}} />
    </div><details className="save-menu"><summary>Local saves</summary><div className="save-popover"><label>Save current design<input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="Design name"/></label><button onClick={()=>{save(saveName||design.metadata.name);setRevision(revision+1)}}>Save</button><label>Load saved design<select value={saved} onChange={e=>setSaved(e.target.value)}><option value="">Choose a save</option>{names.map(n=><option key={n}>{n}</option>)}</select></label><button disabled={!saved} onClick={()=>load(saved)}>Load</button></div></details>
  </header>
}
function LeftPanel({ tabletOpen }: { tabletOpen:boolean }) {
  const design=useDesignStore(s=>s.design),edit=useDesignStore(s=>s.edit)
  return <aside className={`left-panel panel ${tabletOpen?'tablet-open':''}`}><div className="panel-heading"><small>01 / GEOMETRY</small><h2>Body parameters</h2><p>Exterior dimensions. All values are concept limits.</p></div>
    <div className="panel-scroll"><div className="panel-section"><h3>Envelope</h3>{(Object.keys(LIMITS) as (keyof typeof LIMITS)[]).map(field=><DimensionControl key={field} field={field}/>)}</div>
      <div className="panel-section"><h3>Shape</h3><SelectControl label="Nose profile" value={design.body.nose} options={['flat','rounded','wedge','teardrop']} onChange={v=>useDesignStore.getState().setBody('nose',v)}/><SelectControl label="Roof profile" value={design.body.roof} options={['flat','slightArch','rounded']} onChange={v=>useDesignStore.getState().setBody('roof',v)}/><SelectControl label="Wall structure" value={design.body.structure} options={['solid','ribbed','honeycomb','lattice']} onChange={v=>useDesignStore.getState().setBody('structure',v)}/><SelectControl label="Axles" value={design.chassis.axles} options={['single','tandem']} onChange={v=>edit(d=>({...d,chassis:{axles:v}}))}/></div>
      <div className="panel-section"><h3>Finish</h3><label className="select-control"><span>Shell color</span><input type="color" value={design.material.color} onChange={e=>edit(d=>({...d,material:{color:e.target.value}}))}/></label></div>
    </div></aside>
}
function RightPanel({ tabletOpen }: { tabletOpen:boolean }) {
  const design=useDesignStore(s=>s.design),selectedId=useDesignStore(s=>s.selectedId),select=useDesignStore(s=>s.setSelected),add=useDesignStore(s=>s.addOpening),edit=useDesignStore(s=>s.edit)
  const selected=design.openings.find(o=>o.id===selectedId),warnings=ruleWarnings(design)
  return <aside className={`right-panel panel ${tabletOpen?'tablet-open':''}`}><div className="panel-heading"><small>02 / COMPONENTS</small><h2>Openings &amp; print fit</h2><p>Check one-piece shell fit or choose an opening to edit.</p></div><div className="panel-scroll">
    <PrintPlanningPanel/><div className="panel-section"><h3>Openings <span>{design.openings.length}</span></h3><div className="button-row"><button onClick={()=>add('door','passenger')}>+ Entry door</button><button onClick={()=>add('window','passenger')}>+ Window</button></div><div className="opening-list">{design.openings.map(o=><button className={selectedId===o.id?'selected':''} key={o.id} onClick={()=>select(o.id)}><span>{o.kind==='door'?'▣':'□'} {o.kind==='door'?'Door':'Window'}</span><small>{o.side} · {o.x.toFixed(2)} m</small></button>)}{!design.openings.length&&<p>No openings yet.</p>}</div></div>
    {selected&&<div className="panel-section"><OpeningEditor opening={selected}/></div>}
    <div className="panel-section"><h3>Placement review <span>{warnings.length}</span></h3>{warnings.length?warnings.map((w,i)=><button className="warning" key={`${w.code}-${i}`} onClick={()=>select(w.openingIds[0]??null)}><b>{w.code.replaceAll('_',' ')}</b><span>{w.message}</span></button>):<p className="clear-status">✓ No current placement warnings</p>}<p className="fine-print">These are configurable design checks, not validated safety rules.</p></div>
    <details className="panel-section rules-details"><summary>Concept rule assumptions</summary>{(['minimumOpeningSpacing','wheelWellClearance','minimumWallThickness','maximumWallThickness'] as const).map(key=><label className="rule-field" key={key}><span>{key.replace(/([A-Z])/g,' $1')} (mm)</span><input type="number" min="0" max="1000" step="1" value={Math.round(design.designRules[key]*1000)} onChange={e=>{const value=Number(e.target.value)/1000;edit(d=>({...d,designRules:{...d.designRules,[key]:value}}))}}/></label>)}</details>
  </div></aside>
}
function Viewport() {
  const design=useDesignStore(s=>s.design),view=useDesignStore(s=>s.view),setView=useDesignStore(s=>s.setView)
  const [webgl]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}})
  return <main className="viewport"><div className="viewport-bar"><div><span className="status-dot"/> LIVE MODEL <span className="viewport-label">/ {design.metadata.name}</span></div><div className="viewport-meta">PROCEDURAL SHELL · METERS INTERNAL</div></div>
    <div className="scene-shell">{webgl?<TrailerScene/>:<div className="webgl-fallback">WebGL is unavailable. Geometry controls, warnings, local saves, and JSON files remain available.</div>}
      <div className="camera-controls" aria-label="Camera views">{['Perspective','Driver side','Passenger side','Front','Rear','Top','Fit'].map(name=><button key={name} className={view.camera===name?'active':''} onClick={()=>setView({camera:name})} title={`${name} camera`}>{name}</button>)}</div>
      <div className="view-options">{(['chassis','dimensions','grid','transparent','structure'] as const).map(key=><label key={key}><input type="checkbox" checked={view[key]} onChange={e=>setView({[key]:e.target.checked})}/>{key[0].toUpperCase()+key.slice(1)}</label>)}</div>
      <div className="orientation">FRONT <span>← X →</span> REAR</div>
    </div>
    <div className={`section-control ${view.section?'shown':''}`}><div><strong>SECTION VIEW</strong><span>Front to rear · {Math.round(view.sectionAt*100)}%</span></div><input aria-label="Section position" type="range" min="0" max="100" value={view.sectionAt*100} onChange={e=>setView({sectionAt:Number(e.target.value)/100,section:true})}/><small>0% FRONT <span>100% REAR</span></small><div className="section-legend"><span>Cut surfaces: wall {Math.round(design.body.wall*1000)} mm</span><span>Roof {Math.round(design.body.roofThickness*1000)} mm</span><span>Floor {Math.round(design.body.floorThickness*1000)} mm</span><span>{design.body.structure} concept pattern</span></div></div>
    <div className="measurements"><div><small>BODY LENGTH</small><b>{formatLength(design.body.length,view.unit)}</b></div><div><small>OVERALL WITH TONGUE</small><b>{formatLength(design.body.length+TONGUE_LENGTH,view.unit)}</b></div><div><small>BODY WIDTH</small><b>{formatLength(design.body.width,view.unit)}</b></div><div><small>OVERALL WIDTH WITH WHEELS</small><b>{formatLength(design.body.width+0.34,view.unit)}</b></div><div><small>BODY HEIGHT</small><b>{formatLength(design.body.height,view.unit)}</b></div><div><small>INTERIOR FLOOR AREA</small><b>≈ {formatArea(interiorFloorArea(design.body),view.unit)}</b></div><div><small>WALL / STRUCTURE</small><b>{Math.round(design.body.wall*1000)} mm · {design.body.structure}</b></div><div><small>OPENINGS</small><b>{design.openings.filter(o=>o.kind==='door').length} doors · {design.openings.filter(o=>o.kind==='window').length} windows</b></div></div>
  </main>
}
export function App() {
  const notice=useDesignStore(s=>s.notice),undo=useDesignStore(s=>s.undo),redo=useDesignStore(s=>s.redo)
  const [tabletPanel,setTabletPanel]=useState<'none'|'geometry'|'openings'>('none')
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const target=e.target as HTMLElement|null;if(target?.closest('input,textarea,select,[contenteditable="true"]'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo()}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[undo,redo])
  return <div className="app"><AppToolbar/><div className="tablet-panel-tabs"><button className={tabletPanel==='geometry'?'active':''} aria-expanded={tabletPanel==='geometry'} onClick={()=>setTabletPanel(tabletPanel==='geometry'?'none':'geometry')}>Body parameters</button><button className={tabletPanel==='openings'?'active':''} aria-expanded={tabletPanel==='openings'} onClick={()=>setTabletPanel(tabletPanel==='openings'?'none':'openings')}>Openings &amp; fit</button></div><div className="workspace"><LeftPanel tabletOpen={tabletPanel==='geometry'}/><Viewport/><RightPanel tabletOpen={tabletPanel==='openings'}/></div><footer className="app-footer"><span>TRAILER DESIGN LAB / CONCEPT EXPLORATION</span><span>Ground clearance = ground to underside of body floor · No engineering validation</span></footer>{notice&&<div className="notice" role="status"><span>{notice}</span><button onClick={()=>useDesignStore.getState().setNotice('')} aria-label="Dismiss message">×</button></div>}</div>
}
