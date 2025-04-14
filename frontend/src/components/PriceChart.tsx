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
  ReferenceLine,
  Brush,
  Zoom,
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
  Slider,
  IconButton,
  Tooltip as MuiTooltip,
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
} from '@mui/icons-material';

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
        
        // Calculate technical indicators
        const dataWithIndicators = calculateAllIndicators(data);
        setChartData(dataWithIndicators);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedAsset.id, timeInterval]);

  // Handle zoom changes
  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    setZoomLevel(newValue as number);
  };

  // Handle brush domain change
  const handleBrushDomainChange = (domain: number[]) => {
    setBrushDomain(domain);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Custom tooltip
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

        {/* Zoom controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Box>
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
          >
            <CartesianGrid strokeDasharray="3 3" />
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

            {/* Technical indicators */}
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

            {/* Brush for zooming */}
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#8884d8"
              onChange={handleBrushDomainChange}
              onEnd={handleBrushDomainChange}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Zoom slider */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ mb: 1 }}>
            Zoom Level
          </Typography>
          <Slider
            value={zoomLevel}
            min={1}
            max={10}
            step={0.1}
            onChange={handleZoomChange}
            valueLabelDisplay="auto"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PriceChart;