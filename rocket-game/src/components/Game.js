// src/components/Game.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startFiring, stopFiring, updateRocketPosition, resetHoldDuration, increasePoint } from '../store';

/**
 * Game
 * @dev Fire rocket
 */
const Game = () => {
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens, points } = useSelector((state) => state.game);
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);
  const [targetList, setTargetList] = useState([]);
  const [rocketAngle, setRocketAngle] = useState(45)

  /**
   * Generate Random Target
   */
  const generateRandomTarget = () => {
    const randomX = Math.random() * 100 + 200;
    const randomY = Math.random() * 100 + 100;
    // const randomX = Math.random() * 200 + 700;
    // const randomY = Math.random() * 200 + 100;
    return { x: randomX, y: randomY, isExploding: false }
  }

  useEffect(() => {
    setTargetList([
      generateRandomTarget(),
      generateRandomTarget(),
    ])
  }, [points])

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


  /**
   * Calculate Rocket Position
   */
  const calculateRocketPosition = (t, v0, angle) => {
    const g = 9.81; // gravity
    const x = v0 * t * Math.cos(angle);
    const y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;

    const vy = v0 * Math.sin(angle) + g * t; // vertical velocity
    const vx = v0 * Math.cos(angle); // horizontal velocity
    const rocketAngle = Math.atan2(vy, vx) * (180 / Math.PI); // Convert to degrees

    return { x, y, rocketAngle };
  };

  /**
   * Calculate Touch
   */
  const calculateTouch = useCallback((x, y) => {
    const rocketX = x + 90;
    const rocketY = y + 90;

    const remains = targetList.filter((item, index) => {
      const distance = Math.sqrt(Math.abs(rocketX - item.x) ** 2 + Math.abs(rocketY - item.y) ** 2)

      const isTouched = distance <= 25
      if (isTouched) {
        setTargetList(targetList.map((item, i) => ({ ...item, isExploding: i === index })))
      }

      return !isTouched;
    })

    return remains.length !== targetList.length
  }, [targetList])


  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const v0 = holdDuration * 30; // initial velocity based on hold duration
        const angle = Math.PI / 4; // 45 degrees
        launchTimeRef.current = Date.now();
        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 500; // in seconds
          const { x, y, rocketAngle } = calculateRocketPosition(t, v0, angle);

          setRocketAngle(rocketAngle)

          // Calculate Touch
          const isTouch = calculateTouch(x, y);
          if (isTouch) {
            clearInterval(rocketIntervalRef.current);

            // Waiting for animation done and reset scene
            setTimeout(() => {
              dispatch(increasePoint());
              dispatch(updateRocketPosition({ x: 0, y: 0 }));
              setRocketAngle(45)
            }, 600)
          } else if (y < 0) {
            clearInterval(rocketIntervalRef.current);
            dispatch(updateRocketPosition({ x: 0, y: 0 })); // Reset position after it falls
            setRocketAngle(45)
          } else {
            dispatch(updateRocketPosition({ x, y: -y }));
          }
        }, 100);
      };

      launchRocket();
      dispatch(resetHoldDuration());
    }
  }, [isFiring, holdDuration, dispatch, calculateTouch]);

  /**
   * Handle Mouse Down
   */
  const handleMouseDown = () => {
    if (tokens > 0) {
      dispatch(startFiring());
    }
  };

  /**
   * Handle Mouse Up
   */
  const handleMouseUp = () => {
    const finalHoldDuration = (Date.now() - holdStartTimeRef.current) / 1000; // in seconds
    setCurrentHoldDuration(finalHoldDuration);
    dispatch(stopFiring());
  };

  return (
    <div className="game">
      <div className="tokens">Tokens: {tokens}</div>
      <div className="points">Points: {points}</div>
      <div className="rocket-launcher">
        <div className="rocket" style={{ transform: `translate(${rocketPosition.x}px, ${rocketPosition.y}px) rotate(${rocketAngle}deg)` }}>
          <img src='/rocket.png' alt='Rocket' width='30px' height='30px' />
        </div>
      </div>

      {
        targetList.length > 0 && targetList.map((item, index) => (
          <div
            key={`target-${index}`}
            className={`target ${item.isExploding ? 'explode' : ''}`}
            style={{ left: `${item.x}px`, bottom: `${item.y}px` }}
          >
          </div>
        ))
      }

      <div className="land"></div>
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
