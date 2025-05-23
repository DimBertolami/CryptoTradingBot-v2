import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  ComposedChart,
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
  Bar,
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
    const { name, price, volume } = data;

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

  // State to track which indicator line is highlighted
  const [highlightedLineKey, setHighlightedLineKey] = useState<string | null>(null);

  // Enable default indicators on mount if not already enabled
  useEffect(() => {
    const defaultIndicators = ['rsi', 'macd', 'bollingerBands', 'vwap'];
    defaultIndicators.forEach((indicator) => {
      if (!chartConfig[indicator as keyof typeof chartConfig]?.enabled) {
        dispatch(toggleIndicator(indicator as keyof typeof chartConfig));
      }
    });
  }, []); // Run once on mount

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

  // Custom dot component for indicator lines with click handler
  const CustomDot: React.FC<any> = (props) => {
    const { cx, cy, stroke, dataKey } = props;
    if (cx === undefined || cy === undefined) return null;

    const handleClick = (e: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
      e.stopPropagation();
      if (highlightedLineKey === dataKey) {
        setHighlightedLineKey(null);
      } else {
        setHighlightedLineKey(dataKey);
      }
    };

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="white"
        stroke={stroke}
        strokeWidth={highlightedLineKey === dataKey ? 4 : 2}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      />
    );
  };

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
    if (chartData.length === 0) {
      return [0, 0];
    }

    let startTimestamp: number;
    let endTimestamp: number;

    if (brushDomain.length === 2) {
      const startIndex = brushDomain[0];
      const endIndex = brushDomain[1];
      startTimestamp = chartData[startIndex]?.timestamp || 0;
      endTimestamp = chartData[endIndex]?.timestamp || chartData[chartData.length - 1].timestamp;
    } else {
      startTimestamp = chartData[0]?.timestamp || 0;
      endTimestamp = chartData[chartData.length - 1]?.timestamp || 0;
    }

    // Calculate zoomed domain
    const center = (startTimestamp + endTimestamp) / 2;
    const range = (endTimestamp - startTimestamp) / zoomLevel;
    const zoomedStart = center - range / 2;
    const zoomedEnd = center + range / 2;

    return [zoomedStart, zoomedEnd];
  }, [brushDomain, chartData, zoomLevel]);

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

      // Filter out data points with zero or invalid price
      const filteredData = data.filter((point: any) => point.price && point.price > 0);

      const { data: dataWithIndicators } = calculateAllIndicators(filteredData);
      setChartData(dataWithIndicators);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
                { key: 'obv', label: 'On-Balance Volume uses volume to predict price changes.' },
                { key: 'vwap', label: 'Volume Weighted Average Price calculates the average price weighted by volume.' },
                { key: 'candlestick', label: 'Candlestick chart showing open, high, low, and close prices.' },
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
          backgroundColor: '#d0f0ff', // very light skyblue background
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartConfig.candlestick.enabled ? (
            <ComposedChart
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
              {/* Candlestick bars */}
              <Bar
                dataKey="close"
                name="Candlestick"
                // Removed fill="#2196f3" to avoid blue color
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const open = payload.open;
                  const close = payload.close;
                  const high = payload.high;
                  const low = payload.low;
                  const barX = x;
                  const barWidth = width;
                  const barY = y;
                  const barHeight = height;

                  const candleColor = close > open ? '#4caf50' : '#f44336';
                  const candleHeight = Math.abs(y - barY);

                  // Draw candlestick body and wick using SVG elements
                  return (
                    <g>
                      {/* Wick */}
                      <line
                        x1={barX + barWidth / 2}
                        y1={y}
                        x2={barX + barWidth / 2}
                        y2={y + barHeight}
                        stroke={candleColor}
                        strokeWidth={1}
                      />
                      {/* Body */}
                      <rect
                        x={barX}
                        y={close > open ? y : y + candleHeight}
                        width={barWidth}
                        height={candleHeight}
                        fill={candleColor}
                      />
                    </g>
                  );
                }}
              />
            </ComposedChart>
          ) : (
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
                stroke="#000000" // changed to black
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
                  strokeWidth={highlightedLineKey === 'rsi' ? 3 : 1}
                  strokeDasharray="5 5"
                  dot={<CustomDot dataKey="rsi" />}
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
                    stroke="#8B4513" // changed to brown
                    strokeWidth={highlightedLineKey === 'macd' ? 3 : 1}
                    strokeDasharray="5 2"
                    dot={<CustomDot dataKey="macd" />}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="macdSignal"
                    name="MACD Signal"
                    stroke="#9c27b0" // purple
                    strokeWidth={highlightedLineKey === 'macdSignal' ? 3 : 1}
                    strokeDasharray="2 2"
                    dot={<CustomDot dataKey="macdSignal" />}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="macdHistogram"
                    name="MACD Histogram"
                    fill="#ff9800"
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
                    strokeWidth={highlightedLineKey === 'upperBand' ? 3 : 1}
                    strokeDasharray="3 3"
                    dot={<CustomDot dataKey="upperBand" />}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBand"
                    name="Lower Band"
                    stroke="#ff9800"
                    strokeWidth={highlightedLineKey === 'lowerBand' ? 3 : 1}
                    strokeDasharray="3 3"
                    dot={<CustomDot dataKey="lowerBand" />}
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
                  strokeWidth={highlightedLineKey === 'adx' ? 3 : chartConfig.adx.lineWidth}
                  strokeDasharray="4 2"
                  dot={<CustomDot dataKey="adx" />}
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
                  strokeWidth={highlightedLineKey === 'obv' ? 3 : chartConfig.obv.lineWidth}
                  strokeDasharray="2 4"
                  dot={<CustomDot dataKey="obv" />}
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
                  strokeWidth={highlightedLineKey === 'vwap' ? 3 : chartConfig.vwap.lineWidth}
                  strokeDasharray="6 3"
                  dot={<CustomDot dataKey="vwap" />}
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
                  strokeWidth={highlightedLineKey === 'atr' ? 3 : chartConfig.atr.lineWidth}
                  strokeDasharray="1 3"
                  dot={<CustomDot dataKey="atr" />}
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
                  strokeWidth={highlightedLineKey === 'cci' ? 3 : chartConfig.cci.lineWidth}
                  strokeDasharray="4 4"
                  dot={<CustomDot dataKey="cci" />}
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
                  strokeWidth={highlightedLineKey === 'stoch' ? 3 : chartConfig.stoch.lineWidth}
                  strokeDasharray="3 1 1 1"
                  dot={<CustomDot dataKey="stoch" />}
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
                  strokeWidth={highlightedLineKey === 'roc' ? 3 : chartConfig.roc.lineWidth}
                  strokeDasharray="5 1"
                  dot={<CustomDot dataKey="roc" />}
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
                  strokeWidth={highlightedLineKey === 'mfi' ? 3 : chartConfig.mfi.lineWidth}
                  strokeDasharray="2 2 6 2"
                  dot={<CustomDot dataKey="mfi" />}
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
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PriceChart;