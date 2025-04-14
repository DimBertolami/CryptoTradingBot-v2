import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import { ChartData, ChartConfig, CryptoAsset } from '../../types/chart';
import { useAppSelector } from '../../app/hooks';
import { coingeckoApi } from '../../services/coingecko';
import { TimeInterval } from '../../features/timeInterval/timeIntervalSlice';

interface PriceChartProps {
  assets: CryptoAsset[];
  onAssetChange: (asset: CryptoAsset) => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({ assets, onAssetChange }) => {
  const selectedAsset = useAppSelector((state) => state.chart.selectedAsset);
  const timeInterval = useAppSelector((state) => state.timeInterval.interval);
  const chartConfig = useAppSelector((state) => state.chart.config);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedAsset.id) return;

      setIsLoading(true);
      try {
        const days = 30; // Fetch 30 days of data
        const data = await coingeckoApi.getHistoricalData(
          selectedAsset.id,
          days,
          timeInterval
        );
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedAsset.id, timeInterval]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { timestamp, price, rsi, macd, macdSignal, upperBand, lowerBand } = payload[0].payload;
      return (
        <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2">
            {formatTimestamp(timestamp)}
          </Typography>
          <Typography variant="body2">
            <strong>Price:</strong> ${price.toFixed(2)}
          </Typography>
          {rsi && <Typography variant="body2"><strong>RSI:</strong> {rsi.toFixed(1)}</Typography>}
          {macd && macdSignal && (
            <Typography variant="body2">
              <strong>MACD:</strong> {macd.toFixed(1)} / {macdSignal.toFixed(1)}
            </Typography>
          )}
          {upperBand && lowerBand && (
            <Typography variant="body2">
              <strong>Bollinger Bands:</strong> {lowerBand.toFixed(2)} - {upperBand.toFixed(2)}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Asset</InputLabel>
          <Select
            value={selectedAsset.symbol}
            onChange={(e) => {
              const newAsset = assets.find((a) => a.symbol === e.target.value) || assets[0];
              onAssetChange(newAsset);
            }}
            label="Asset"
          >
            {assets.map((asset) => (
              <MenuItem key={asset.symbol} value={asset.symbol}>
                {asset.name} ({asset.symbol})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.rsi.enabled}
                onChange={() => {
                  // Dispatch action to toggle RSI
                }}
              />
            }
            label="RSI"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.macd.enabled}
                onChange={() => {
                  // Dispatch action to toggle MACD
                }}
              />
            }
            label="MACD"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.bollingerBands.enabled}
                onChange={() => {
                  // Dispatch action to toggle Bollinger Bands
                }}
              />
            }
            label="Bollinger Bands"
          />
        </FormGroup>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            angle={-45}
            textAnchor="end"
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Line
            type="monotone"
            dataKey="price"
            name="Price"
            stroke="#2196f3"
            strokeWidth={2}
          />

          {chartConfig.rsi.enabled && (
            <Line
              type="monotone"
              dataKey="rsi"
              name="RSI"
              stroke="#f44336"
              strokeWidth={1}
            />
          )}

          {chartConfig.macd.enabled && (
            <>
              <Line
                type="monotone"
                dataKey="macd"
                name="MACD"
                stroke="#4caf50"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="macdSignal"
                name="MACD Signal"
                stroke="#9c27b0"
                strokeWidth={1}
              />
            </>
          )}

          {chartConfig.bollingerBands.enabled && (
            <>
              <Line
                type="monotone"
                dataKey="upperBand"
                name="Upper Band"
                stroke="#ff9800"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="lowerBand"
                name="Lower Band"
                stroke="#ff9800"
                strokeWidth={1}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PriceChart;