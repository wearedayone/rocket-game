// src/components/Game.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startFiring, stopFiring, updateRocketPosition, resetHoldDuration, removeTargets, resetTargets, resetScore } from '../store';

const Game = () => {
  const canvasRef = useRef(null);
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens, targets, score } = useSelector((state) => state.game);
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);
  const rocketImageRef = useRef(null); // Reference for the rocket image
  
  useEffect(() =>{
    startNewRound();
  }, []);

  useEffect(() => {
    drawTargets();
  }, [targets])

  
  const drawTargets = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    for(let target of targets) {
      if (target.dead) {
        ctx.fillStyle = target.color;
        ctx.beginPath();
        for (let i = 0; i < 10; i ++) {
          const x = canvas.width - target.width;
          const y = canvas.height - target.height;
          const diffx = Math.random() * 100 - 50;
          const diffy = Math.random() * 100 - 50;
          const radius = Math.random() * 10;

          ctx.arc(x + diffx, y + diffy, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = target.color;
        ctx.beginPath();
        ctx.arc(canvas.width - target.width, canvas.height - target.height, target.radius, 0, 2 * Math.PI);
        ctx.fill();        
      }

    }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const rocketImage = new Image();
    rocketImage.src = '/images/rocket_1.png'; // Update the path to your image
    rocketImage.onload = () => {
      rocketImageRef.current = rocketImage;
      draw(); // Initial draw after loading the image
    };

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawLauncher = () => {
      ctx.fillStyle = 'gray';
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
        ctx.translate( rocketPosition.x + 55, canvas.height - rocketPosition.y - 100 );
        ctx.rotate(angle);
        ctx.drawImage(
          rocketImageRef.current,
          0,// rocketPosition.x + 55,
          // canvas.height - rocketPosition.y - 100,
          0,
          50, // width of the rocket image
          50  // height of the rocket image
        );
        ctx.rotate( -angle );
        ctx.translate( -(rocketPosition.x + 55), -(canvas.height - rocketPosition.y - 100 ));
        // ctx.rotate(30);

      }
    };

    const drawLand = () => {
      ctx.fillStyle = 'green';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    };

    const draw = () => {

      if (rocketPosition.x !== 0 && rocketPosition.y !== 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLand();
      drawLauncher();
      drawRocket();
      drawTargets();
    };

    draw();

    for (let item of targets) {
      if (rocketPosition.x + 55 >= canvas.width - item.width - item.radius 
      && rocketPosition.x + 55 <= canvas.width - item.width + item.radius
      && canvas.height - rocketPosition.y - 100 >= canvas.height - item.height - item.radius
      && canvas.height - rocketPosition.y - 100 <= canvas.height - item.height + item.radius) {
        dispatch(removeTargets(item.id));
        break;
      }
    } 
  }, [rocketPosition, targets]);

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
    let x = v0 * t * Math.cos(angle);// - v0 * 2 * Math.cos(angle) ;
    let y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;
    let rAngle = Math.atan((v0*Math.sin(angle)-g*t)/(v0*Math.cos(angle))); // current angle of rocket
    
    return { x, y, rAngle};
  };

  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const g = 9.81; // gravity
        const v0 = holdDuration * 20; // initial velocity based on hold duration
        const angle = Math.PI / 3; // 60 degrees
        launchTimeRef.current = Date.now();

        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 100; // in seconds
          const { x, y, rAngle } = calculateRocketPosition(t, v0, angle);

          if (y < 0) {
            clearInterval(rocketIntervalRef.current);
            setTimeout(() => {
              startNewRound();
            }, 1000);
          } else {
            dispatch(updateRocketPosition({ x, y, rAngle }));
          }
        }, 40);
      };

      launchRocket();
      // dispatch(resetHoldDuration());
    }

    return () => clearInterval(rocketIntervalRef.current);
  }, [isFiring, holdDuration, dispatch]);

  const startNewRound = () => {
    dispatch(updateRocketPosition({ x: 0, y: 0, rAngle: 0 })); // Reset position after it falls
    const targetAmount = Math.round(Math.random() * 10) % 2 + 2;
    let _targets = [];
    for (let i = 0; i < targetAmount; i ++) {
      let _target = {
        id: i, 
        width: 100 + i * 80, 
        height: Math.random() * 100 + 100, 
        radius: Math.random() * 25 + 20, 
        color: 'blue' 
      };
      
      _targets.push(_target);
    }
    dispatch(resetTargets(_targets));

  }
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
      <div className="tokens">Tokens: {tokens} Score: {score}</div>
      <canvas ref={canvasRef}></canvas>
      <div className="controls">
        <button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} disabled={tokens <= 0}>
          Fire Rocket
        </button>
        <div className="hold-bar">
          <div className="hold-duration" style={{ width: `${currentHoldDuration * 10}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
