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

// Define line styles for indicators
const indicatorStyles = {
  rsi: {
    stroke: '#8B0000',
    strokeWidth: 1,
    strokeDasharray: '5 5',
  },
  macd: {
    macd: {
      stroke: '#006400',
      strokeWidth: 1,
      strokeDasharray: '3 3',
    },
    signal: {
      stroke: '#4B0082',
      strokeWidth: 1,
      strokeDasharray: '2 2',
    },
    histogram: {
      fill: '#006400',
      fillOpacity: 0.2,
    },
  },
  bollinger: {
    upper: {
      stroke: '#FFA500',
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
    lower: {
      stroke: '#FFA500',
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
  },
  ma: {
    short: {
      stroke: '#808080',
      strokeWidth: 1,
      strokeDasharray: '6 6',
    },
    long: {
      stroke: '#404040',
      strokeWidth: 1,
      strokeDasharray: '8 8',
    },
  },
  volume: {
    fill: '#4169E1',
    fillOpacity: 0.3,
    stroke: '#4169E1',
    strokeWidth: 1,
  },
};

interface PriceChartProps {
  assets: CryptoAsset[];
  onAssetChange: (asset: CryptoAsset) => void;
}

// ... [Rest of the component code remains the same until the chart rendering part] ...

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="#000000"
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
                stroke={indicatorStyles.rsi.stroke}
                strokeWidth={indicatorStyles.rsi.strokeWidth}
                strokeDasharray={indicatorStyles.rsi.strokeDasharray}
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
                  stroke={indicatorStyles.macd.macd.stroke}
                  strokeWidth={indicatorStyles.macd.macd.strokeWidth}
                  strokeDasharray={indicatorStyles.macd.macd.strokeDasharray}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  name="MACD Signal"
                  stroke={indicatorStyles.macd.signal.stroke}
                  strokeWidth={indicatorStyles.macd.signal.strokeWidth}
                  strokeDasharray={indicatorStyles.macd.signal.strokeDasharray}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Area
                  type="monotone"
                  dataKey="macdHistogram"
                  name="MACD Histogram"
                  fill={indicatorStyles.macd.histogram.fill}
                  fillOpacity={indicatorStyles.macd.histogram.fillOpacity}
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
                  stroke={indicatorStyles.bollinger.upper.stroke}
                  strokeWidth={indicatorStyles.bollinger.upper.strokeWidth}
                  strokeDasharray={indicatorStyles.bollinger.upper.strokeDasharray}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  name="Lower Band"
                  stroke={indicatorStyles.bollinger.lower.stroke}
                  strokeWidth={indicatorStyles.bollinger.lower.strokeWidth}
                  strokeDasharray={indicatorStyles.bollinger.lower.strokeDasharray}
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
                  stroke={indicatorStyles.ma.short.stroke}
                  strokeWidth={indicatorStyles.ma.short.strokeWidth}
                  strokeDasharray={indicatorStyles.ma.short.strokeDasharray}
                  animationDuration={500}
                  animationEasing="easeOutQuart"
                />
                <Line
                  type="monotone"
                  dataKey="longMA"
                  name="Long MA"
                  stroke={indicatorStyles.ma.long.stroke}
                  strokeWidth={indicatorStyles.ma.long.strokeWidth}
                  strokeDasharray={indicatorStyles.ma.long.strokeDasharray}
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
                  fill={indicatorStyles.volume.fill}
                  fillOpacity={indicatorStyles.volume.fillOpacity}
                  stroke={indicatorStyles.volume.stroke}
                  strokeWidth={indicatorStyles.volume.strokeWidth}
                />
              </AreaChart>
            )}

            {/* Add reference lines for RSI levels */}
            {chartConfig.rsi.enabled && (
              <>
                <ReferenceLine
                  y={indicatorSettings.rsi.overbought}
                  stroke="#8B0000"
                  strokeDasharray="3 3"
                  label={{ value: 'Overbought', position: 'left' }}
                />
                <ReferenceLine
                  y={indicatorSettings.rsi.oversold}
                  stroke="#8B0000"
                  strokeDasharray="3 3"
                  label={{ value: 'Oversold', position: 'left' }}
                />
              </>
            )}

            {/* Add grid lines */}
            <CartesianGrid stroke="#333333" strokeDasharray="2 2" />

            {/* X and Y axes */}
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              angle={-45}
              textAnchor="end"
              type="number"
              domain={brushDomain.length ? brushDomain : [0, 'dataMax']}
              stroke="#666666"
            />
            <YAxis stroke="#666666" />

            {/* Tooltips and legend */}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#666666' }} />

            {/* Brush for zooming */}
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#666666"
              onChange={handleBrushDomainChange}
              onEnd={handleBrushDomainChange}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Zoom slider */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666666' }}>
            Zoom Level
          </Typography>
          <Slider
            value={zoomLevel}
            min={1}
            max={10}
            step={0.1}
            onChange={handleZoomChange}
            valueLabelDisplay="auto"
            sx={{
              '& .MuiSlider-track': {
                backgroundColor: '#444444',
              },
              '& .MuiSlider-thumb': {
                backgroundColor: '#000000',
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#666666',
              },
              '& .MuiSlider-markActive': {
                backgroundColor: '#000000',
              },
            }}
          />
        </Box>
      </Box>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle sx={{ color: '#000000' }}>Indicator Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* RSI Settings */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#000000' }}>RSI Settings</Typography>
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
                sx={{
                  '& .MuiInputLabel-root': { color: '#666666' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#444444' },
                    '&:hover fieldset': { borderColor: '#666666' },
                    '&.Mui-focused fieldset': { borderColor: '#000000' },
                  },
                }}
              />
              {/* ... rest of settings fields ... */}
            </Box>
            {/* ... rest of settings dialog ... */}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSettingsOpen(false)}
            sx={{
              '&:hover': { backgroundColor: '#444444' },
              '&:active': { backgroundColor: '#333333' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PriceChart;