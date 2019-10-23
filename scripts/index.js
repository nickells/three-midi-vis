const THREE = require('three');
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

var OrbitControls = require('three-orbit-controls')(THREE)

import Physijs from 'physijs-webpack';
import PhysijsWorker from 'physijs-webpack/physijs_worker';


let boxes = []
let notes = []

const directionalImpulse = () => 1 - (Math.random() * 2)

function isMidiNoteBlack(num){
  const keys = [0,1,0,1,0,0,1,0,1,0,1,0]
  let idx = (num + 12) % 12
  return !!keys[idx]
}

function onMIDIMessage( event ) {
  const [something, note, velocity] = event.data
  if (velocity === 0) {
    if (notes[note] === true) {
      onNoteOff(note)
      notes[note] = false
    }
  }
  else {
    if (note === 1) return
    if (notes[note] === undefined || notes[note] === false) {
      onNoteOn(note, velocity)
      notes[note] = true
    }
  }
}


async function listen(){
  let midiAccess = await navigator.requestMIDIAccess( { sysex: true } )
  midiAccess.inputs.forEach(entry => {
    entry.onmidimessage = onMIDIMessage
  });
  
}

listen()

var friction = 0.8; // high friction
var restitution = 0.2; // low restitution



let initScene, render, renderer, scene, camera, box, floor, composer;



const distance = 1
function onNoteOn(note, velocity){
  // const boxVectorY = 1000 + ((velocity / 128 ) * 2000)
  // boxes[note].mesh.applyCentralImpulse(new THREE.Vector3(0, boxVectorY, 0))
  
  boxes[note].on = true
  boxes[note].mesh.material.emissive = boxes[note].color
  boxes[note].mesh.material.opacity = 0.5 + (velocity / 128)

}

function grow(box) {
  let length =  new THREE.Box3().setFromObject( box.mesh ).getSize().z
  
  const desiredLength = length + distance
  const scale = desiredLength / length
  
  box.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, scale ))
  box.mesh.position.z = (-desiredLength / 2)
}

function reset(box) {
  let length =  new THREE.Box3().setFromObject( box.mesh ).getSize().z
  const desiredLength = 5
  const scale = desiredLength / length
  box.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, scale ))
  box.mesh.position.z = (box.initialPosition.z)
}

function onNoteOff(note) {
  boxes[note].mesh.material.emissive = new THREE.Color(0, 0, 0)
  boxes[note].mesh.material.opacity = 0.2
  boxes[note].on = false
  reset(boxes[note])
  // box.setLinearVelocity(new THREE.Vector3(0, 0, 0))
}

initScene = function init() {
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize( window.innerWidth, window.innerHeight );
  
  // renderer.shadowMap.enabled = true;
  scene = new Physijs.Scene;
  
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set( 60, 50, 60 );
  camera.lookAt( scene.position );
  
  document.getElementById( 'viewport' ).appendChild( renderer.domElement );
  var renderScene = new RenderPass( scene, camera );
  var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.8, 0.4, 0.0 );
  
  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( bloomPass );
  
  scene.setGravity(new THREE.Vector3( 0, -300, 0 ));
  
  const controls = new OrbitControls( camera, renderer.domElement );

  scene.add( camera );
  
  floor = new Physijs.BoxMesh(
    new THREE.BoxGeometry(1000, 1, 1000),
    new THREE.MeshStandardMaterial({ color: 0x666666, colorWrite: false }),
    0
  )
  floor.position.set(0, -3, 0)
  
  
  scene.add( floor );
  
  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );
  
  scene.add( ambientLight );
  

  // The fun stuff
  
  let start = 48
  let size = 5
  for (let i = start; i < 84; i++ ) {
    const colors = [new THREE.Color(1, 0, 0), new THREE.Color(0, 1, 0), new THREE.Color(0, 0, 1)]
    
    let color = colors[i%3]
    let box = {
      on: false,
      color,
      mesh: new Physijs.BoxMesh(
        new THREE.CubeGeometry( size, size, size ),
        Physijs.createMaterial(
          new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(0.5, 0.5, 0.5),
            emissive: new THREE.Color(0, 0, 0),
            transparent: true,
            opacity: 0.2
          }),
          friction,
          restitution
        ),
        50,
      ),
      initialPosition: {
        x: ((size + 1) * ((i - start - 15))),
        y: 0,
        z: -size / 2
      },
      
    }
    box.currentPosition = { ...box.initialPosition }
    box.mesh.position.set(
      box.initialPosition.x,
      box.initialPosition.y,
      box.initialPosition.z
    )
    boxes[i] = box

    scene.add( box.mesh );

  }
  
  requestAnimationFrame( render );
};

render = function() {
  // scene.simulate(); // run physics
  composer.render();
  boxes.forEach(box => {
    if (box.on) grow(box)
  })
  requestAnimationFrame( render );
};

initScene()


window.onresize = function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize( width, height );
  composer.setSize( width, height );
};