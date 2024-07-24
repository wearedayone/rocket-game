// src/components/Game.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startFiring, stopFiring, updateRocketPosition, resetHoldDuration } from '../store';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateCenterOfObject(target) {
  const center = {
    x: (target.x1 + target.x2) / 2,
    y: (target.y1 + target.y2) / 2,
  }

  return center
}

function isTouched(target1, target2) {
  const {x1, y1, x2, y2} = target2
  const {x, y} = target1

  if (x >= x1 && x <= x2 && y <= y2 && y >= y1) return true
  return false
}

function calculateDistance(target1, target2) {
  const center1 = calculateCenterOfObject(target1) 
  const center2 = calculateCenterOfObject(target2) 

  const distance = Math.sqrt(Math.pow(center2.x - center1.x, 2), Math.pow(center2.y - center1.y, 2))

  return distance
}

const Game = () => {
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens } = useSelector((state) => state.game);
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState(null)
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);
  const [rocketRotate, setRocketRotate] = useState(0)

  const rocketRef = useRef(null)
  const touchedTargets = useRef({}) 
  const lastYRef = useRef(0)

  const generateTargets = (amount) => {
    if (!targets) {
      const targetAmount = amount ?? 4 // amount of target for shooting

      const size = 50 // 50 px
      let xCoords = []
      let yCoords = []
      let index = 0

      while (index < targetAmount) {
        let isValid = true
        if (!xCoords.length) {
          // generate first target
          xCoords.push(getRandomInt(100, 400))
          yCoords.push(getRandomInt(200, 800))
          index++
        } else {
          const newTarget = {
            x1: getRandomInt(100, 400),
            y1: getRandomInt(200, 800) ,
          }
          // check if the next target is overlap old target or not
          for (let i = 0; i < xCoords.length; i++) {
            const target1 = {
              x1: xCoords[i],
              y1: yCoords[i],
              x2: xCoords[i] - size,
              y2: yCoords[i] + size 
            }
            const target2 = {
              ...newTarget,
              x2: newTarget.x1 - size,
              y2: newTarget.y1 + size 
            }
            const distance = calculateDistance(target1, target2)
            if ( distance < size + 1) {
              isValid = false
              break
            }
          }

          if (isValid) {
            xCoords.push(newTarget.x1)
            yCoords.push(newTarget.y1)
            isValid = true
            index++
          }
        }
      }

      const targets = xCoords.map((x, index) => ({
        x1: x, 
        y1: yCoords[index], 
        x2: x + size, 
        y2: yCoords[index] + size,
        touched: false,
        score: 10
      }))
      setTargets(targets)
    }


  }

  useEffect(() => {
    if (isFiring) {
      holdStartTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsedTime = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
        
        // prevent exceeding max power
        if (elapsedTime < 10) {
          setCurrentHoldDuration(elapsedTime);
        }
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isFiring]);

  const calculateRocketPosition = (t, v0, angle) => {
    const g = 9.81; // gravity
    const x = v0 * t * Math.cos(angle);
    const y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;
    return { x, y };
  };

  useEffect(() => {
    if (!isFiring && holdDuration > 0 && dispatch) {
      const launchRocket = () => {
        const g = 9.81; // gravity
        const v0 = holdDuration * 30; // initial velocity based on hold duration
        const angle = Math.PI / 4; // 45 degrees
        launchTimeRef.current = Date.now();
        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 500; // in seconds
          const { x, y } = calculateRocketPosition(t, v0, angle);

          if (y < lastYRef.current) {
            const degreePerUnit = 90 / (lastYRef.current / 2)
            const rotateValue = Math.min(degreePerUnit * (lastYRef.current - y), 90)

            setRocketRotate(rotateValue)
          } else {
            lastYRef.current = y
          }

          const { x: rocketX, y: rocketY} = rocketRef.current.getClientRects()[0]
          const _touchedTargets = targets.filter(target => isTouched({x: window.innerWidth - rocketX, y: window.innerHeight - rocketY}, target))
          const _touchedEntries = _touchedTargets.map(target => [`${target.x1}${target.y1}`, {...target, touched: true}])
          const touched = {...touchedTargets.current, ...Object.fromEntries(_touchedEntries)}
          touchedTargets.current = touched
          const newTargets = targets.map((target) => ({
            ...target,
            touched: !!touchedTargets.current[`${target.x1}${target.y1}`]
          }))

          setTargets(newTargets)

          if (y < 0 || window.innerWidth - rocketX < 0) {
            clearInterval(rocketIntervalRef.current);
            dispatch(updateRocketPosition({ x: 0, y: 0 })); // Reset position after it falls
            dispatch(resetHoldDuration());
            setCurrentHoldDuration(0);
            setRocketRotate(0);
            lastYRef.current = 0;
            const touched = Object.values(touchedTargets.current).filter(target => target.touched)
            const newScore = touched.reduce((prev, curr) => curr.score + prev, 0)
            setScore(newScore)
          } else {
            
            dispatch(updateRocketPosition({ x, y: -y }));
          }
        }, 30);
      };

      launchRocket();
    }

    return () => clearInterval(rocketIntervalRef.current);
  }, [isFiring, holdDuration, dispatch]);

  useEffect(() => {
    generateTargets()
  }, [])

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
      <div className="score">Score: {score}</div>
      <div className="rocket-launcher">
        <div className="rocket" style={{ 
          transform: `translate(${rocketPosition.x}px, ${rocketPosition.y}px) rotate(${rocketRotate}deg)` ,
          }} ref={rocketRef}>
            🚀
          </div>
      </div>
      {targets?.map(target => (
        <div className={`target ${target.touched ? 'explosion' : ''}`} key={`${target.x1}${target.y1}`} style={{
          right: target.x1,
          bottom: target.y1,
        }}></div>
      ))}

      <div className="land"></div>
      <div className="controls">
        <button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} disabled={tokens <= 0}>
          Fire Rocket
        </button>
        <div className="hold-bar">
          <div className="hold-duration" style={{ width: `${(isFiring ? currentHoldDuration : holdDuration) * 10}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
