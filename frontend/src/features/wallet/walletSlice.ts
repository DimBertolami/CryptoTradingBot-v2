import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  balance: number; // Added to match expected type
  // Add other properties as needed
}

interface WalletState {
  assets: CryptoAsset[];
}

const initialState: WalletState = {
  assets: [],
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAssets(state, action: PayloadAction<CryptoAsset[]>) {
      state.assets = action.payload;
    },
    addAsset(state, action: PayloadAction<CryptoAsset>) {
      state.assets.push(action.payload);
    },
    // Add other reducers as needed
  },
});

export const { setAssets, addAsset } = walletSlice.actions;

export default walletSlice.reducer;
