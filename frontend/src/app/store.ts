import { configureStore } from '@reduxjs/toolkit';
import timeIntervalReducer from '../features/timeInterval/timeIntervalSlice';
import chartReducer from '../features/chart/chartSlice';
import walletReducer from '../features/wallet/walletSlice';

export const store = configureStore({
  reducer: {
    timeInterval: timeIntervalReducer,
    chart: chartReducer,
    wallet: walletReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;