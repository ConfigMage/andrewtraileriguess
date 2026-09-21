import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { axlePositions } from '../model/rules'
import { checkPrintSetup } from '../model/printPlanning'
import { planPanels } from '../model/panelPlanning'
import { openingBounds, sideZ, wallTopY } from '../model/profiles'
import { formatLength } from '../model/units'
import type { Design, Opening, Side } from '../model/types'
import { useDesignStore, type ViewState } from '../store/designStore'
import { usePrintStore } from '../store/printStore'
import { endGeometry, floorGeometry, roofGeometry, sectionGeometry, wallGeometry } from './geometry'
import { PanelOverlay } from './PanelOverlay'

function useDisposableGeometry(factory: () => THREE.BufferGeometry, dependencies: readonly unknown[]) {
  const geometry = useMemo(factory, dependencies)
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}
function ShellPiece({ geometry, color, clip, opacity=1, emissive='#000000' }: { geometry: THREE.BufferGeometry; color: string; clip: THREE.Plane[]; opacity?: number; emissive?: string }) {
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} metalness={0.08} roughness={0.64} side={THREE.DoubleSide} transparent={opacity<1} opacity={opacity} clippingPlanes={clip} emissive={emissive} emissiveIntensity={0.08}/></mesh>
}
function OpeningFrame({ design, opening, selected, onSelect, clip, cut }: { design: Design; opening: Opening; selected: boolean; onSelect: () => void; clip: THREE.Plane[]; cut?: number }) {
  const b=openingBounds(design.body,opening), end=cut===undefined?b.x1:Math.min(b.x1,cut), z0=sideZ(design.body,opening.side,b.x0)+ (opening.side==='passenger'?0.01:-0.01), z1=sideZ(design.body,opening.side,end)+ (opening.side==='passenger'?0.01:-0.01)
  const color=selected?'#eab46c':opening.kind==='door'?'#38434a':'#34434c'
  const edges: [number,number,number][][] = [ [[b.x0,b.y0,z0],[end,b.y0,z1]],[[b.x0,b.y1,z0],[end,b.y1,z1]],[[b.x0,b.y0,z0],[b.x0,b.y1,z0]] ]
  if(end===b.x1)edges.push([[end,b.y0,z1],[end,b.y1,z1]])
  const midX=(b.x0+end)/2, midY=(b.y0+b.y1)/2, midZ=(z0+z1)/2
  return <group onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor=''}} onClick={e=>{e.stopPropagation();onSelect()}}>
    {edges.map((points,i)=><Line key={i} points={points as [number,number,number][]} color={color} lineWidth={selected?4:2} />)}
    <mesh position={[midX,midY,midZ]} onClick={e=>{e.stopPropagation();onSelect()}}><boxGeometry args={[Math.max(0.01,end-b.x0),opening.height,0.09]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
    {opening.kind==='door' && end-b.x0>0.25 && <mesh position={[end-0.12,b.y0+0.95,midZ+(opening.side==='passenger'?0.016:-0.016)]}><sphereGeometry args={[0.027,8,8]}/><meshStandardMaterial color="#d4a15e" clippingPlanes={clip}/></mesh>}
  </group>
}
function Pattern({ design, clip }: { design: Design; clip: THREE.Plane[] }) {
  const geometry=useDisposableGeometry(()=>{
    const {body}=design, coords:number[]=[]
    if(body.structure==='solid') return new THREE.BufferGeometry()
    const add=(x0:number,y0:number,x1:number,y1:number,side:Side)=>{
      const holes=design.openings.filter(o=>o.side===side).map(o=>openingBounds(body,o)), cuts=[0,1]
      for(const hole of holes){for(const x of [hole.x0,hole.x1])if(x1!==x0)cuts.push((x-x0)/(x1-x0));for(const y of [hole.y0,hole.y1])if(y1!==y0)cuts.push((y-y0)/(y1-y0))}
      const sorted=[...new Set(cuts.filter(t=>t>=0&&t<=1))].sort((a,b)=>a-b)
      for(let i=0;i<sorted.length-1;i++){
        const t0=sorted[i],t1=sorted[i+1],mid=(t0+t1)/2,xm=x0+(x1-x0)*mid,ym=y0+(y1-y0)*mid
        if(holes.some(h=>xm>h.x0&&xm<h.x1&&ym>h.y0&&ym<h.y1))continue
        const xa=x0+(x1-x0)*t0,xb=x0+(x1-x0)*t1,ya=y0+(y1-y0)*t0,yb=y0+(y1-y0)*t1
        coords.push(xa,ya,sideZ(body,side,xa,body.wall+0.004),xb,yb,sideZ(body,side,xb,body.wall+0.004))
      }
    }
    for(const side of ['driver','passenger'] as const) {
      const bottom=body.floorThickness+0.12, top=wallTopY(body)-0.12
      if(body.structure==='ribbed') for(let x=0.35;x<body.length;x+=0.42) add(x,bottom,x,top,side)
      if(body.structure==='lattice') for(let x=0.25;x<body.length;x+=0.55) for(let y=bottom;y<top;y+=0.5) {add(x,y,Math.min(body.length,x+0.5),Math.min(top,y+0.45),side);add(x,Math.min(top,y+0.45),Math.min(body.length,x+0.5),y,side)}
      if(body.structure==='honeycomb') for(let x=0.4;x<body.length;x+=0.55) for(let y=bottom+0.12;y<top-0.12;y+=0.43) {
        const r=0.19, points=Array.from({length:6},(_,k)=>[x+r*Math.cos(k*Math.PI/3),y+r*Math.sin(k*Math.PI/3)] as const)
        points.forEach((p,k)=>{const q=points[(k+1)%6];add(p[0],p[1],q[0],q[1],side)})
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));return g
  },[design.body,design.openings])
  if(design.body.structure==='solid') return null
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#b7884b" transparent opacity={0.8} clippingPlanes={clip}/></lineSegments>
}
function Chassis({ design, clip }: { design: Design; clip: THREE.Plane[] }) {
  const L=design.body.length,w=design.body.width, wheels=axlePositions(design)
  const steel=<meshStandardMaterial color="#2b3338" metalness={0.55} roughness={0.5} clippingPlanes={clip}/>
  return <group>
    {[-1,1].map(side=><mesh key={side} position={[L/2,-0.12,side*(w/2-0.26)]} castShadow><boxGeometry args={[L,0.12,0.1]}/>{steel}</mesh>)}
    {[0.25,L*0.33,L*0.66,L-0.2].map(x=><mesh key={x} position={[x,-0.13,0]}><boxGeometry args={[0.09,0.09,w-0.4]}/>{steel}</mesh>)}
    {[-1,1].map(side=><Line key={side} points={[[0,-0.12,side*(w/2-0.26)],[-1.08,-0.14,0]]} color="#505c60" lineWidth={5} />)}
    <mesh position={[-1.15,-0.14,0]}><boxGeometry args={[0.16,0.12,0.2]}/>{steel}</mesh>
    {wheels.flatMap((x,i)=>[-1,1].map(side=><group key={`well-${i}-${side}`} position={[x,-0.04,side*(w/2+0.012)]}>
      <mesh><circleGeometry args={[0.47,28,0,Math.PI]}/><meshStandardMaterial color="#303b3d" side={THREE.DoubleSide} clippingPlanes={clip}/></mesh>
      <mesh><torusGeometry args={[0.47,0.022,6,28,Math.PI]}/><meshStandardMaterial color="#a5aaa7" metalness={0.35} side={THREE.DoubleSide} clippingPlanes={clip}/></mesh>
    </group>))}
    {wheels.flatMap((x,i)=>[-1,1].map(side=><group key={`${i}-${side}`} position={[x,-0.04,side*(w/2+0.09)]} rotation={[Math.PI/2,0,0]}>
      <mesh castShadow><cylinderGeometry args={[0.38,0.38,0.16,24]}/><meshStandardMaterial color="#1d2428" roughness={0.9} clippingPlanes={clip}/></mesh>
      <mesh position={[0,0,side*0.084]}><cylinderGeometry args={[0.19,0.19,0.01,18]}/><meshStandardMaterial color="#849096" metalness={0.65} clippingPlanes={clip}/></mesh>
    </group>))}
  </group>
}
function DimensionLines({ design, unit }: { design: Design; unit: ViewState['unit'] }) {
  const {body}=design,w=body.width/2,L=body.length,h=body.height
  const color='#d9a45e'
  return <group>
    <Line points={[[0,-0.42,w+0.38],[L,-0.42,w+0.38]]} color={color} lineWidth={1}/>
    <Html position={[L/2,-0.42,w+0.4]} center className="dimension-tag">BODY {formatLength(L,unit)}</Html>
    <Line points={[[L+0.3,0,w],[L+0.3,h,w]]} color={color} lineWidth={1}/>
    <Html position={[L+0.3,h/2,w]} center className="dimension-tag">{formatLength(h,unit)}</Html>
    <Line points={[[L+0.25,-0.36,-w],[L+0.25,-0.36,w]]} color={color} lineWidth={1}/>
    <Html position={[L+0.26,-0.35,0]} center className="dimension-tag">{formatLength(body.width,unit)}</Html>
  </group>
}
function BuildEnvelope({ length, width, height, fits }: { length: number; width: number; height: number; fits: boolean }) {
  const geometry = useDisposableGeometry(() => {
    const box = new THREE.BoxGeometry(length, height, width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [length, width, height])
  return <group position={[length / 2, height / 2, 0]}>
    <lineSegments geometry={geometry} renderOrder={10}><lineBasicMaterial color={fits ? '#29865f' : '#bb6543'} depthTest={false} transparent opacity={0.9}/></lineSegments>
  </group>
}
function CameraRig({ cameraName, design }: { cameraName: string; design: Design }) {
  const {camera}=useThree(),controls=useRef<OrbitControlsImpl>(null)
  useEffect(()=>{
    const L=design.body.length, center=new THREE.Vector3(L/2,design.body.clearance+design.body.height/2,0)
    const distance=Math.max(7,L*1.55)
    const offsets: Record<string,[number,number,number]>={Perspective:[distance*0.75,distance*0.48,distance], Fit:[distance*0.75,distance*0.48,distance], 'Driver side':[0,0,-distance], 'Passenger side':[0,0,distance], Front:[-distance,0,0], Rear:[distance,0,0], Top:[0,distance,0]}
    const offset=offsets[cameraName]??offsets.Perspective
    camera.position.set(center.x+offset[0],center.y+offset[1],center.z+offset[2]);camera.lookAt(center)
    if(controls.current) { controls.current.target.copy(center);controls.current.update() }
  },[cameraName,design.body.length,design.body.width,design.body.height,design.body.clearance,camera])
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.12} minDistance={2} maxDistance={60} screenSpacePanning />
}
function World({ design, view, selectedId, select }: { design: Design; view: ViewState; selectedId: string|null; select:(id:string|null)=>void }) {
  const setup=usePrintStore(state=>state.setup),showEnvelope=usePrintStore(state=>state.showEnvelope),showSeams=usePrintStore(state=>state.showSeams),selectedPanel=usePrintStore(state=>state.selectedPanel)
  const plan=useMemo(()=>planPanels(design,setup),[design,setup])
  const fit=checkPrintSetup(design.body,setup)
  const cut=Math.max(0.001,Math.min(design.body.length-0.001,design.body.length*view.sectionAt))
  const clip=useMemo(()=>view.section?[new THREE.Plane(new THREE.Vector3(-1,0,0),cut)]:[],[cut,view.section])
  const driver=useDisposableGeometry(()=>wallGeometry(design,'driver'),[design.body,design.openings])
  const passenger=useDisposableGeometry(()=>wallGeometry(design,'passenger'),[design.body,design.openings])
  const roof=useDisposableGeometry(()=>roofGeometry(design),[design.body,design.openings])
  const floor=useDisposableGeometry(()=>floorGeometry(design),[design.body,design.openings])
  const front=useDisposableGeometry(()=>endGeometry(design,true),[design.body])
  const rear=useDisposableGeometry(()=>endGeometry(design,false),[design.body])
  const section=useDisposableGeometry(()=>sectionGeometry(design,cut),[design.body,design.openings,cut])
  return <>
    <color attach="background" args={['#e5e7e4']}/>
    <ambientLight intensity={1.35}/><directionalLight position={[2,9,7]} intensity={2.4} castShadow={!view.section} shadow-bias={-0.0005} shadow-normalBias={0.02} shadow-mapSize={[2048,2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12}/>
    <directionalLight position={[-5,3,-8]} intensity={0.7}/>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[design.body.length/2,-0.002,0]}><planeGeometry args={[80,80]}/><meshStandardMaterial color="#dadcd7" roughness={0.98}/></mesh>
    {view.grid&&<Grid position={[design.body.length/2,0.001,0]} args={[60,60]} cellSize={0.5} sectionSize={2} cellColor="#adb7b4" sectionColor="#859590" fadeDistance={35} infiniteGrid />}
    <group position={[0,design.body.clearance,0]}>
      {showEnvelope&&fit.fits!==null&&<BuildEnvelope length={setup.buildLength!} width={setup.buildWidth!} height={setup.buildHeight!} fits={fit.fits}/>}
      {view.chassis&&<Chassis design={design} clip={clip}/>}
      <group onClick={e=>{e.stopPropagation();select(null)}}>
        <ShellPiece geometry={driver} color={design.material.color} clip={clip} opacity={view.transparent?0.28:1}/>
        <ShellPiece geometry={passenger} color={design.material.color} clip={clip} opacity={view.transparent?0.28:1}/>
        <ShellPiece geometry={roof} color="#f1f3ef" clip={clip} opacity={view.transparent?0.35:1}/>
        <ShellPiece geometry={floor} color="#707e7d" clip={clip} opacity={view.transparent?0.35:1}/>
        <ShellPiece geometry={front} color={design.material.color} clip={clip} opacity={view.transparent?0.28:1}/>
        <ShellPiece geometry={rear} color={design.material.color} clip={clip} opacity={view.transparent?0.28:1}/>
      </group>
      {view.section&&<ShellPiece geometry={section} color="#ca995c" clip={[]} emissive="#e2af6e"/>}
      {view.structure&&(view.section||view.transparent)&&<Pattern design={design} clip={clip}/>}
      {design.openings.filter(o=>!view.section||o.x<cut).map(o=><OpeningFrame key={o.id} design={design} opening={o} selected={o.id===selectedId} onSelect={()=>select(o.id)} clip={clip} cut={view.section?cut:undefined}/>)}
      {showSeams&&<PanelOverlay body={design.body} plan={plan} selectedIndex={selectedPanel} clip={clip} source={{ 'passenger wall': passenger, 'driver wall': driver, roof, floor, 'front end': front, 'rear end': rear }}/>}
      {view.dimensions&&<DimensionLines design={design} unit={view.unit}/>}
    </group>
    <CameraRig cameraName={view.camera} design={design}/>
  </>
}
export function TrailerScene() {
  const design=useDesignStore(s=>s.design),view=useDesignStore(s=>s.view),selectedId=useDesignStore(s=>s.selectedId),select=useDesignStore(s=>s.setSelected)
  return <Canvas shadows gl={{ antialias: true, localClippingEnabled: true }} camera={{ position: [8,6,10], fov: 42, near: 0.05, far: 200 }} onPointerMissed={()=>select(null)}><World design={design} view={view} selectedId={selectedId} select={select}/></Canvas>
}
