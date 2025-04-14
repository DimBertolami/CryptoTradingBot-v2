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
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip as MuiTooltip,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import { ChartData, ChartConfig, CryptoAsset } from '../../types/chart';
import { useAppSelector } from '../../app/hooks';
import { coingeckoApi } from '../../services/coingecko';
import { calculateAllIndicators } from '../../utils/technicalIndicators';
import {
  FastForward,
  FastRewind,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  Settings,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
} from '@mui/icons-material';

// Helper function to explain price movement
const explainPriceMovement = (current: number, previous: number): string => {
  const change = ((current - previous) / previous) * 100;
  if (change > 2) {
    return `Price has increased significantly (${change.toFixed(1)}%) - This could indicate strong buying pressure.`;
  } else if (change > 0.5) {
    return `Price is trending up (${change.toFixed(1)}%) - This might be a good time to buy.`;
  } else if (change < -2) {
    return `Price has dropped significantly (${Math.abs(change).toFixed(1)}%) - This could be a buying opportunity.`;
  } else if (change < -0.5) {
    return `Price is trending down (${Math.abs(change).toFixed(1)}%) - Consider holding or selling.`;
  } else {
    return `Price is relatively stable (${change.toFixed(1)}%) - No significant movement detected.`;
  }
};

// Helper function to explain RSI
const explainRSI = (rsi: number): string => {
  if (rsi >= 70) {
    return `RSI is overbought (${rsi.toFixed(1)}). This usually indicates that the asset is overvalued and may be due for a correction.`;
  } else if (rsi <= 30) {
    return `RSI is oversold (${rsi.toFixed(1)}). This usually indicates that the asset is undervalued and may be due for a recovery.`;
  } else if (rsi >= 60) {
    return `RSI is strong (${rsi.toFixed(1)}). This indicates strong buying pressure.`;
  } else if (rsi <= 40) {
    return `RSI is weak (${rsi.toFixed(1)}). This indicates strong selling pressure.`;
  } else {
    return `RSI is neutral (${rsi.toFixed(1)}). No strong buying or selling pressure detected.`;
  }
};

// Helper function to explain MACD
const explainMACD = (macd: number, signal: number, histogram: number): string => {
  const isBullish = histogram > 0;
  const isStrong = Math.abs(histogram) > 0.5;

  if (isBullish && isStrong) {
    return `MACD is strongly bullish (${histogram.toFixed(2)}). This indicates strong buying pressure and a good time to buy.`;
  } else if (isBullish) {
    return `MACD is bullish (${histogram.toFixed(2)}). This indicates buying pressure.`;
  } else if (!isBullish && isStrong) {
    return `MACD is strongly bearish (${histogram.toFixed(2)}). This indicates strong selling pressure and a good time to sell.`;
  } else {
    return `MACD is bearish (${histogram.toFixed(2)}). This indicates selling pressure.`;
  }
};

