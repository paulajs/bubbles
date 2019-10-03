<template>
  <div class="entertain-element">
    <video  class="case-videos" muted loop  poster="../assets/videos/case-vid-test7.svg" src="../assets/videos/case-vid-test.mp4"></video>
    <img class="page-logo" alt="page logo" src="../assets/img/SVG/logo.svg">
    <div id="container">
        <p class="pointsDisplay"></p>
      <audio id="bubbleSounds" src></audio>
      <video
        src = ""
        id="full-screen-win"
        type="video/mp4"
        preload="auto"
        loop
        muted
        disableRemotePlayback
      ></video>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import * as TWEEN from "tween";
import { ExplodeAnimation } from "../functions/explosion.js";
import {makeAddSphere} from '../functions/factory.js';
import {getIntersectingBalls} from '../functions/factory.js';
import {mouseMoveSetColor} from '../functions/factory.js';
import {scaleAnimation} from '../functions/factory.js';
import {getIntersects} from '../functions/factory.js';
import { log } from "three";

export default {
  name: "FrontpageEntertainment",
  data() {
    return {
      game: {
        isRenderingInitialScene: false,
        isAnimatingBallHover: false,
        animateBallHoverPromise: null,
        isAnimatingExplodingBalls: false,
        animatingExplodingBalls: null,
      },
      camera: null,
      scene: null,
      renderer: null,
      isAnimating: false,
      clickTime: Date.now(),
      newClick: this.clickTime + 1600,
      gameEnd: false,
      parts: [],
      dirs: [],
      bubbleBurst: false,
      particles: null,
      movementSpeed: 80,
      pointsDisplay: document.querySelector(".pointsDisplay"),
      //backWin: document.querySelector('#full-screen-win'),
      colorArray: [
        0xff00ff,
        0xff1aff,
        0xff33ff,
        0xff4dff,
        0xff66ff,
        0xff7fff,
        0x00cf78,
        0x00ffb6,
        0x75f9d0,
        0x61ffa6,
        0x7affbf,
        0x93ffd8,
        0xcc00cc,
        0xb300b3
      ]
    };
  },
  methods: {
    init: function() {
      if (window.innerWidth >= 736) {
        this.initiateCanvasDesktop();
      } else {
        //initiateCanvasMobile();
      }
    },
    initiateCanvasDesktop: function() {
      var canvas = document.querySelector("#container");
      canvas.addEventListener("mousedown", this.onDocumentMouseDown, false);
      canvas.addEventListener("mousemove", this.onDocumentMouseMove, false);
      
      this.game.isRenderingInitialScene = true;
      this.createScene(66, 10, 3, -340, -99, 20);
      this.AddGameBall(-340, -99, 10, 3, 66, 20);
      this.animate();

      // give the initial ball animation a bit of time to render.
      setTimeout(() => {
        this.game.isRenderingInitialScene = false;
      }, 100);
    },
    createScene: function(distance, numBallsX, numBallsY, xMin, yMin, radius) {
      this.scene = new THREE.Scene();
      this.scene.name = "buborama";
      this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0026);
      this.addRenderer();
      this.addCamera(0, 0, 390);

      this.addLight(0xffffff, 50, 200, 200);
      this.addLight(0xff00ff, 20, 500, -600);
      this.addLight(0x00ffb6, 300, 300, 50);

      var geometry = new THREE.PlaneGeometry(200, 200, 32);
      var material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide
      });
    },
    addRenderer: function() {
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.top = 0;
      this.renderer.domElement.style.left = 0;
      this.renderer.setClearColor(0x000000, 0);

      document.querySelector("#container").appendChild(this.renderer.domElement);
    },
    addCamera: function(posX, posY, posZ) {
      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000
      );
      this.camera.position.set(posX, posY, posZ); //450
      this.scene.add(this.camera);
    },
    addLight: function(color, posX, posY, posZ) {
      var light = new THREE.SpotLight(color);
      light.position.set(posX, posY, posZ);
      this.scene.add(light);
    },
    AddGameBall: function(xMin, yMin, numBallsX, numBallsY, distance, radius) {
      var xMax = xMin + numBallsX * distance;
      var yMax = yMin + numBallsY * distance;
      var count = 0;
      for (var i = xMin; i <= xMax; i += distance) {
        for (var j = yMin; j <= yMax; j += distance) {
          var objName = String(i) + String(j);
          makeAddSphere(0xffffff, i, j, 0, radius, objName, count, this.scene);
          count = count + 1;
        }
      }
    },
    onDocumentMouseMove: function(event) {
      if (this.isAnimating === false) {
        const animationTime = 1500;

        let intersects = getIntersects(event, this.camera, this.scene);
        if (intersects.length > 0) {
          console.log('intersecting!');
          if(this.game.animateBallHoverPromise) {
            clearTimeout(this.game.animateBallHoverPromise);
          } 
          this.game.animateBallHoverPromise = setTimeout( () => {
            console.log('stopping animation ball hover')
            this.game.isAnimatingBallHover = false;
          }, animationTime)

          this.game.isAnimatingBallHover = true;

          mouseMoveSetColor(intersects[0].object.material, this.colorArray);
          document.body.style.cursor = "pointer";
          let num = 2.2 * Math.random() + 0.5;


          scaleAnimation(intersects[0].object, num, 1500);
        } else {
          document.body.style.cursor = "default";
        }
      }
    },
    onDocumentMouseDown: function(event) {
      this.isAnimating = true;

      if (this.gameEnd == true) {
        this.gameEnded();
      }
      //sounds.src = "/assets/" + "pop6" + ".mp3";

      document.querySelector(".pointsDisplay").style.animation = "none";
      let intersects = getIntersects(event, this.camera, this.scene);
      let scene = this.scene;
      let pointsDisplay = document.querySelector(".pointsDisplay");

      if (intersects.length > 0) {
        let array = getIntersectingBalls(intersects[0].object, this.scene);
        scaleAnimation(intersects[0].object, 10, 700);
        //sounds.play();
        setTimeout(() => {
          this.isAnimating = false;
          scene.remove(intersects[0].object);
          this.bubblePopDesktop(pointsDisplay, array, event, intersects);
        }, 700);
      } else {
        this.isAnimating = false;
      }
    },
    gameEnded: function() {
      this.gameEnd = false;
      console.log("end of game");
      //backWin.src = "";
      while (this.scene.children.length > 0) {
        this.scene.remove(scene.children[0]);
      }
      /*let bubblesElem = document.querySelector("#bubbles-container");
      let bubblesOldCanvas = bubblesElem.children[0];
      bubblesElem.removeChild(bubblesOldCanvas);
      if (window.innerWidth >= 736) {
        initiateCanvasDesktop();
      } else {
        initiateCanvasMobile();
      }*/
    },
    bubblePopDesktop: function(elem, array, e, intersects) {
      this.displayPoints(elem, array, e, e.clientX + "px", e.clientY + "px");
      this.removeBallsDesktop(array);
      this.addFireworks(
        intersects,
        150,
        100 + 300 * array.length,
        this.scene,
        this.dirs
      );
    },
    displayPoints: function(elem, array, e, posX, posY) {
      let points = (array.length + 1) * 1000;

      let backgrounds = [
        require("../assets/img/SVG/points-background1.svg"),
        require("../assets/img/SVG/points-background2.svg"),
        require("../assets/img/SVG/points-background3.svg")
      ];
      let randomNum = Math.floor(Math.random() * 3);
      let str = "+" + String(points);
      elem.innerHTML = str;
      elem.style.left = posX;
      elem.style.top = posY;
      elem.style.color = "#fff";
      elem.style.webkitTextStroke = "1px #000";
      elem.style.background =
        "url('" + backgrounds[randomNum] + "') no-repeat top left";
      //elem.style.animation = "pointsAnim 1.25s ease-in";
    },
    removeBallsDesktop: function(array) {
      for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < this.scene.children.length; j++) {
          if (array[i] == this.scene.children[j].name) {
            this.scene.remove(this.scene.children[j]);
          }
        }
      }
      this.congratulate(0);
    },
    congratulate: function(minBall) {
      if (this.countBalls() === minBall) {
        this.congrats();
        gameEnd = true;
      }
    },
    congrats: function() {
      let sti = "assets/applause.mp4";
      let stiMob = "assets/applausemob.mp4";

      setTimeout(function() {
        if (window.innerWidth < 736) {
          //backWin.src = stiMob;
          //backWin.play();
        } else {
          //backWin.src = sti;
          //backWin.play();
        }
        //sounds.src = "assets/" + "applause" + ".wav";
        //sounds.play();
      }, 500);
    },
    countBalls: function() {
      let count = 0;
      for (var i = 0; i < this.scene.children.length; i++) {
        if (this.scene.children[i].type === "Mesh") {
          count += 1;
        }
      }
      return count;
    },
    addFireworks: function(intersects, objectSize, totalObjects, scene, dirs) {
      const explosionTime = 5000;
      const expPosX = intersects[0].object.position.x;
      const expPosY = intersects[0].object.position.y;
      const expColor = intersects[0].object.material.color.getHex();
      let particles = new ExplodeAnimation(
        expPosX,
        expPosY,
        expColor,
        objectSize,
        totalObjects,
        scene,
        dirs,
        explosionTime
      );
      particles.createPartices();
      if(this.game.animatingExplodingBalls) {
        clearTimeout(this.game.animatingExplodingBalls);
      }
      this.game.animatingExplodingBalls = setTimeout( () => {
        this.game.isAnimatingExplodingBalls = false;
      }, explosionTime + 100);
      this.game.isAnimatingExplodingBalls = true;
      /*if (this.parts.length > 0) {
        this.parts.pop();
      }*/
      this.parts.push(particles);
    },
    animate: function() {
      const skipAnimation = 
           (this.game.isRenderingInitialScene === false) 
        && (this.game.isAnimatingBallHover === false) 
        && (this.game.isAnimatingExplodingBalls === false)
      ;
      if(skipAnimation) {
        requestAnimationFrame(this.animate);
        return;
      }

      TWEEN.update();
      let pCount = this.parts.length;

      while (pCount--) {
        this.parts[pCount].update();
      }
      this.renderer.render(this.scene, this.camera);
      // @todo throttle this when unused
      requestAnimationFrame(this.animate);
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.page-logo {
  width: 70%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
#container {
  position: absolute;
  top: 0;
  left: 0;
  .bubbles{
    position: absolute;
    top: 0;
    left: 0;
  }
}

.pointsDisplay {
  position: absolute;
  z-index: 1000;
  color: #000;
  font-size: 30px;
  padding: 35px 70px;
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  transform: scale(0);
  /*background: url("../assets/points-background1.svg") no-repeat*/
  top: left;
  background-size: cover;
  animation: none;
}
.pointsTransition{
  animation: pointsAnim 1.25s ease-out;
}
@keyframes pointsAnim{
	0%{
        display: block;
		transform: scale(0);
	}
	100%{
		transform: scale(2);
    }
}
</style>
