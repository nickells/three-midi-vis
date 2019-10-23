const THREE = require('three');
import Physijs from 'physijs-webpack';
import PhysijsWorker from 'physijs-webpack/physijs_worker';

export const notes = []

const colors = [new THREE.Color(1, 0, 0), new THREE.Color(0, 1, 0), new THREE.Color(0, 0, 1)]

export const size = 5

var friction = 0.8; // high friction
var restitution = 0.2; // low restitution

export const createBox = (params, note) => {
  return {
    active: false,
    onTime: undefined,
    offTime: undefined,
    placeholder: true,
    color: colors[note%3],
    initialPosition: {
      x: ((size + 1) * ((note - 50))),
      y: 0,
      z: -size / 2
    },
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
      ), 50 ),
    ...params,
  }
}
  
export const populateNotes = () => {
  for (let i = 21; i < 108; i++ ) {
    const box = createBox({}, i)
  
    // Each note array is an array of notes over time
    notes[i] = []
    
    // The first box will be a placeholder (for now)
    notes[i].push(box)
    
    // Place the box
    box.mesh.position.set(box.initialPosition.x, box.initialPosition.y, box.initialPosition.z)
  }
}