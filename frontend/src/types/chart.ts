export interface CryptoAsset {
  id?: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
}

export interface ChartData {
  timestamp: number;
  price: number;
  volume?: number;
  high?: number;
  low?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  upperBand?: number;
  lowerBand?: number;
  adx?: number;
  obv?: number;
  vwap?: number;
  atr?: number;
  cci?: number;
  stoch?: number;
  roc?: number;
  mfi?: number;
}

export interface IndicatorConfig {
  enabled: boolean;
  color: string;
  lineWidth: number;
}

export interface ChartConfig {
  rsi: IndicatorConfig;
  macd: IndicatorConfig;
  bollingerBands: IndicatorConfig;
  adx: IndicatorConfig;
  obv: IndicatorConfig;
  vwap: IndicatorConfig;
  atr: IndicatorConfig;
  cci: IndicatorConfig;
  stoch: IndicatorConfig;
  roc: IndicatorConfig;
  mfi: IndicatorConfig;
  candlestick: IndicatorConfig;
}

export interface ChartProps {
  selectedAsset: CryptoAsset;
  timeInterval: string;
  onAssetChange: (asset: CryptoAsset) => void;
  onIndicatorToggle: (indicator: keyof ChartConfig) => void;
}
