<template>
  <div class="entertain-element">
    <video  class="case-videos" muted loop  poster="../assets/videos/case-vid-test7.svg" src="../assets/videos/case-vid-test.mp4"></video>
    <img class="page-logo" alt="page logo" src="../assets/img/SVG/logo.svg">
    <div id="container">
        <div class="pointsDisplay"></div>
        <canvas></canvas>
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
import { makeSphere } from '../functions/factory.js';
import {getIntersectingBallsObject} from '../functions/factory.js';
import {mouseMoveSetColor} from '../functions/factory.js';
import {scaleAnimation} from '../functions/factory.js';
import {getIntersects} from '../functions/factory.js';
import { log } from "three";

export default {
  name: "FrontpageEntertainment",
  data() {
    return {
      config: {
        debug: true,
        displayDesktopMinSize: 736,
        renderer: {
          width: window.innerWidth,
          height: window.innerHeight,
          parameters: {
            alpha: true,
            antialias: true,
          }
        },
        scene: {
          camera: {
            distance: 390,
          },
          displayPoints: {
            offsetX: 120,
            offsetY: 50,
          },
          balls: {
            distance: 66, 
            numBallsX: 10,
            numBallsY: 4, 
            xMin: -340, 
            yMin: -99, 
            radius: 20,

            scaleAnimation: {
              animationTime: 500,
              scaleFactor: 10,
            },
            hoverAnimation: {
              scaleFactorMultiplier: 2.2,
              animationTime:  1500
            },
            explosion: {
              animaTionTime: 4000,
            }
          }
        }
      },
      selectors: {
        canvas: '#container canvas',
        container: '#container',
        pointsDisplay: '.pointsDisplay',
      },
      elements: {
        canvas: null,
        container: null,
        pointsDisplay: null,
      },
      game: {
        currentIntersection: null,
        balls: {},
        ballIsClicked: {},
        previousBallId: 0, // zero means no balld id
        isMouseOnBall: false,
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
      if (window.innerWidth >= this.config.displayDesktopMinSize) {
        this.initiateCanvasDesktop();
      } else {
        //initiateCanvasMobile();
      }
    },
    log(message, data = undefined) {
      if(this.config.debug) {
        if(data) {
          console.log(message, data);
        } else {
          console.log(message);
        }
      }
    },
    setSelectors() {
      for (const [key, selector] of Object.entries(this.selectors)) {
        this.elements[key] = document.querySelector(selector);
      }
    },
    setStyle(element, style) {
      for (const key in style) {
        element.style[key] = style[key];
      }
    },
    initiateCanvasDesktop: function() {      
      this.setSelectors();
      this.createScene();
      this.setSelectors();
      this.setCanvasMouseHandlers();
      this.AddGameBall();
      this.animate();

      this.game.isRenderingInitialScene = true;
      // give the initial ball animation a bit of time to render.
      setTimeout(() => {
        this.game.isRenderingInitialScene = false;
      }, 100);
    },
    createScene: function() {
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0026);
      this.addRenderer();
      this.addCamera(0, 0, this.config.scene.camera.distance);
      this.addLight(0xffffff, 50, 200, 200);
      this.addLight(0xff00ff, 20, 500, -600);
      this.addLight(0x00ffb6, 300, 300, 50);
    },
    setCanvasMouseHandlers() {
      this.elements.canvas.addEventListener("mousedown", this.onDocumentMouseDown, false);
      this.elements.canvas.addEventListener("mousemove", this.onDocumentMouseMove, false);
    },
    addRenderer: function() {
      const rendererParams = Object.assign({}, this.config.renderer.parameters, {canvas: this.elements.canvas});

      this.renderer = new THREE.WebGLRenderer(rendererParams);
      this.renderer.setSize(this.config.renderer.width, this.config.renderer.height);
      this.renderer.setPixelRatio(this.config.renderer.pixelRatio);
      this.renderer.setClearColor(0xffffff, 0);
    },
    addCamera: function(posX, posY, posZ) {
      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000
      );
      this.camera.position.set(posX, posY, posZ);
      this.scene.add(this.camera);
    },
    addLight: function(color, posX, posY, posZ) {
      const light = new THREE.SpotLight(color);
      light.position.set(posX, posY, posZ);
      this.scene.add(light);
    },
    AddGameBall: function() {
      const xMin = this.config.scene.balls.xMin;
      const yMin = this.config.scene.balls.yMin;
      const numBallsX = this.config.scene.balls.numBallsX;
      const numBallsY = this.config.scene.balls.numBallsY;
      const distance = this.config.scene.balls.distance;
      const radius = this.config.scene.balls.radius;

      const xMax = xMin + numBallsX * distance;
      const yMax = yMin + numBallsY * distance;
      
      let count = 0;
      for (let i = xMin; i < xMax; i += distance) {
        for (let j = yMin; j < yMax; j += distance) {
          const objName = String(i) + String(j);
          const ball = makeSphere(0xffffff, i, j, 0, radius, objName, count, this.scene);
          this.scene.add(ball);
          this.game.balls[ball.id] = ball;
          count++;
        }
      }
    },
    setMouseHoverIntersection(event) {
      this.game.currentIntersection = getIntersects(event, this.camera, this.scene);
    },
    onDocumentMouseMove: function(event) {
      this.setMouseHoverIntersection(event);
      const previousBallId = this.game.previousBallId;

      if (this.game.currentIntersection.length > 0) {
        const ball = this.game.currentIntersection[0].object;
        const ballId = ball.id;
        this.game.previousBallId = ball.id;
        if(previousBallId !== ball.id) {
          this.onMouseHoverBall(ball);
        }
      } else {
        this.game.previousBallId = 0;
        this.setMouseAsDefault();
      }
    },
    onMouseHoverBall: function(ball) {
      this.setMouseAsPointer();
      this.randomizeBallColorAndSize(ball)
    },
    randomizeBallColorAndSize: function(ball) {   
      const animationTime = this.config.scene.balls.hoverAnimation.animationTime;
      const scaleFactor = this.config.scene.balls.hoverAnimation.scaleFactorMultiplier * Math.random() + 0.5;

      if(this.game.animateBallHoverPromise) {
        clearTimeout(this.game.animateBallHoverPromise);
      } 
      this.game.animateBallHoverPromise = setTimeout( () => {
        this.game.isAnimatingBallHover = false;
      }, animationTime)

      this.game.isAnimatingBallHover = true;
      mouseMoveSetColor(ball.material, this.colorArray);
      scaleAnimation(ball, scaleFactor, animationTime);
    },
    setMouseAsPointer: function() {
      document.body.style.cursor = "pointer";
    },
    setMouseAsDefault: function() {
      document.body.style.cursor = "default";
    },
    onDocumentMouseDown: function(event) {
      // @todo make click pop sound
      // constsounds.src = "/assets/" + "pop6" + ".mp3"; @todo move to top assets

      // @todo remove this, detach the click listener instead
      if (this.gameEnd) {
        return;
      }
      if(!this.game.currentIntersection) {
        return;
      }

      const currentIntersection = this.game.currentIntersection;
      const ball = this.game.currentIntersection[0]
      if(!ball) {
        return;
      }

      if(this.game.ballIsClicked[ball.object.id]) {
        return
      } else {
        this.game.ballIsClicked[ball.object.id] = true;
      }
      const intersectingBallsObjects = getIntersectingBallsObject(ball.object, this.scene);

      scaleAnimation(
        ball.object, 
        this.config.scene.balls.scaleAnimation.scaleFactor, 
        this.config.scene.balls.scaleAnimation.animationTime
      );
      setTimeout(() => {
        // @todo explosion sound?
        // sounds.play();
        this.bubblePopDesktop(this.elements.pointsDisplay, intersectingBallsObjects, event, ball);
        this.removeBall(ball)
        intersectingBallsObjects.forEach(ballObject => {
          this.removeBallObject(ballObject);
        })
        if(!Object.entries(this.game.balls).length) {
          this.log('game over!');
          // this.gameWin();
        }
      }, this.config.scene.balls.scaleAnimation.animationTime);
    },
    removeBall: function(ball) {
      this.removeBallObject(ball.object)
    },
    removeBallObject: function(ballObject) {
      delete this.game.balls[ballObject.id];
      this.scene.remove(ballObject);
    },
    gameEnded: function() {
      this.gameEnd = true;
      this.log("end of game");
      this.clearScene();
      //backWin.src = "";
      
      /*let bubblesElem = document.querySelector("#bubbles-container");
      let bubblesOldCanvas = bubblesElem.children[0];
      bubblesElem.removeChild(bubblesOldCanvas);
      if (window.innerWidth >= 736) {
        initiateCanvasDesktop();
      } else {
        initiateCanvasMobile();
      }*/
    },
    clearScene: function() {
      while (this.scene.children.length > 0) {
        this.scene.remove(scene.children[0]);
      }
    },
    bubblePopDesktop: function(elem, array, e, ball) {
      this.displayPoints(elem, array, e, e.clientX, e.clientY);
      this.addFireworks(
        ball,
        150,
        100 + 300 * array.length,
      );
    },
    displayPoints: function(elem, array, e, posX, posY) {
      const element = this.elements.pointsDisplay;
      const backgrounds = [
        require("../assets/img/SVG/points-background1.svg"),
        require("../assets/img/SVG/points-background2.svg"),
        require("../assets/img/SVG/points-background3.svg")
      ];
      const points = (array.length + 1) * 1000;
      const randomNum = Math.floor(Math.random() * backgrounds.length);
      const str = "+" + String(points);

      element.innerHTML = str;
      element.style.left = (posX - this.config.scene.displayPoints.offsetX)+'px';
      element.style.top = (posY - this.config.scene.displayPoints.offsetY)+'px';
      element.style.color = "#fff";
      element.style.webkitTextStroke = "1px #000";
      element.style.background =
        "url('" + backgrounds[randomNum] + "') no-repeat top left";

      element.classList.add('pointsTransition');
      setTimeout(() => {
        element.classList.remove('pointsTransition');
      }, 1000);
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
      this.log('balls left', count);
      return count;
    },
    addFireworks: function(ball, objectSize, totalObjects) {
      const explosionTime = this.config.scene.balls.explosion.animaTionTime;

      let particles = new ExplodeAnimation(
        ball.object.position.x,
        ball.object.position.y,
        ball.object.material.color.getHex(),
        objectSize,
        totalObjects,
        this.scene,
        this.dirs,
        explosionTime
      );
      particles.createPartices();
      if(this.game.animatingExplodingBalls) {
        clearTimeout(this.game.animatingExplodingBalls);
      }
      this.game.animatingExplodingBalls = setTimeout( () => {
        this.game.isAnimatingExplodingBalls = false;
        this.parts = []; // clear out particles when done animating
      }, explosionTime + 100);
      this.game.isAnimatingExplodingBalls = true;

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

  canvas: {
    position: 'absolute';
    top: 0;
    left: 0;
  }
  .bubbles{
    position: absolute;
    top: 0;
    left: 0;
  }
}

.pointsDisplay {
  user-select: none;
  position: absolute;
  z-index: 1000;
  color: #000;
  font-size: 30px;
  padding: 35px 70px;
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  transform: scale(0);
  top: left;
  background-size: cover;
}
.pointsTransition {
  animation: pointsAnim 1s ease-out;
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
