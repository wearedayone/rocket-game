// src/components/Game.js
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startFiring,
  stopFiring,
  updateRocketPosition,
  resetHoldDuration,
  addPoints,
} from "../store";
import { doRectanglesIntersect, generateRandomTargetPositions } from "./utils";
import anime from "animejs";

const Game = () => {
  const canvasRef = useRef(null);
  const canvasAnimRef = useRef(null);
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens } = useSelector(
    (state) => state.game
  );
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);
  const rocketImageRef = useRef(null); // Reference for the rocket image
  const hitTarget1Ref = useRef(false);
  const hitTarget2Ref = useRef(false);
  const [targetPositions, setTargetPositions] = useState(generateRandomTargetPositions());



  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const canvasAnim = canvasAnimRef.current;
    const ctxAnim = canvasAnim.getContext("2d");

    var numberOfParticules = 30;
    var pointerX = 0;
    var pointerY = 0;

    var colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];

    function updateCoords(e) {
      pointerX = e.clientX || e.touches[0].clientX;
      pointerY = e.clientY || e.touches[0].clientY;
    }

    function setParticuleDirection(p) {
      var angle = (anime.random(0, 360) * Math.PI) / 180;
      var value = anime.random(50, 180);
      var radius = [-1, 1][anime.random(0, 1)] * value;
      return {
        x: p.x + radius * Math.cos(angle),
        y: p.y + radius * Math.sin(angle),
      };
    }

    function createCircle(x, y) {
      var p = {};
      p.x = x;
      p.y = y;
      p.color = "#FFF";
      p.radius = 0.1;
      p.alpha = 0.5;
      p.lineWidth = 6;
      p.draw = function () {
        ctxAnim.globalAlpha = p.alpha;
        ctxAnim.beginPath();
        ctxAnim.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctxAnim.lineWidth = p.lineWidth;
        ctxAnim.strokeStyle = p.color;
        ctxAnim.stroke();
        ctxAnim.globalAlpha = 1;
      };
      return p;
    }

    function createParticule(x, y) {
      var p = {};
      p.x = x;
      p.y = y;
      p.color = colors[anime.random(0, colors.length - 1)];
      p.radius = anime.random(16, 32);
      p.endPos = setParticuleDirection(p);
      p.draw = function () {
        ctxAnim.beginPath();
        ctxAnim.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctxAnim.fillStyle = p.color;
        ctxAnim.fill();
      };
      return p;
    }

    function renderParticule(anim) {
      for (var i = 0; i < anim.animatables.length; i++) {
        anim.animatables[i].target.draw();
      }
    }

    function animateParticules(x, y) {
      var circle = createCircle(x, y);
      var particules = [];
      for (var i = 0; i < numberOfParticules; i++) {
        particules.push(createParticule(x, y));
      }
      anime
        .timeline()
        .add({
          targets: particules,
          x: function (p) {
            return p.endPos.x;
          },
          y: function (p) {
            return p.endPos.y;
          },
          radius: 0.1,
          duration: anime.random(1200, 1800),
          easing: "easeOutExpo",
          update: renderParticule,
        })
        .add({
          targets: circle,
          radius: anime.random(80, 160),
          lineWidth: 0,
          alpha: {
            value: 0,
            easing: "linear",
            duration: anime.random(600, 800),
          },
          duration: anime.random(1200, 1800),
          easing: "easeOutExpo",
          update: renderParticule,
          offset: 0,
        })
        .finished.then(() => {
          // Clear the particles
          console.log("anim finished");
          ctxAnim.clearRect(0, 0, canvasAnim.width, canvasAnim.height);
        });
    }

    var render = anime({
      duration: Infinity,
      update: function () {
        // ctxAnim.clearRect(0, 0, canvasAnim.width, canvasAnim.height);
      },
    });

    const playExplosionAnim = (x, y) => {
      window.human = true;
      render.play();
      updateCoords({ clientX: x, clientY: y });
      animateParticules(pointerX, pointerY);
    };

    const rocketImage = new Image();
    rocketImage.src = "/images/rocket_1.png"; // Update the path to your image
    rocketImage.onload = () => {
      rocketImageRef.current = rocketImage;
      draw(); // Initial draw after loading the image
    };

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasAnim.width = window.innerWidth;
    canvasAnim.height = window.innerHeight;
    const x1 = targetPositions[0].x;
    const y1 = targetPositions[0].y;
    const targetBoundingBox1 = {
      x: x1, // center x - radius
      y: y1, // center y - radius
      width: 50, // diameter
      height: 50, // diameter
    };
    const x2 = targetPositions[1].x;
    const y2 = targetPositions[1].y;

    const targetBoundingBox2 = {
      x: x2, // center x - radius
      y: y2, // center y - radius
      width: 50, // diameter
      height: 50, // diameter
    };

    const drawLauncher = () => {
      ctx.fillStyle = "gray";
      ctx.fillRect(50, canvas.height - 150, 60, 120);
      ctx.beginPath();
      ctx.moveTo(50, canvas.height - 150);
      ctx.lineTo(80, canvas.height - 210);
      ctx.lineTo(110, canvas.height - 150);
      ctx.closePath();
      ctx.fill();
    };

    const drawRocket = () => {
      if (rocketImageRef.current) {
        const angle = Math.sqrt(2) - rocketPosition.rAngle;
        ctx.translate(
          rocketPosition.x + 55,
          canvas.height - rocketPosition.y - 100
        );
        ctx.rotate(angle);
        ctx.drawImage(
          rocketImageRef.current,
          0, // rocketPosition.x + 55,
          // canvas.height - rocketPosition.y - 100,
          0,
          50, // width of the rocket image
          50 // height of the rocket image
        );
        ctx.rotate(-angle);
        ctx.translate(
          -(rocketPosition.x + 55),
          -(canvas.height - rocketPosition.y - 100)
        );

        // ctx.rotate(30);
        const rocketBoundingBox = {
          x: rocketPosition.x + 55,
          y: canvas.height - rocketPosition.y - 100,
          width: 50, // width of the rocket image
          height: 50, // height of the rocket image
        };
        // / Check for intersections
        const intersectsTarget1 = doRectanglesIntersect(
          rocketBoundingBox,
          targetBoundingBox1
        );
        const intersectsTarget2 = doRectanglesIntersect(
          rocketBoundingBox,
          targetBoundingBox2
        );
        if (intersectsTarget1) {
          if (!hitTarget1Ref.current) {
            playExplosionAnim(rocketBoundingBox.x, rocketBoundingBox.y);
            dispatch(addPoints({ point: 2 }));
            //animation once
          }
          hitTarget1Ref.current = true;
        }
        if (intersectsTarget2) {
          if (!hitTarget2Ref.current) {
            playExplosionAnim(rocketBoundingBox.x, rocketBoundingBox.y);
            dispatch(addPoints({ point: 2 }));
            //animation once
          }
          hitTarget2Ref.current = true;
        }
      }
    };

    const drawTargets = () => {
      const x1 = targetPositions[0].x;
      const y1 = targetPositions[0].y;
      const x2 = targetPositions[1].x;
      const y2 = targetPositions[1].y;
      if (!hitTarget1Ref.current) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(x1, y1, 25, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (!hitTarget2Ref.current) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(x2, y2, 25, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    const drawLand = () => {
      ctx.fillStyle = "green";
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLand();
      drawLauncher();
      drawRocket();
      drawTargets();
    };

    draw();
  }, [rocketPosition, targetPositions, dispatch]);

  useEffect(() => {
    if (isFiring) {
      holdStartTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsedTime = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
        setCurrentHoldDuration(elapsedTime);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isFiring]);

  const calculateRocketPosition = (t, v0, angle) => {
    const g = 9.81; // gravity
    let x = v0 * t * Math.cos(angle); // - v0 * 2 * Math.cos(angle) ;
    let y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;
    let rAngle = Math.atan(
      (v0 * Math.sin(angle) - g * t) / (v0 * Math.cos(angle))
    ); // current angle of rocket

    return { x, y, rAngle };
  };

  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const g = 9.81; // gravity
        const v0 = holdDuration * 20; // initial velocity based on hold duration
        const angle = Math.PI / 3; // 60 degrees
        launchTimeRef.current = Date.now();

        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 1000; // in seconds
          const { x, y, rAngle } = calculateRocketPosition(t, v0, angle);
          if (y < 0) {
            clearInterval(rocketIntervalRef.current);
            setTargetPositions(generateRandomTargetPositions());
            hitTarget1Ref.current = false;
            hitTarget2Ref.current = false;
            dispatch(resetHoldDuration());

            dispatch(updateRocketPosition({ x: 0, y: 0 })); // Reset position after it falls
          } else {
            dispatch(updateRocketPosition({ x, y, rAngle }));
          }
        }, 40);
      };

      launchRocket();
    }

    return () => clearInterval(rocketIntervalRef.current);
  }, [isFiring, holdDuration, dispatch]);

  const handleMouseDown = () => {
    if (tokens > 0) {
      dispatch(startFiring());
    }
  };

  const handleMouseUp = () => {
    const finalHoldDuration = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
    setCurrentHoldDuration(finalHoldDuration);
    dispatch(stopFiring());
  };

  return (
    <div className="game">
      <div className="tokens">Tokens: {tokens}</div>
      <div className="canvas-game">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="canvas-game">
        <canvas ref={canvasAnimRef}></canvas>
      </div>

      {/* <canvas className="canvas-game" ref={canvasAnimRef}></canvas> */}
      <div className="controls">
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={tokens <= 0}
        >
          Fire Rocket
        </button>
        <div className="hold-bar">
          <div
            className="hold-duration"
            style={{ width: `${currentHoldDuration * 10}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
