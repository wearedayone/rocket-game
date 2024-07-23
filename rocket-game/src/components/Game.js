// src/components/Game.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startFiring, stopFiring, updateRocketPosition, resetHoldDuration } from '../store';

const Game = () => {
  const dispatch = useDispatch();
  const { isFiring, rocketPosition, holdDuration, tokens } = useSelector((state) => state.game);
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0);
  const intervalRef = useRef(null);
  const rocketIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const launchTimeRef = useRef(null);

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
    const x = v0 * t * Math.cos(angle);
    const y = v0 * t * Math.sin(angle) - 0.5 * g * t * t;
    return { x, y };
  };

  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const g = 9.81; // gravity
        const v0 = holdDuration * 30; // initial velocity based on hold duration
        const angle = Math.PI / 4; // 45 degrees
        launchTimeRef.current = Date.now();
        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 500; // in seconds
          const { x, y } = calculateRocketPosition(t, v0, angle);
          if (y < 0) {
            clearInterval(rocketIntervalRef.current);
            dispatch(updateRocketPosition({ x: 0, y: 0 })); // Reset position after it falls
          } else {
            
            dispatch(updateRocketPosition({ x, y: -y }));
          }
        }, 100);
      };

      launchRocket();
      dispatch(resetHoldDuration());
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
      <div className="rocket-launcher">
        <div className="rocket" style={{ transform: `translate(${rocketPosition.x}px, ${rocketPosition.y}px)` }}>
          🚀
        </div>
      </div>
      <div className="target target1"></div>
      <div className="target target2"></div>
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
