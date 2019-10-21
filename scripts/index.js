const THREE = require('three');

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
    new THREE.MeshPhongMaterial({ color: 0x888888 }),
    friction,
    restitution
);


let initScene, render, renderer, scene, camera, box, floor;

function onNoteOn(){
  box.applyCentralImpulse(new THREE.Vector3(0, 1200, 0))
}

function onNoteOff() {
  // box.setLinearVelocity(new THREE.Vector3(0, 0, 0))
}

initScene = function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.getElementById( 'viewport' ).appendChild( renderer.domElement );
  
  scene = new Physijs.Scene;
  scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

  
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set( 60, 50, 60 );
  camera.lookAt( scene.position );
  scene.add( camera );
  
  // Box
  box = new Physijs.BoxMesh(
    new THREE.CubeGeometry( 5, 5, 5 ),
    material,
    50,
  );

  floor = new Physijs.BoxMesh(
    new THREE.BoxGeometry(50, 2, 50),
    new THREE.MeshPhongMaterial({ color: 0x444444 }),
    0
  )
  floor.position.set(0, -6, 0)
  
  scene.add( floor );
  scene.add( box );
  // White directional light at half intensity shining from the top.
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set(0, 5, 5)
  scene.add( directionalLight );
  
  requestAnimationFrame( render );
};

render = function() {
  scene.simulate(); // run physics
  renderer.render( scene, camera); // render the scene
  requestAnimationFrame( render );
};

initScene()