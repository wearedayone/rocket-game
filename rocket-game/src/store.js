// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  isFiring: false,
  rocketPosition: { x: 0, y: 0 },
  launchTime: null,
  holdDuration: 0,
  tokens: 10, // Initial number of tokens
  points: 0,
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
    increasePoint: (state) => {
      state.points += 1;
    },
  },
});

export const { startFiring, stopFiring, updateRocketPosition, resetHoldDuration, increasePoint } = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
