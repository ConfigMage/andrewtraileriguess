import { describe, expect, it } from 'vitest'
import { createDesign } from './presets'
import { FEET } from './types'
import { formatLength, fromDisplay, toDisplay } from './units'
import { halfWidth, interiorFloorArea, openingBounds, roofY, wallTopY } from './profiles'
import { parseDesign, exportDesign } from './serialization'
import { ruleWarnings } from './rules'
import { updateBody, validateBody } from './validation'
import { useDesignStore } from '../store/designStore'
import { wallGeometry } from '../scene/geometry'

describe('canonical geometry and units', () => {
  it('round trips display units without changing meters and carries rounded inches', () => {
    const meters = 17.999 * FEET
    for (let i=0;i<100;i++) expect(fromDisplay(toDisplay(meters,'imperial'),'imperial')).toBeCloseTo(meters,12)
    expect(formatLength(11.999 * FEET,'imperial')).toBe('12 ft 0 in')
    expect(formatLength(2,'metric')).toBe('2.00 m')
  })
  it('keeps all profile envelopes bounded and gives distinct noses and roofs', () => {
    const d=createDesign(); const widths=[]
    for (const nose of ['flat','rounded','wedge','teardrop'] as const) { d.body.nose=nose; widths.push(halfWidth(d.body,0)); for(let x=0;x<=d.body.length;x+=0.1) expect(halfWidth(d.body,x)).toBeGreaterThan(0) }
    expect(new Set(widths.map(n=>n.toFixed(3))).size).toBe(4)
    const heights=[]
    for (const roof of ['flat','slightArch','rounded'] as const) { d.body.roof=roof; heights.push(wallTopY(d.body));expect(roofY(d.body,1,0)).toBe(d.body.height) }
    expect(new Set(heights.map(n=>n.toFixed(3))).size).toBe(3)
    expect(interiorFloorArea(d.body)).toBeGreaterThan(0)
  })
  it('omits passenger wall triangles inside a window cutout',()=>{
    const d=createDesign(),o=d.openings.find(item=>item.id==='window-b')!
    const g=wallGeometry(d,'passenger'),p=g.getAttribute('position'),box=openingBounds(d.body,o)
    let inside=0
    for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;if(x>box.x0+0.01&&x<box.x1-0.01&&y>box.y0+0.01&&y<box.y1-0.01)inside++}
    expect(inside).toBe(0);g.dispose()
  })
  it('rejects nonfinite, negative, and impossible dimensions', () => {
    const d=createDesign(); d.body.wall=-1;expect(validateBody(d.body).length).toBeGreaterThan(0)
    d.body.wall=NaN;expect(validateBody(d.body).length).toBeGreaterThan(0)
    expect(()=>updateBody(createDesign(),'width',0.01)).toThrow()
  })
})
describe('placement rules',()=>{
  const codes=(d:ReturnType<typeof createDesign>)=>ruleWarnings(d).map(w=>w.code)
  it('starts with a warning free Adventure concept',()=>{expect(codes(createDesign())).toEqual([])})
  it('uses the same floor and roof envelope as openings',()=>{
    const d=createDesign();const o=d.openings[0];o.y=-0.1;expect(openingBounds(d.body,o).y0).toBeLessThan(d.body.floorThickness);expect(codes(d)).toContain('BELOW_FLOOR')
    o.y=1.4;expect(codes(d)).toContain('ROOF_OVERFLOW')
  })
  it('detects boundary, overlap, spacing, and wheel zones',()=>{
    const d=createDesign();d.openings[0].x=-0.1;expect(codes(d)).toContain('BOUNDARY')
    d.openings[0].x=d.openings[1].x;d.openings[0].y=1;expect(codes(d)).toContain('OVERLAP')
    d.openings[0].x=d.openings[1].x+d.openings[1].width+0.04;expect(codes(d)).toContain('SPACING')
    d.openings[0].x=d.body.length*0.72-0.2;d.openings[0].y=0;expect(codes(d)).toContain('WHEEL_WELL')
  })
})
describe('design files and history',()=>{
  it('round trips and rejects malformed, unknown, oversized and duplicate ids',()=>{
    const d=createDesign();expect(parseDesign(exportDesign(d))).toEqual(d)
    expect(()=>parseDesign('{')).toThrow('Malformed JSON')
    expect(()=>parseDesign(JSON.stringify({...d,schemaVersion:2}))).toThrow('Unsupported schema')
    expect(()=>parseDesign(' '.repeat(1_000_001))).toThrow('1 MB')
    const bad=createDesign();bad.openings[1].id=bad.openings[0].id;expect(()=>parseDesign(JSON.stringify(bad))).toThrow('duplicate')
  })
  it('commits one gesture step, clears redo, and leaves state after invalid edit',()=>{
    const store=useDesignStore
    store.setState({design:createDesign(),past:[],future:[],gestureStart:null})
    const start=store.getState().design.body.length
    store.getState().beginGesture()
    store.getState().setBody('length',start+0.1,true)
    store.getState().setBody('length',start+0.2,true)
    store.getState().commitGesture()
    expect(store.getState().past).toHaveLength(1)
    store.getState().undo();expect(store.getState().design.body.length).toBe(start)
    store.getState().redo();expect(store.getState().design.body.length).toBeCloseTo(start+0.2)
    store.getState().undo();store.getState().setBody('length',start+0.3);expect(store.getState().future).toHaveLength(0)
    const current=store.getState().design;store.getState().setBody('length',Infinity);expect(store.getState().design).toBe(current)
  })
  it('makes replacement undoable and preserves state after invalid replacement',()=>{
    const store=useDesignStore;store.setState({design:createDesign(),past:[],future:[],gestureStart:null})
    const original=store.getState().design
    const replacement=createDesign('Replacement');store.getState().replace(replacement)
    expect(store.getState().design.metadata.name).toBe('Replacement')
    store.getState().undo();expect(store.getState().design.metadata.name).toBe(original.metadata.name)
    const stable=store.getState().design;const invalid=structuredClone(stable);invalid.body.length=Infinity
    store.getState().replace(invalid);expect(store.getState().design).toBe(stable)
  })
})
