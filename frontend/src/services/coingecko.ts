import axios from 'axios';
import { ChartData } from '../types/chart';
import { TimeInterval } from '../features/timeInterval/timeIntervalSlice';

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
      const params: any = {
        vs_currency: 'usd',
        days: days,
      };
      if (interval === '1y') {
        params.interval = 'daily';
      }
      // For other intervals, do not add the interval parameter to avoid 401 error

      const response = await axios.get<CoinGeckoPriceData>(
        `${this.baseUrl}/coins/${assetId}/market_chart`,
        {
          params,
        }
      );

      // Convert CoinGecko data to our ChartData format
      const data: ChartData[] = response.data.prices.map(([timestamp, price]: [number, number]) => ({
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
