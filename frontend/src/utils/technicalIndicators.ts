import { ChartData } from '../types/chart';
import { SMA, EMA, ADX, OBV, VWAP, ATR, CCI, Stochastic, ROC, MFI } from 'technicalindicators';

// Calculate RSI with trading signals
export const calculateRSI = (data: ChartData[], period = 14): {
  values: number[];
  signals: string[];
} => {
  const prices = data.map(d => d.price);
  const rsi = [];
  const signals = [];
  
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
    
    // Generate signals
    if (rsiValue > 70) {
      signals.push('overbought');
    } else if (rsiValue < 30) {
      signals.push('oversold');
    } else {
      signals.push('neutral');
    }
  }
  
  return {
    values: rsi,
    signals
  };
};

// Calculate MACD with trading signals
export const calculateMACD = (data: ChartData[], 
  fastPeriod = 12, 
  slowPeriod = 26, 
  signalPeriod = 9
): {
  macd: number[];
  signal: number[];
  histogram: number[];
  signals: string[];
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
  
  const histogram = macdLine.map((value, i) => value - signalLine[i]);
  const signals = [];
  
  for (let i = 0; i < histogram.length - 1; i++) {
    // Bullish signal when histogram crosses above zero
    if (histogram[i] < 0 && histogram[i + 1] > 0) {
      signals.push('buy');
    }
    // Bearish signal when histogram crosses below zero
    else if (histogram[i] > 0 && histogram[i + 1] < 0) {
      signals.push('sell');
    }
    else {
      signals.push('neutral');
    }
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
    signals
  };
};

// Calculate Bollinger Bands with trading signals
export const calculateBollingerBands = (data: ChartData[], 
  period = 20, 
  multiplier = 2
): {
  upperBand: number[];
  middleBand: number[];
  lowerBand: number[];
  signals: string[];
} => {
  const prices = data.map(d => d.price);
  const upperBand = [];
  const middleBand = [];
  const lowerBand = [];
  const signals = [];
  
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
    
    // Generate signals
    if (prices[i] > upperBand[i - period]) {
      signals.push('sell');
    } else if (prices[i] < lowerBand[i - period]) {
      signals.push('buy');
    } else {
      signals.push('neutral');
    }
  }
  
  return {
    upperBand,
    middleBand,
    lowerBand,
    signals
  };
};

// Calculate Moving Averages
export const calculateMovingAverages = (data: ChartData[], 
  shortPeriod = 50, 
  longPeriod = 200
): {
  shortMA: number[];
  longMA: number[];
  signals: string[];
} => {
  const prices = data.map(d => d.price);
  const shortMA = SMA.calculate({
    period: shortPeriod,
    values: prices
  });
  
  const longMA = SMA.calculate({
    period: longPeriod,
    values: prices
  });
  
  const signals = [];
  
  for (let i = 0; i < shortMA.length - 1; i++) {
    // Bullish signal when short MA crosses above long MA
    if (shortMA[i] < longMA[i] && shortMA[i + 1] > longMA[i + 1]) {
      signals.push('buy');
    }
    // Bearish signal when short MA crosses below long MA
    else if (shortMA[i] > longMA[i] && shortMA[i + 1] < longMA[i + 1]) {
      signals.push('sell');
    }
    else {
      signals.push('neutral');
    }
  }
  
  return {
    shortMA,
    longMA,
    signals
  };
};

// Calculate Volume
export const calculateVolume = (data: ChartData[], period = 20): {
  volume: number[];
  volumeMA: number[];
  signals: string[];
} => {
  const volume = data.map(d => d.volume || 0);
  const volumeMA = SMA.calculate({
    period,
    values: volume
  });
  
  const signals = [];
  
  for (let i = 0; i < volume.length - 1; i++) {
    // Bullish signal when volume spikes and price increases
    if (volume[i] > volumeMA[i] * 1.5 && data[i + 1].price > data[i].price) {
      signals.push('buy');
    }
    // Bearish signal when volume spikes and price decreases
    else if (volume[i] > volumeMA[i] * 1.5 && data[i + 1].price < data[i].price) {
      signals.push('sell');
    }
    else {
      signals.push('neutral');
    }
  }
  
  return {
    volume,
    volumeMA,
    signals
  };
};

// Calculate ADX
export const calculateADX = (data: ChartData[], period = 14): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const adxResults = ADX.calculate({ period, high: highs, low: lows, close: closes });
  const adxValues = adxResults.map(result => result.adx);
  const signals = adxValues.map(value => (value > 25 ? 'strong' : 'weak'));
  return { values: adxValues, signals };
};

// Calculate OBV
export const calculateOBV = (data: ChartData[]): {
  values: number[];
  signals: string[];
} => {
  const closes = data.map(d => d.price);
  const volumes = data.map(d => d.volume || 0);
  const obvValues = OBV.calculate({ close: closes, volume: volumes });
  const signals = obvValues.map((value, i) => {
    if (i === 0) return 'neutral';
    return value > obvValues[i - 1] ? 'buy' : 'sell';
  });
  return { values: obvValues, signals };
};

// Calculate VWAP
export const calculateVWAP = (data: ChartData[]): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const volumes = data.map(d => d.volume || 0);
  const vwapValues = VWAP.calculate({ high: highs, low: lows, close: closes, volume: volumes });
  const signals = vwapValues.map(() => 'neutral'); // VWAP signals can be customized
  return { values: vwapValues, signals };
};

// Calculate ATR
export const calculateATR = (data: ChartData[], period = 14): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const atrValues = ATR.calculate({ period, high: highs, low: lows, close: closes });
  const signals = atrValues.map(() => 'neutral'); // ATR signals can be customized
  return { values: atrValues, signals };
};

