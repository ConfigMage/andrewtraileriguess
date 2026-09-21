import * as THREE from 'three'
import { halfWidth, openingBounds, roofY, sideZ, wallTopY } from '../model/profiles'
import type { Body, Design, Side } from '../model/types'
type V = [number, number, number]
class Builder {
  vertices: number[] = []
  quad(a: V, b: V, c: V, d: V) { this.vertices.push(...a, ...b, ...c, ...a, ...c, ...d) }
  prism(a: V, b: V, c: V, d: V, e: V, f: V, g: V, h: V) {
    this.quad(a,b,c,d); this.quad(h,g,f,e); this.quad(e,f,b,a); this.quad(d,c,g,h); this.quad(a,d,h,e); this.quad(f,g,c,b)
  }
  build() { const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3)); geometry.computeVertexNormals(); return geometry }
}
const unique = (values: number[]) => [...new Set(values.filter(Number.isFinite).map(v => +v.toFixed(5)))].sort((a,b) => a-b)
function xCuts(body: Body, design: Design) {
  return unique([...Array.from({ length: 57 }, (_,i) => i * body.length / 56), ...design.openings.flatMap(o => [Math.max(0, Math.min(body.length, o.x)), Math.max(0, Math.min(body.length, o.x + o.width))])])
}
export function wallGeometry(design: Design, side: Side) {
  const { body } = design, builder = new Builder(), xs = xCuts(body, design)
  const bottom = body.floorThickness, top = wallTopY(body)
  const openings = design.openings.filter(o => o.side === side)
  const ys = unique([bottom, top, ...openings.flatMap(o => { const b = openingBounds(body,o); return [Math.max(bottom,Math.min(top,b.y0)),Math.max(bottom,Math.min(top,b.y1))] })])
  const solid=(i:number,j:number)=>{
    if(i<0||j<0||i>=xs.length-1||j>=ys.length-1)return false
    const xm=(xs[i]+xs[i+1])/2,ym=(ys[j]+ys[j+1])/2
    return !openings.some(o=>{const b=openingBounds(body,o);return xm>b.x0&&xm<b.x1&&ym>b.y0&&ym<b.y1})
  }
  for (let i=0;i<xs.length-1;i++) for(let j=0;j<ys.length-1;j++) {
    const x0=xs[i],x1=xs[i+1],y0=ys[j],y1=ys[j+1]
    if (x1-x0<1e-5 || y1-y0<1e-5) continue
    if(!solid(i,j))continue
    const z00=sideZ(body,side,x0),z10=sideZ(body,side,x1),zi0=sideZ(body,side,x0,body.wall),zi1=sideZ(body,side,x1,body.wall)
    const a:V=[x0,y0,z00],b:V=[x1,y0,z10],c:V=[x1,y1,z10],d:V=[x0,y1,z00],e:V=[x0,y0,zi0],f:V=[x1,y0,zi1],g:V=[x1,y1,zi1],h:V=[x0,y1,zi0]
    builder.quad(a,b,c,d);builder.quad(h,g,f,e)
    if(!solid(i,j-1))builder.quad(e,f,b,a)
    if(!solid(i,j+1))builder.quad(d,c,g,h)
    if(!solid(i-1,j))builder.quad(a,d,h,e)
    if(!solid(i+1,j))builder.quad(f,g,c,b)
  }
  return builder.build()
}
export function roofGeometry(design: Design) {
  const b=new Builder(), {body}=design, xs=xCuts(body,design), count=16, surfaces:{start:number;direction:number}[]=[]
  for(let i=0;i<xs.length-1;i++) for(let j=0;j<count;j++) {
    const x0=xs[i],x1=xs[i+1],u0=-1+2*j/count,u1=-1+2*(j+1)/count
    const z00=halfWidth(body,x0)*u0,z01=halfWidth(body,x0)*u1,z10=halfWidth(body,x1)*u0,z11=halfWidth(body,x1)*u1
    const a:V=[x0,roofY(body,x0,z00),z00],d:V=[x0,roofY(body,x0,z01),z01],b0:V=[x1,roofY(body,x1,z10),z10],c:V=[x1,roofY(body,x1,z11),z11]
    const e:V=[a[0],a[1]-body.roofThickness,a[2]],f:V=[b0[0],b0[1]-body.roofThickness,b0[2]],g:V=[c[0],c[1]-body.roofThickness,c[2]],h:V=[d[0],d[1]-body.roofThickness,d[2]]
    surfaces.push({start:b.vertices.length/3,direction:-1});b.quad(a,b0,c,d)
    surfaces.push({start:b.vertices.length/3,direction:1});b.quad(h,g,f,e)
    if(j===0)b.quad(e,f,b0,a)
    if(j===count-1)b.quad(d,c,g,h)
    if(i===0)b.quad(a,d,h,e)
    if(i===xs.length-2)b.quad(f,g,c,b0)
  }
  const geometry=b.build()
  const positions=geometry.getAttribute('position') as THREE.BufferAttribute
  const normals=geometry.getAttribute('normal') as THREE.BufferAttribute
  const rise=body.roof==='flat'?0:body.roof==='slightArch'?Math.min(0.1,body.height*0.04):Math.min(0.31,body.height*0.12)
  const power=body.roof==='rounded'?1.5:2
  for(const surface of surfaces)for(let k=0;k<6;k++){
    const idx=surface.start+k,x=positions.getX(idx),z=positions.getZ(idx),u=Math.max(-1,Math.min(1,z/halfWidth(body,x)))
    const slope=-rise*power*Math.sign(u)*Math.abs(u)**(power-1)/halfWidth(body,x),direction=surface.direction
    const normal=new THREE.Vector3(0,direction,-slope*direction).normalize();normals.setXYZ(idx,normal.x,normal.y,normal.z)
  }
  normals.needsUpdate=true
  return geometry
}
export function floorGeometry(design: Design) {
  const b=new Builder(),{body}=design,xs=xCuts(body,design)
  for(let i=0;i<xs.length-1;i++) {
    const x0=xs[i],x1=xs[i+1],w0=halfWidth(body,x0),w1=halfWidth(body,x1)
    const a:V=[x0,body.floorThickness,-w0],c:V=[x1,body.floorThickness,w1],b0:V=[x1,body.floorThickness,-w1],d:V=[x0,body.floorThickness,w0],e:V=[x0,0,-w0],f:V=[x1,0,-w1],g:V=[x1,0,w1],h:V=[x0,0,w0]
    b.quad(a,b0,c,d);b.quad(h,g,f,e);b.quad(e,f,b0,a);b.quad(d,c,g,h)
    if(i===0)b.quad(a,d,h,e)
    if(i===xs.length-2)b.quad(f,g,c,b0)
  }
  return b.build()
}
export function endGeometry(design: Design, front: boolean) {
  const b=new Builder(), {body}=design, x=front?0:body.length, dx=front?body.wall:-body.wall, steps=16
  for(let i=0;i<steps;i++) {
    const z0=halfWidth(body,x)*(-1+2*i/steps), z1=halfWidth(body,x)*(-1+2*(i+1)/steps)
    const top0=roofY(body,x,z0)-body.roofThickness,top1=roofY(body,x,z1)-body.roofThickness
    const a:V=[x,body.floorThickness,z0],b0:V=[x,body.floorThickness,z1],c:V=[x,top1,z1],d:V=[x,top0,z0],e:V=[x+dx,body.floorThickness,z0],f:V=[x+dx,body.floorThickness,z1],g:V=[x+dx,top1,z1],h:V=[x+dx,top0,z0]
    b.quad(a,b0,c,d);b.quad(h,g,f,e);b.quad(e,f,b0,a);b.quad(d,c,g,h)
    if(i===0)b.quad(a,d,h,e)
    if(i===steps-1)b.quad(f,g,c,b0)
  }
  return b.build()
}
export function sectionGeometry(design: Design, x: number) {
  const b=new Builder(), {body}=design, w=halfWidth(body,x), top=wallTopY(body), dx=0.009
  const slab=(z0:number,z1:number,y0:number,y1:number) => b.prism([x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],[x+dx,y0,z0],[x+dx,y0,z1],[x+dx,y1,z1],[x+dx,y1,z0])
  slab(-w,w,0,body.floorThickness)
  for(const side of ['driver','passenger'] as const) {
    const z=side==='driver'?-w:w, zi=side==='driver'?-w+body.wall:w-body.wall
    const holes=design.openings.filter(o=>o.side===side&&x>=o.x&&x<=o.x+o.width).map(o=>openingBounds(body,o)).sort((a,b)=>a.y0-b.y0)
    let start=body.floorThickness
    for(const hole of holes) { const y0=Math.max(start,Math.min(top,hole.y0)); if(y0>start) slab(Math.min(z,zi),Math.max(z,zi),start,y0); start=Math.max(start,Math.min(top,hole.y1)) }
    if(start<top) slab(Math.min(z,zi),Math.max(z,zi),start,top)
  }
  for(let i=0;i<16;i++) {
    const z0=w*(-1+2*i/16),z1=w*(-1+2*(i+1)/16),y0=roofY(body,x,z0),y1=roofY(body,x,z1)
    b.prism([x,y0-body.roofThickness,z0],[x,y1-body.roofThickness,z1],[x,y1,z1],[x,y0,z0],[x+dx,y0-body.roofThickness,z0],[x+dx,y1-body.roofThickness,z1],[x+dx,y1,z1],[x+dx,y0,z0])
  }
  return b.build()
}
