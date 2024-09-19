// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  isFiring: false,
  rocketPosition: { x: 0, y: 0, rAngle:0 },
  targets: [],
  launchTime: null,
  holdDuration: 0,
  tokens: 10,
  score: 0 // Initial number of tokens
};

const gameSlice = createSlice({
  name: 'game',
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
    removeTargets: (state, action) => {
      let removeId = action.payload;
      state.targets[removeId].color = 'red';
      state.targets[removeId].dead = true;
      state.score ++;
    },
    resetTargets: (state, action) => {
      state.targets = action.payload;
    },
    resetScore: (state) => {
      state.score = 0;
    }
  },
});

export const { startFiring, stopFiring, updateRocketPosition, resetHoldDuration, removeTargets, resetTargets, resetScore } = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
