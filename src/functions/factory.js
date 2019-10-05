import * as THREE from "three";
import * as TWEEN from "tween";

export function makeSphere(color, posX, posY, posZ, radius, name, delay = 0) {
  var geometry = new THREE.SphereGeometry(radius, 16, 16);
  var material = new THREE.MeshPhongMaterial({
    color: color,
    transparent: true,
    opacity: 0.8
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = posX;
  mesh.position.y = posY;
  mesh.position.z = posZ;
  mesh.name = name;
  mesh.scale.set(0.1, 0.1, 0.1);
  mesh.geometry.computeBoundingBox();
  new TWEEN.Tween(mesh.scale)
    .to(
      {
        x: 1,
        y: 1,
        z: 1
      },
      0
    )
    .delay(delay)
    .easing(TWEEN.Easing.Elastic.Out)
    .start();

  return mesh
}
 export function getIntersectingBallsObject(intersectedObject, scene) {
  const id = intersectedObject.name;
  const ball1BBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  ball1BBox.setFromObject(intersectedObject);
  let intersectArray = [];
  for (let i = 0; i < scene.children.length; i++) {
    if (
      scene.children[i].type == "Mesh" &&
      id != scene.children[i].name
    ) {
      let ball = scene.children[i];
      let ball2BBox = new THREE.Box3(
        new THREE.Vector3(),
        new THREE.Vector3()
      );
      ball2BBox.setFromObject(ball);
      if (ball1BBox.intersectsBox(ball2BBox)) {
        intersectArray.push(ball);
      }
    }
  }
  return intersectArray;
}

export function getIntersects(event, camera, scene) {
  let mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);
  return intersects;
}

export function  mouseMoveSetColor (objectMaterial, colorArray) {
  let randomColorIndex = Math.floor(Math.random() * colorArray.length);
  let colorMaterial = colorArray[randomColorIndex];
  if (objectMaterial.color.getHex() == 0xffffff) {
    objectMaterial.color.setHex(colorMaterial);
    objectMaterial.opacity = 1;
  }
}
 export function scaleAnimation(object, factor, time) {
  new TWEEN.Tween(object.scale)
    .to(
      {
        x: factor,
        y: factor,
        z: factor
      },
      time
    )
    .easing(TWEEN.Easing.Elastic.Out)
    .start();
}
