import axios from 'axios';
import { ChartData } from '../types/chart';
import { TimeInterval } from '../features/timeInterval/timeIntervalSlice';

// Convert time interval to days for CoinGecko API
const TIME_INTERVAL_TO_DAYS: { [key in TimeInterval]: number } = {
  '1m': 1/24/60, // 1 minute
  '5m': 5/24/60, // 5 minutes
  '10m': 10/24/60, // 10 minutes
  '30m': 30/24/60, // 30 minutes
  '1h': 1/24, // 1 hour
  '1d': 1, // 1 day
  '1y': 365, // 1 year
};

interface CoinGeckoPriceData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinGeckoAsset {
  id: string;
  symbol: string;
  name: string;
}

export const coingeckoApi = {
  baseUrl: 'https://api.coingecko.com/api/v3',

  async getSupportedAssets(): Promise<CoinGeckoAsset[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/list`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  },

  async getHistoricalData(
    assetId: string,
    days: number,
    interval: TimeInterval
  ): Promise<ChartData[]> {
    try {
      const response = await axios.get<CoinGeckoPriceData>(
        `${this.baseUrl}/coins/${assetId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days,
            interval: interval === '1y' ? 'daily' : 'hourly',
          },
        }
      );

      // Convert CoinGecko data to our ChartData format
      const data: ChartData[] = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
        // We'll calculate these indicators later
        rsi: undefined,
        macd: undefined,
        macdSignal: undefined,
        upperBand: undefined,
        lowerBand: undefined,
      }));

      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  },

  async getAssetDetails(assetId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw error;
    }
  },
};