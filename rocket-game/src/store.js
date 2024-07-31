// src/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit";

const TARGET_SIZE = 50;

const isHit = (rocket, target) => {
  const distance = Math.sqrt(
    (target.x - rocket.x) ** 2 + (target.y - rocket.y) ** 2,
  );

  if (distance < TARGET_SIZE) {
    return true;
  }

  return false;
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomTargets = () => {
  const newTargets = [];

  for (let i = 0; i < 10; i++) {
    newTargets.push({
      x: getRandomInt(300, 1200),
      y: getRandomInt(100, 450),
    });
  }

  return newTargets;
};

const initialState = {
  isFiring: false,
  rocketPosition: { x: 0, y: 0 },
  launchTime: null,
  holdDuration: 0,
  tokens: 10, // Initial number of tokens
  targets: randomTargets(),
  hitTargets: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    startFiring: (state) => {
      state.isFiring = true;
      state.launchTime = Date.now();
    },
    stopFiring: (state) => {
      state.isFiring = false;
      state.holdDuration = (Date.now() - state.launchTime) / 1000; // in seconds
      state.launchTime = null;
      state.tokens -= 1;
    },
    updateRocketPosition: (state, action) => {
      state.rocketPosition = action.payload;

      state.targets = state.targets.filter((target) => {
        if (isHit(state.rocketPosition, target)) {
          state.hitTargets += 1;
          return false;
        }

        return true;
      });
    },
    resetHoldDuration: (state) => {
      state.holdDuration = 0;
    },
    endRound: (state) => {
      fetch("http://localhost:3001/fires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hitTargets: state.hitTargets }),
      });

      state.rocketPosition = initialState.rocketPosition;
      state.targets = randomTargets();
      state.hitTargets = 0;
    },
  },
});

export const {
  startFiring,
  stopFiring,
  updateRocketPosition,
  resetHoldDuration,
  endRound,
} = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
