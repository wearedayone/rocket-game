// src/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { generateRandomTargetPositions } from "./components/utils";

const initialState = {
  isFiring: false,
  rocketPosition: { x: 0, y: 0, rAngle: 0 },
  launchTime: null,
  holdDuration: 0,
  tokens: 10, // Initial number of tokens
  points: 0, // Initial points
  targetPositions: generateRandomTargetPositions(), // Initial target positions
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
    },
    resetHoldDuration: (state) => {
      state.holdDuration = 0;
    },
    addPoints: (state, action) => {
      state.points += action.payload;
    },
    resetTargetPositions: (state) => {
      state.targetPositions = generateRandomTargetPositions();
    },
  },
});

export const {
  startFiring,
  stopFiring,
  updateRocketPosition,
  resetHoldDuration,
  resetTargetPositions,
  addPoints,
} = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
