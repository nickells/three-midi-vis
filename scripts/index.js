const THREE = require('three');
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import Physijs from 'physijs-webpack';
import { populateNotes, notes, placeholders } from './state';
import { onNoteOn, onNoteOff, tick } from './logic'
import { speed, cameraPos } from './consts';


let boxes = []

const directionalImpulse = () => 1 - (Math.random() * 2)

function isMidiNoteBlack(num){
  const keys = [0,1,0,1,0,0,1,0,1,0,1,0]
  let idx = (num + 12) % 12
  return !!keys[idx]
}

const textureLoaderPromise = (file) => new Promise(resolve => new THREE.TextureLoader().load(file, resolve))

// a debouncer for midi signals
const midiInput = []
function onMIDIMessage( event ) {
  const [data, note, velocity] = event.data
  if (note === undefined && velocity === undefined) return
  if (velocity === 0 || data === 128 ) {
    if (midiInput[note] === true) {
      onNoteOff(note)
      midiInput[note] = false
    }
  }
  else {
    if (data !== 144) return
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
export let camera
let initScene, render, renderer, floor, composer, grid


initScene = async function init() {
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize( window.innerWidth, window.innerHeight );
  
  // renderer.shadowMap.enabled = true;
  scene = new Physijs.Scene;
  
  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set( 0, cameraPos.y, cameraPos.z );
  camera.lookAt(new THREE.Vector3(0, 0, -60))
  
  document.getElementById( 'viewport' ).appendChild( renderer.domElement );
  var renderScene = new RenderPass( scene, camera );
  var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.0, 0.4, 0.0 );
  
  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( bloomPass );
  
  scene.setGravity(new THREE.Vector3( 0, -300, 0 ));
  
  scene.add( camera );
  

  grid = await textureLoaderPromise('grid-bg.png')
  grid.wrapS = THREE.RepeatWrapping;
  grid.wrapT = THREE.RepeatWrapping;
  grid.repeat.set(45, 45);
  
  floor = new Physijs.PlaneMesh(
    new THREE.BoxGeometry(1000, 1, 1000),
    new THREE.MeshStandardMaterial({
      map: grid,

      // magFilter: THREE.NearestFilter,
      // minFilter: THREE.LinearMipMapLinearFilter,
    }),
    0
  )

  
  floor.position.set(0, -3 , 0)
  
  scene.add( floor );
  
  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );
  
  scene.add( ambientLight );

  // The fun stuff
  populateNotes()
  placeholders.forEach(row => {
    row.forEach(box => scene.add(box.mesh))
  })
  
  requestAnimationFrame( render );
};

let gridsize = 1000 / 45
let speedunits = speed / gridsize

render = function(ms) {
  // scene.simulate(); // run physics
  composer.render();
  tick(ms)
  grid.offset.y -= speedunits
  grid.needsUpdate = true
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