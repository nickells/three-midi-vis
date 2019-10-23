import { notes, createBox } from './state'
const THREE = require('three')
import { scene, camera } from './index'

const clamp = (min, max, val) => Math.min(Math.max(val, min), max)


export function onNoteOn (note, velocity){
  // const boxVectorY = 1000 + ((velocity / 128 ) * 2000)
  // boxes[note].mesh.applyCentralImpulse(new THREE.Vector3(0, boxVectorY, 0))
  const newBox = createBox({
    onTime: performance.now(),
    active: true,
    placeholder: false,
  }, note)

  
  newBox.mesh.material.emissive = new THREE.Color().setHSL(((note % 12) / 12), 1, clamp(0.2, 0.8, velocity / 128))
  newBox.mesh.material.opacity = 1

  notes[note].unshift(newBox)
  newBox.mesh.position.set(newBox.initialPosition.x, newBox.initialPosition.y, newBox.initialPosition.z)
  scene.add(newBox.mesh)

  
  let newPosition = new THREE.Vector3(newBox.mesh.position.x, 200, 100)
  camera.position.lerp(newPosition, 0.2)
  camera.lookAt( newBox.mesh.position );
  
}

const SPEED = 3

function grow(box) {
  let length =  new THREE.Box3().setFromObject( box.mesh ).getSize().z
  
  const desiredLength = length + SPEED
  const scale = desiredLength / length
  
  box.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, scale ))
  box.mesh.position.z = (-desiredLength / 2)
}

function push(box) {
  box.mesh.translateZ(-1 * SPEED)
  // let length =  new THREE.Box3().setFromObject( box.mesh ).getSize().z
  // if (box.mesh.position.z + length < -600) scene.remove(box.mesh)
}

function reset(box) {
  let length =  new THREE.Box3().setFromObject( box.mesh ).getSize().z
  const desiredLength = 5
  const scale = desiredLength / length
  box.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, scale ))
  box.mesh.position.z = (box.initialPosition.z)
}

export function onNoteOff(midiNote) {
  const note = notes[midiNote]
  const lastNote = note[0]
  lastNote.offTime = performance.now()
  lastNote.active = false
  lastNote.mesh.material.opacity = 0.4
  if (note[64]) delete note[63]
}

export function tick(ms) {
  notes.forEach(boxes => {
    boxes.forEach(box => {
      if (!box) return
      if (box.placeholder) return
      if (box.active) grow(box)
      else push(box)
    })
  })
}