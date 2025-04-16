import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CryptoAsset, ChartConfig } from '../../types/chart';

const initialState = {
  selectedAsset: {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0,
    price: 0,
  } as CryptoAsset,
  config: {
    rsi: {
      enabled: true,
      color: '#f44336',
      lineWidth: 1,
    },
    macd: {
      enabled: true,
      color: '#ff9800', // changed to orange
      lineWidth: 1,
    },
    bollingerBands: {
      enabled: true,
      color: '#ff9800',
      lineWidth: 1,
    },
    adx: {
      enabled: false,
      color: '#9c27b0',
      lineWidth: 1,
    },
    obv: {
      enabled: false,
      color: '#3f51b5',
      lineWidth: 1,
    },
    vwap: {
      enabled: true,
      color: '#00bcd4',
      lineWidth: 1,
    },
    atr: {
      enabled: false,
      color: '#ff5722',
      lineWidth: 1,
    },
    cci: {
      enabled: false,
      color: '#795548',
      lineWidth: 1,
    },
    stoch: {
      enabled: false,
      color: '#607d8b',
      lineWidth: 1,
    },
    roc: {
      enabled: false,
      color: '#009688',
      lineWidth: 1,
    },
    mfi: {
      enabled: false,
      color: '#8bc34a',
      lineWidth: 1,
    },
    candlestick: {
      enabled: false,
      color: '#000000',
      lineWidth: 1,
    },
  } as ChartConfig,
};

export const chartSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    setSelectedAsset: (state, action: PayloadAction<CryptoAsset>) => {
      state.selectedAsset = action.payload;
    },
    toggleIndicator: (state, action: PayloadAction<keyof ChartConfig>) => {
      state.config[action.payload].enabled = !state.config[action.payload].enabled;
    },
  },
});

export const { setSelectedAsset, toggleIndicator } = chartSlice.actions;

export default chartSlice.reducer;