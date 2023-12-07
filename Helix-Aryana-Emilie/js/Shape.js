import * as THREE from "three";

export default class Shape {
  constructor(scene) {
    this.scene = scene;
  }

  createCube() {
    //Create a cube
    const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);
  }

  createFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.receiveShadow = true;
    plane.rotateX(Math.PI / 2);
    this.scene.add(plane);
  }

  createHelix() {
    const radius = 3;
    const height = 10;
    this.numCoils = height * 1.5; // Number of coils
    this.numPoints = 30;

    const points = [];
    for (let i = 0; i <= this.numPoints * this.numCoils; i++) {
      const t = i / (this.numPoints * this.numCoils);
      const angle = 2 * Math.PI * this.numCoils * t;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(-angle) * radius;
      const z = height * -t;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial();

    this.helixLine = new THREE.Line(geometry, material);
    this.helixLine.rotateX(Math.PI / -2);

    this.helixCurve = new THREE.CatmullRomCurve3(points);
    const rotationMatrix = new THREE.Matrix4().makeRotationX(Math.PI / -2);
    this.helixCurve.points.forEach((point) => {
      point.applyMatrix4(rotationMatrix);
    });

    // this.scene.add(this.helixLine);
    return this.helixCurve;
  }
}
