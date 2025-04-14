import { ChartData } from '../types/chart';
import { SMA, EMA } from 'technicalindicators';

// Calculate RSI
export const calculateRSI = (data: ChartData[], period = 14): number[] => {
  const prices = data.map(d => d.price);
  const rsi = [];
  
  for (let i = period; i < prices.length; i++) {
    const gains = [];
    const losses = [];
    
    for (let j = i - period; j < i; j++) {
      const change = prices[j + 1] - prices[j];
      if (change > 0) gains.push(change);
      else losses.push(-change);
    }
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
};

// Calculate MACD
export const calculateMACD = (data: ChartData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: number[];
  signal: number[];
} => {
  const prices = data.map(d => d.price);
  const fastEMA = EMA.calculate({
    period: fastPeriod,
    values: prices
  });
  
  const slowEMA = EMA.calculate({
    period: slowPeriod,
    values: prices
  });
  
  const macdLine = fastEMA.map((value, i) => value - slowEMA[i]);
  const signalLine = EMA.calculate({
    period: signalPeriod,
    values: macdLine
  });
  
  return {
    macd: macdLine,
    signal: signalLine
  };
};

// Calculate Bollinger Bands
export const calculateBollingerBands = (data: ChartData[], period = 20, multiplier = 2): {
  upperBand: number[];
  middleBand: number[];
  lowerBand: number[];
} => {
  const prices = data.map(d => d.price);
  const upperBand = [];
  const middleBand = [];
  const lowerBand = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i);
    const sma = SMA.calculate({
      period,
      values: slice
    })[0];
    
    const stdDev = Math.sqrt(
      slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    );
    
    upperBand.push(sma + (stdDev * multiplier));
    middleBand.push(sma);
    lowerBand.push(sma - (stdDev * multiplier));
  }
  
  return {
    upperBand,
    middleBand,
    lowerBand
  };
};

// Calculate all indicators
export const calculateAllIndicators = (data: ChartData[]): ChartData[] => {
  const rsi = calculateRSI(data);
  const { macd, signal } = calculateMACD(data);
  const { upperBand, lowerBand } = calculateBollingerBands(data);
  
  // Create new data array with indicators
  return data.map((d, i) => ({
    ...d,
    rsi: i >= 14 ? rsi[i - 14] : undefined,
    macd: i >= 26 ? macd[i - 26] : undefined,
    macdSignal: i >= 26 + 9 ? signal[i - 26 - 9] : undefined,
    upperBand: i >= 20 ? upperBand[i - 20] : undefined,
    lowerBand: i >= 20 ? lowerBand[i - 20] : undefined
  }));
};