const THREE = require('three');
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

var OrbitControls = require('three-orbit-controls')(THREE)

import Physijs from 'physijs-webpack';
import { populateNotes, notes } from './state';
import { onNoteOn, onNoteOff, tick } from './logic'


let boxes = []

const directionalImpulse = () => 1 - (Math.random() * 2)

function isMidiNoteBlack(num){
  const keys = [0,1,0,1,0,0,1,0,1,0,1,0]
  let idx = (num + 12) % 12
  return !!keys[idx]
}

// a debouncer for midi signals
const midiInput = []
function onMIDIMessage( event ) {
  const [something, note, velocity] = event.data
  if (velocity === 0) {
    if (midiInput[note] === true) {
      onNoteOff(note)
      midiInput[note] = false
    }
  }
  else {
    if (note <= 1) return
    if (midiInput[note] === undefined || midiInput[note] === false) {
      onNoteOn(note, velocity)
      midiInput[note] = true
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


export let scene
let initScene, render, renderer, camera, floor, composer;


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
  populateNotes()
  notes.forEach(row => {
    row.forEach(box => scene.add(box.mesh))
  })
  
  requestAnimationFrame( render );
};

render = function(ms) {
  // scene.simulate(); // run physics
  composer.render();
  tick(ms)
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