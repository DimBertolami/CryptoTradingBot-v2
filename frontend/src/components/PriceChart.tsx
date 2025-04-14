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
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
} from '@mui/icons-material';

interface PriceChartProps {
  assets: CryptoAsset[];
  onAssetChange: (asset: CryptoAsset) => void;
}

interface IndicatorSettings {
  rsi: {
    period: number;
    overbought: number;
    oversold: number;
  };
  macd: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  bollinger: {
    period: number;
    multiplier: number;
  };
  ma: {
    shortPeriod: number;
    longPeriod: number;
  };
  volume: {
    period: number;
  };
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>({
    rsi: { period: 14, overbought: 70, oversold: 30 },
    macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    bollinger: { period: 20, multiplier: 2 },
    ma: { shortPeriod: 50, longPeriod: 200 },
    volume: { period: 20 },
  });
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
        const { data: dataWithIndicators, signals } = calculateAllIndicators(data);
        setChartData(dataWithIndicators);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedAsset.id, timeInterval, indicatorSettings]);

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
      const { timestamp, price, rsi, macd, macdSignal, macdHistogram, upperBand, lowerBand, shortMA, longMA } = payload[0].payload;
      
      // Get signals for this point
      const index = chartData.findIndex(d => d.timestamp === timestamp);
      const signals = {
        rsi: index >= 14 ? chartData[index].rsi > 70 ? 'overbought' : chartData[index].rsi < 30 ? 'oversold' : 'neutral' : 'neutral',
        macd: index >= 26 + 9 ? macdHistogram > 0 ? 'bullish' : macdHistogram < 0 ? 'bearish' : 'neutral' : 'neutral',
        bollinger: index >= 20 ? price > upperBand ? 'sell' : price < lowerBand ? 'buy' : 'neutral' : 'neutral',
        ma: index >= 200 ? shortMA > longMA ? 'bullish' : shortMA < longMA ? 'bearish' : 'neutral' : 'neutral',
      };

      return (
        <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2">
            {formatTimestamp(timestamp)}
          </Typography>
          <Typography variant="body2">
            <strong>Price:</strong> ${price.toFixed(2)}
          </Typography>
          
          {/* RSI */}
          {rsi && (
            <Typography variant="body2" sx={{ color: signals.rsi === 'overbought' ? 'error.main' : 
              signals.rsi === 'oversold' ? 'warning.main' : 'text.primary' }}>
              <strong>RSI:</strong> {rsi.toFixed(1)}
              {signals.rsi === 'overbought' && ' (Overbought)'}
              {signals.rsi === 'oversold' && ' (Oversold)'}
            </Typography>
          )}

          {/* MACD */}
          {macd && macdSignal && (
            <Typography variant="body2" sx={{ color: signals.macd === 'bullish' ? 'success.main' : 
              signals.macd === 'bearish' ? 'error.main' : 'text.primary' }}>
              <strong>MACD:</strong> {macd.toFixed(1)} / {macdSignal.toFixed(1)}
              {signals.macd === 'bullish' && ' (Bullish)'}
              {signals.macd === 'bearish' && ' (Bearish)'}
            </Typography>
          )}

          {/* Bollinger Bands */}
          {upperBand && lowerBand && (
            <Typography variant="body2" sx={{ color: signals.bollinger === 'buy' ? 'success.main' : 
              signals.bollinger === 'sell' ? 'error.main' : 'text.primary' }}>
              <strong>Bollinger Bands:</strong> {lowerBand.toFixed(2)} - {upperBand.toFixed(2)}
              {signals.bollinger === 'buy' && ' (Buy Signal)'}
              {signals.bollinger === 'sell' && ' (Sell Signal)'}
            </Typography>
          )}

          {/* Moving Averages */}
          {shortMA && longMA && (
            <Typography variant="body2" sx={{ color: signals.ma === 'bullish' ? 'success.main' : 
              signals.ma === 'bearish' ? 'error.main' : 'text.primary' }}>
              <strong>MAs:</strong> {shortMA.toFixed(2)} / {longMA.toFixed(2)}
              {signals.ma === 'bullish' && ' (Bullish)'}
              {signals.ma === 'bearish' && ' (Bearish)'}
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
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.movingAverages.enabled}
                onChange={() => {
                  // Dispatch action to toggle Moving Averages
                }}
              />
            }
            label="MAs"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={chartConfig.volume.enabled}
                onChange={() => {
                  // Dispatch action to toggle Volume
                }}
              />
            }
            label="Volume"
          />
        </FormGroup>

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
          <MuiTooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Chart container */}
      <Box
        sx={{
          height: isFullscreen ? '90vh' : 600,
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

            {/* Moving Averages */}
            {chartConfig.movingAverages.enabled && (
              <>
                <Line
                  type="monotone"
                  dataKey="shortMA"
                  name="Short MA"
                  stroke="#9e9e9e"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="longMA"
                  name="Long MA"
                  stroke="#616161"
                  strokeWidth={1}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
              </>
            )}

            {/* Volume */}
            {chartConfig.volume.enabled && (
              <AreaChart
                width={800}
                height={100}
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="volume"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  stroke="#8884d8"
                  strokeWidth={1}
                />
              </AreaChart>
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Indicator Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* RSI Settings */}
            <Box>
              <Typography variant="subtitle2">RSI Settings</Typography>
              <TextField
                label="Period"
                type="number"
                value={indicatorSettings.rsi.period}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    rsi: { ...prev.rsi, period: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Overbought Level"
                type="number"
                value={indicatorSettings.rsi.overbought}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    rsi: { ...prev.rsi, overbought: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Oversold Level"
                type="number"
                value={indicatorSettings.rsi.oversold}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    rsi: { ...prev.rsi, oversold: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
            </Box>

            {/* MACD Settings */}
            <Box>
              <Typography variant="subtitle2">MACD Settings</Typography>
              <TextField
                label="Fast Period"
                type="number"
                value={indicatorSettings.macd.fastPeriod}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    macd: { ...prev.macd, fastPeriod: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Slow Period"
                type="number"
                value={indicatorSettings.macd.slowPeriod}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    macd: { ...prev.macd, slowPeriod: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Signal Period"
                type="number"
                value={indicatorSettings.macd.signalPeriod}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    macd: { ...prev.macd, signalPeriod: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
            </Box>

            {/* Bollinger Bands Settings */}
            <Box>
              <Typography variant="subtitle2">Bollinger Bands Settings</Typography>
              <TextField
                label="Period"
                type="number"
                value={indicatorSettings.bollinger.period}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    bollinger: { ...prev.bollinger, period: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Multiplier"
                type="number"
                value={indicatorSettings.bollinger.multiplier}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    bollinger: { ...prev.bollinger, multiplier: parseFloat(e.target.value) }
                  }));
                }}
                fullWidth
              />
            </Box>

            {/* Moving Averages Settings */}
            <Box>
              <Typography variant="subtitle2">Moving Averages Settings</Typography>
              <TextField
                label="Short Period"
                type="number"
                value={indicatorSettings.ma.shortPeriod}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    ma: { ...prev.ma, shortPeriod: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Long Period"
                type="number"
                value={indicatorSettings.ma.longPeriod}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    ma: { ...prev.ma, longPeriod: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
            </Box>

            {/* Volume Settings */}
            <Box>
              <Typography variant="subtitle2">Volume Settings</Typography>
              <TextField
                label="Period"
                type="number"
                value={indicatorSettings.volume.period}
                onChange={(e) => {
                  setIndicatorSettings(prev => ({
                    ...prev,
                    volume: { ...prev.volume, period: parseInt(e.target.value) }
                  }));
                }}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PriceChart;