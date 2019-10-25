import { notes, placeholders, createBox } from './state'
const THREE = require('three')
import TWEEN from '@tweenjs/tween.js'

import { scene, camera } from './index'
import { speed, cameraPos } from './consts'

const clamp = (min, max, val) => Math.min(Math.max(val, min), max)


let lastAverage = 0
const updateCamera = () => {
  let positions = notes
    .map(row => row[0])
    .filter( box => box && box.active)
    .map(box => box.mesh.position.x)
    
  let averagePosition = (positions.reduce((sum, curr) => sum + curr, 0) / positions.length) || lastAverage
  let rangeModifier = Math.max((Math.max(...positions) - Math.min(...positions)) * 0.2, 0)
  lastAverage = averagePosition

  let y = cameraPos.y + rangeModifier
  let z = cameraPos.z + rangeModifier
  new TWEEN.Tween( camera.position )
    .to( new THREE.Vector3(averagePosition, y, z), 400 )
    .easing( TWEEN.Easing.Cubic.Out)
    .onUpdate( (val) => {
      camera.position.copy(val)
    })
    .start();

}

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
  updateCamera()
}


function grow(box) {
  let boxSize = new THREE.Vector3()
  new THREE.Box3().setFromObject( box.mesh ).getSize(boxSize)

  let length = boxSize.z

  const desiredLength = length + speed
  const scale = desiredLength / length

  box.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, scale ))
  box.mesh.position.z = (-desiredLength / 2)
}

function push(box) {
  box.mesh.translateZ(-1 * speed)
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
  updateCamera()
}

export function tick(ms) {
  TWEEN.update()
  notes.forEach(boxes => {
    boxes.forEach(box => {
      if (!box) return
      if (box.placeholder) return
      if (box.active) grow(box)
      else if (performance.now() - box.offTime > 5000) {
        scene.remove(box.mesh)
        boxes.pop()
      }
      else push(box)
    })
  })
}