// Calculate CCI
export const calculateCCI = (data: ChartData[], period = 20): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const cciValues = CCI.calculate({ period, high: highs, low: lows, close: closes });
  const signals = cciValues.map(value => {
    if (value > 100) return 'overbought';
    if (value < -100) return 'oversold';
    return 'neutral';
  });
  return { values: cciValues, signals };
};

// Calculate Stochastic
export const calculateStoch = (data: ChartData[], period = 14, signalPeriod = 3): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const stochInput = {
    high: highs,
    low: lows,
    close: closes,
    period,
    signalPeriod,
  };
  const stochValues = Stochastic.calculate(stochInput);
  const values = stochValues.map(v => v.k);
  const signals = values.map(value => {
    if (value > 80) return 'overbought';
    if (value < 20) return 'oversold';
    return 'neutral';
  });
  return { values, signals };
};

// Calculate ROC
export const calculateROC = (data: ChartData[], period = 12): {
  values: number[];
  signals: string[];
} => {
  const prices = data.map(d => d.price);
  const rocValues = ROC.calculate({ period, values: prices });
  const signals = rocValues.map(value => {
    if (value > 0) return 'buy';
    if (value < 0) return 'sell';
    return 'neutral';
  });
  return { values: rocValues, signals };
};

// Calculate MFI
export const calculateMFI = (data: ChartData[], period = 14): {
  values: number[];
  signals: string[];
} => {
  const highs = data.map(d => d.high || 0);
  const lows = data.map(d => d.low || 0);
  const closes = data.map(d => d.price);
  const volumes = data.map(d => d.volume || 0);
  const mfiValues = MFI.calculate({ high: highs, low: lows, close: closes, volume: volumes, period });
  const signals = mfiValues.map(value => {
    if (value > 80) return 'overbought';
    if (value < 20) return 'oversold';
    return 'neutral';
  });
  return { values: mfiValues, signals };
};

// Calculate All Indicators with signals
export const calculateAllIndicators = (data: ChartData[]): {
  data: ChartData[];
  signals: {
    rsi: string[];
    macd: string[];
    bollinger: string[];
    ma: string[];
    volume: string[];
    adx: string[];
    obv: string[];
    vwap: string[];
    atr: string[];
    cci: string[];
    stoch: string[];
    roc: string[];
    mfi: string[];
  };
} => {
  // Calculate indicators
  const rsiResult = calculateRSI(data);
  const macdResult = calculateMACD(data);
  const bollingerResult = calculateBollingerBands(data);
  const maResult = calculateMovingAverages(data);
  const volumeResult = calculateVolume(data);
  const adxResult = calculateADX(data);
  const obvResult = calculateOBV(data);
  const vwapResult = calculateVWAP(data);
  const atrResult = calculateATR(data);
  const cciResult = calculateCCI(data);
  const stochResult = calculateStoch(data);
  const rocResult = calculateROC(data);
  const mfiResult = calculateMFI(data);

  // Helper function to pad indicator values with undefined at the start
  const padValues = (values: number[], length: number): (number | undefined)[] => {
    const padding = new Array(length - values.length).fill(undefined);
    return padding.concat(values);
  };

  // Pad indicator values to align with data length
  const paddedAdxValues = padValues(adxResult.values, data.length);
  const paddedVwapValues = padValues(vwapResult.values, data.length);
  const paddedMfiValues = padValues(mfiResult.values, data.length);
  const paddedObvValues = padValues(obvResult.values, data.length);
  const paddedCciValues = padValues(cciResult.values, data.length);
  const paddedStochValues = padValues(stochResult.values, data.length);
  const paddedRocValues = padValues(rocResult.values, data.length);

  // Create new data array with indicators
  const newData = data.map((d, i) => ({
    ...d,
    rsi: i >= 14 ? rsiResult.values[i - 14] : undefined,
    macd: i >= 26 ? macdResult.macd[i - 26] : undefined,
    macdSignal: i >= 26 + 9 ? macdResult.signal[i - 26 - 9] : undefined,
    macdHistogram: i >= 26 + 9 ? macdResult.histogram[i - 26 - 9] : undefined,
    upperBand: i >= 20 ? bollingerResult.upperBand[i - 20] : undefined,
    middleBand: i >= 20 ? bollingerResult.middleBand[i - 20] : undefined,
    lowerBand: i >= 20 ? bollingerResult.lowerBand[i - 20] : undefined,
    shortMA: i >= 50 ? maResult.shortMA[i - 50] : undefined,
    longMA: i >= 200 ? maResult.longMA[i - 200] : undefined,
    volume: volumeResult.volume[i],
    volumeMA: i >= 20 ? volumeResult.volumeMA[i - 20] : undefined,
    adx: paddedAdxValues[i],
    obv: paddedObvValues[i],
    vwap: paddedVwapValues[i],
    atr: i >= 14 ? atrResult.values[i - 14] : undefined,
    cci: paddedCciValues[i],
    stoch: paddedStochValues[i],
    roc: paddedRocValues[i],
    mfi: paddedMfiValues[i],
  }));

  // Combine signals from all indicators
  const signals = {
    rsi: rsiResult.signals,
    macd: macdResult.signals,
    bollinger: bollingerResult.signals,
    ma: maResult.signals,
    volume: volumeResult.signals,
    adx: adxResult.signals,
    obv: obvResult.signals,
    vwap: vwapResult.signals,
    atr: atrResult.signals,
    cci: cciResult.signals,
    stoch: stochResult.signals,
    roc: rocResult.signals,
    mfi: mfiResult.signals,
  };

  return { data: newData, signals };
};
