import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Area,
  TooltipProps,
} from 'recharts';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Tooltip as MuiTooltip,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Select,
} from '@mui/material';
import { ChartData, ChartConfig, CryptoAsset } from '../types/chart';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { coingeckoApi } from '../services/coingecko';
import { calculateAllIndicators } from '../utils/technicalIndicators';
import { setSelectedAsset, toggleIndicator } from '../features/chart/chartSlice';
import { setTimeInterval } from '../features/timeInterval/timeIntervalSlice';
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';

interface PriceChartProps {
  assets: CryptoAsset[];
  onAssetChange: (asset: CryptoAsset) => void;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0 && payload[0].payload) {
    const data = payload[0].payload;
    const { name, marketCap, price, volume } = data;

    return (
      <Paper elevation={3} sx={{ p: 2, maxWidth: 400 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2">
            {name}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Price:</strong> ${price.toFixed(2)}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>24h Volume:</strong> ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(volume)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    );
  }
  return null;
};

export const PriceChart: React.FC<PriceChartProps> = ({ assets, onAssetChange }) => {
  const dispatch = useAppDispatch();

  // Mock data for assets if none provided
  const mockAssets: CryptoAsset[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', balance: 0, price: 0 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', balance: 0, price: 0 },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', balance: 0, price: 0 },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', balance: 0, price: 0 },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', balance: 0, price: 0 },
  ];

  const assetsToUse = assets && assets.length > 0 ? assets : mockAssets;

  const selectedAsset = useAppSelector((state) => state.chart.selectedAsset);
  const timeInterval = useAppSelector((state) => state.timeInterval.interval);
  const chartConfig = useAppSelector((state) => state.chart.config);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brushDomain, setBrushDomain] = useState<number[]>([]);

  const chartRef = useRef<any>(null);

  const handleBrushDomainChange = (newIndex: any) => {
    if (newIndex.startIndex !== undefined && newIndex.endIndex !== undefined) {
      setBrushDomain([newIndex.startIndex, newIndex.endIndex]);
    }
  };

  // Dispatch time interval change to keep functionality and avoid unused variable warning
  useEffect(() => {
    dispatch(setTimeInterval(timeInterval));
  }, [timeInterval, dispatch]);

  const xAxisDomain = React.useMemo(() => {
    if (brushDomain.length === 2 && chartData.length > 0) {
      const startIndex = brushDomain[0];
      const endIndex = brushDomain[1];
      const startTimestamp = chartData[startIndex]?.timestamp || 0;
      const endTimestamp = chartData[endIndex]?.timestamp || chartData[chartData.length - 1].timestamp;
      return [startTimestamp, endTimestamp];
    }
    return [chartData[0]?.timestamp || 0, chartData[chartData.length - 1]?.timestamp || 0];
  }, [brushDomain, chartData]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedAsset.id) return;

      setIsLoading(true);
      try {
        // Map timeInterval to days for API call
        const intervalToDaysMap: { [key: string]: number } = {
          '1m': 1,
          '5m': 1,
          '30m': 1,
          '1h': 1,
          '1d': 1,
          '1w': 7,
          '1M': 30,
          '3M': 90,
          '6M': 180,
          '1y': 365,
        };

        const days = intervalToDaysMap[timeInterval] || 30;

        const data = await coingeckoApi.getHistoricalData(
          selectedAsset.id,
          days,
          timeInterval
        );

        const { data: dataWithIndicators } = calculateAllIndicators(data);
        setChartData(dataWithIndicators);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedAsset.id, timeInterval]);

  const formatTimestamp = (timestamp: number) => {
    // For intervals longer than 1 day, show date instead of time
    if (['1w', '1M', '3M', '6M', '1y'].includes(timeInterval)) {
      return new Date(timestamp).toLocaleDateString();
    }
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No data available</Typography>
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
              const newAsset = assetsToUse.find((a) => a.symbol === e.target.value) || assetsToUse[0];
              onAssetChange(newAsset);
              dispatch(setSelectedAsset(newAsset));
            }}
            label="Asset"
          >
          {assetsToUse.map((asset) => (
            <MenuItem key={asset.symbol} value={asset.symbol}>
              {asset.name} ({asset.symbol})
            </MenuItem>
          ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Indicators</InputLabel>
          <Select
            multiple
            value={Object.entries(chartConfig)
              .filter(([key, value]) => value.enabled)
              .map(([key]) => key)}
            onChange={(e) => {
              const selected = e.target.value as string[];
              Object.keys(chartConfig).forEach((key) => {
                const k = key as keyof typeof chartConfig;
                const shouldBeEnabled = selected.includes(k);
                if (chartConfig[k].enabled !== shouldBeEnabled) {
                  dispatch(toggleIndicator(k));
                }
              });
            }}
            label="Indicators"
            renderValue={(selected) => (selected as string[]).join(', ')}
          >
              {[
                { key: 'rsi', label: 'RSI', tooltip: 'RSI measures price momentum. Values above 70 indicate overbought conditions, while values below 30 indicate oversold conditions.' },
                { key: 'macd', label: 'MACD', tooltip: 'MACD shows the relationship between two moving averages of prices. A positive histogram indicates upward momentum, while a negative histogram indicates downward momentum.' },
                { key: 'bollingerBands', label: 'Bollinger Bands', tooltip: 'Bollinger Bands consist of a moving average and two standard deviations. Prices tend to stay within the bands, with breakouts indicating potential trend changes.' },
                { key: 'adx', label: 'ADX', tooltip: 'Average Directional Index measures trend strength.' },
                { key: 'obv', label: 'OBV', tooltip: 'On-Balance Volume uses volume to predict price changes.' },
                { key: 'vwap', label: 'VWAP', tooltip: 'Volume Weighted Average Price calculates the average price weighted by volume.' },
                { key: 'atr', label: 'ATR', tooltip: 'Average True Range measures market volatility.' },
                { key: 'cci', label: 'CCI', tooltip: 'Commodity Channel Index identifies cyclical trends.' },
                { key: 'stoch', label: 'Stochastic Oscillator', tooltip: 'Compares closing price to price range over time.' },
                { key: 'roc', label: 'ROC', tooltip: 'Measures speed of price change.' },
                { key: 'mfi', label: 'Money Flow Index', tooltip: 'Combines price and volume.' },
              ].map(({ key, label, tooltip }) => {
                const k = key as keyof typeof chartConfig;
                return (
                  <MenuItem key={key} value={key}>
                    <Checkbox
                      checked={chartConfig[k]?.enabled || false}
                      onChange={() => dispatch(toggleIndicator(k))}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MuiTooltip title={tooltip}>
                      <span>{label}</span>
                    </MuiTooltip>
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setZoomLevel(zoomLevel * 1.5)} title="Zoom In">
            <ZoomIn />
          </IconButton>
          <IconButton onClick={() => setZoomLevel(zoomLevel / 1.5)} title="Zoom Out">
            <ZoomOut />
          </IconButton>
          <IconButton onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Stack>
      </Box>

      <Box
        sx={{
          height: isFullscreen ? '90vh' : 400,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            ref={chartRef}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(e) => {
              const point = e.activePayload?.[0];
              if (point) {
                // No action needed
              }
            }}
            onMouseLeave={() => {
              // No action needed
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <Line
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="#2196f3"
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
            />

            {chartConfig.rsi.enabled && (
              <Line
                type="monotone"
                dataKey="rsi"
                name="RSI"
                stroke="#f44336"
                strokeWidth={1}
                animationDuration={500}
                animationEasing="ease-out"
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
                  animationDuration={500}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  name="MACD Signal"
                  stroke="#9c27b0"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="macdHistogram"
                  name="MACD Histogram"
                  fill="#4caf50"
                  fillOpacity={0.3}
                  stroke="none"
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
                  animationDuration={500}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  name="Lower Band"
                  stroke="#ff9800"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </>
            )}

            {chartConfig.adx.enabled && (
              <Line
                type="monotone"
                dataKey="adx"
                name="ADX"
                stroke={chartConfig.adx.color}
                strokeWidth={chartConfig.adx.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.obv.enabled && (
              <Line
                type="monotone"
                dataKey="obv"
                name="OBV"
                stroke={chartConfig.obv.color}
                strokeWidth={chartConfig.obv.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.vwap.enabled && (
              <Line
                type="monotone"
                dataKey="vwap"
                name="VWAP"
                stroke={chartConfig.vwap.color}
                strokeWidth={chartConfig.vwap.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.atr.enabled && (
              <Line
                type="monotone"
                dataKey="atr"
                name="ATR"
                stroke={chartConfig.atr.color}
                strokeWidth={chartConfig.atr.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.cci.enabled && (
              <Line
                type="monotone"
                dataKey="cci"
                name="CCI"
                stroke={chartConfig.cci.color}
                strokeWidth={chartConfig.cci.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.stoch.enabled && (
              <Line
                type="monotone"
                dataKey="stoch"
                name="Stochastic Oscillator"
                stroke={chartConfig.stoch.color}
                strokeWidth={chartConfig.stoch.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.roc.enabled && (
              <Line
                type="monotone"
                dataKey="roc"
                name="ROC"
                stroke={chartConfig.roc.color}
                strokeWidth={chartConfig.roc.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            {chartConfig.mfi.enabled && (
              <Line
                type="monotone"
                dataKey="mfi"
                name="MFI"
                stroke={chartConfig.mfi.color}
                strokeWidth={chartConfig.mfi.lineWidth}
                animationDuration={500}
                animationEasing="ease-out"
              />
            )}

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              angle={-45}
              textAnchor="end"
              type="number"
              domain={xAxisDomain}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#8884d8"
              onChange={handleBrushDomainChange}
              onEnded={handleBrushDomainChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PriceChart;