// Helper function to explain Bollinger Bands
const explainBollinger = (price: number, upper: number, lower: number): string => {
  const isOverbought = price > upper;
  const isOversold = price < lower;

  if (isOverbought) {
    return `Price is above the upper band (${price.toFixed(2)} > ${upper.toFixed(2)}). This usually indicates that the asset is overvalued and may be due for a correction.`;
  } else if (isOversold) {
    return `Price is below the lower band (${price.toFixed(2)} < ${lower.toFixed(2)}). This usually indicates that the asset is undervalued and may be due for a recovery.`;
  } else {
    return `Price is within the Bollinger Bands (${price.toFixed(2)}). This indicates normal price volatility.`;
  }
};

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brushDomain, setBrushDomain] = useState<number[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const theme = useTheme();
  const chartRef = useRef<any>(null);

  // Fetch data from CoinGecko
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
        
        // Calculate technical indicators with current settings
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

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Custom tooltip with explanations
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { timestamp, price, rsi, macd, macdSignal, macdHistogram, upperBand, lowerBand } = payload[0].payload;
      
      // Get previous price for comparison
      const currentIndex = chartData.findIndex(d => d.timestamp === timestamp);
      const previousPrice = currentIndex > 0 ? chartData[currentIndex - 1].price : price;

      return (
        <Paper elevation={3} sx={{ p: 2, maxWidth: 400 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">
              {formatTimestamp(timestamp)}
            </Typography>
            
            {/* Price Explanation */}
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Price:</strong> ${price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {explainPriceMovement(price, previousPrice)}
              </Typography>
            </Stack>

            {/* RSI Explanation */}
            {rsi && (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>RSI:</strong> {rsi.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {explainRSI(rsi)}
                </Typography>
              </Stack>
            )}

            {/* MACD Explanation */}
            {macd && macdSignal && (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>MACD:</strong> {macd.toFixed(1)} / {macdSignal.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {explainMACD(macd, macdSignal, macdHistogram)}
                </Typography>
              </Stack>
            )}

            {/* Bollinger Bands Explanation */}
            {upperBand && lowerBand && (
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Bollinger Bands:</strong> {lowerBand.toFixed(2)} - {upperBand.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {explainBollinger(price, upperBand, lowerBand)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // No data state
  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Controls */}
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

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.rsi.enabled}
                onChange={() => {
                  // Dispatch action to toggle RSI
                }}
              />
            }
            label={
              <MuiTooltip title="RSI measures price momentum. Values above 70 indicate overbought conditions, while values below 30 indicate oversold conditions.">
                <span>RSI</span>
              </MuiTooltip>
            }
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
            label={
              <MuiTooltip title="MACD shows the relationship between two moving averages of prices. A positive histogram indicates upward momentum, while a negative histogram indicates downward momentum.">
                <span>MACD</span>
              </MuiTooltip>
            }
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
            label={
              <MuiTooltip title="Bollinger Bands consist of a moving average and two standard deviations. Prices tend to stay within the bands, with breakouts indicating potential trend changes.">
                <span>Bollinger Bands</span>
              </MuiTooltip>
            }
          />
        </Stack>

        {/* Zoom controls */}
        <Stack direction="row" spacing={1}>
          <MuiTooltip title="Zoom In">
            <IconButton onClick={() => setZoomLevel(zoomLevel * 1.5)}>
              <ZoomIn />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Zoom Out">
            <IconButton onClick={() => setZoomLevel(zoomLevel / 1.5)}>
              <ZoomOut />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Fullscreen">
            <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Show explanations">
            <IconButton onClick={() => setHoveredPoint(null)}>
              <Info />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Chart container */}
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
                setHoveredPoint(point);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            
            {/* Price line */}
            <Line
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="#2196f3"
              strokeWidth={2}
              animationDuration={500}
              animationEasing="easeOutQuart"
            />

            {/* RSI */}
            {chartConfig.rsi.enabled && (
              <Line
                type="monotone"
                dataKey="rsi"
                name="RSI"
                stroke="#f44336"
                strokeWidth={1}
                animationDuration={500}
                animationEasing="easeOutQuart"
              />
            )}

            {/* MACD */}
            {chartConfig.macd.enabled && (
              <>
                <Line
                  type="monotone"
                  dataKey="macd"
                  name="MACD"
                  stroke="#4caf50"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  name="MACD Signal"
                  stroke="#9c27b0"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
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

            {/* Bollinger Bands */}
            {chartConfig.bollingerBands.enabled && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  name="Upper Band"
                  stroke="#ff9800"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  name="Lower Band"
                  stroke="#ff9800"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
              </>
            )}

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              angle={-45}
              textAnchor="end"
              type="number"
              domain={brushDomain.length ? brushDomain : [0, 'dataMax']}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#8884d8"
              onChange={handleBrushDomainChange}
              onEnd={handleBrushDomainChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PriceChart;