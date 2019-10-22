const THREE = require('three');
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

var OrbitControls = require('three-orbit-controls')(THREE)

import Physijs from 'physijs-webpack';
import PhysijsWorker from 'physijs-webpack/physijs_worker';

let state = {
  
}


function onMIDIMessage( event ) {
  const [channel, note, velocity] = event.data
  if (velocity === 0) onNoteOff(note)
  else onNoteOn(note, velocity)
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

var material = Physijs.createMaterial(
    new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0xFFFFFF, }),
    friction,
    restitution
);


let initScene, render, renderer, scene, camera, box, floor, composer;

function onNoteOn(note, velocity){
  const boxVectorY = 500 + ((velocity / 128 ) * 1500)
  box.applyCentralImpulse(new THREE.Vector3(0, boxVectorY, 0))
}

function onNoteOff() {
  // box.setLinearVelocity(new THREE.Vector3(0, 0, 0))
}

initScene = function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  
  renderer.shadowMap.enabled = true;
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
  var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  
  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( bloomPass );
  
  scene.setGravity(new THREE.Vector3( 0, -100, 0 ));

  
  const controls = new OrbitControls( camera, renderer.domElement );

  scene.add( camera );
  
  // Box
  box = new Physijs.BoxMesh(
    new THREE.CubeGeometry( 5, 5, 5 ),
    material,
    50,
  );
  box.castShadow = true

  floor = new Physijs.BoxMesh(
    new THREE.BoxGeometry(50, 2, 50),
    new THREE.MeshStandardMaterial({ color: 0x444444 }),
    0
  )
  floor.position.set(0, -6, 0)

  floor.receiveShadow = true
  
  scene.add( floor );
  scene.add( box );
  // White directional light at half intensity shining from the top.
  var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
  pointLight.position.set(10, 20, 10)
  pointLight.castShadow = true

  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );

  scene.add( pointLight );
  // scene.add( ambientLight );
  
  requestAnimationFrame( render );
};

render = function() {
  scene.simulate(); // run physics
  composer.render();
  requestAnimationFrame( render );
};

initScene()