import { configureStore } from '@reduxjs/toolkit';
import timeIntervalReducer from '../features/timeInterval/timeIntervalSlice';

export const store = configureStore({
  reducer: {
    timeInterval: timeIntervalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;