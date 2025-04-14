import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
  Stack,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
  Settings,
  Info,
  Help,
  Speed,
  Timer,
} from '@mui/icons-material';
import PriceChart from './PriceChart';
import MarketCapChart from './MarketCapChart';
import { useInterval } from 'usehooks-ts';

interface ChartCarouselProps {
  assets: any[];
  onAssetChange: (asset: any) => void;
}

const ChartCarousel: React.FC<ChartCarouselProps> = ({ assets, onAssetChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [loading, setLoading] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds default
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Update selected asset when it changes from parent
  useEffect(() => {
    if (assets.length > 0 && selectedAsset !== assets[0]) {
      setSelectedAsset(assets[0]);
    }
  }, [assets]);

  // Real-time updates
  useInterval(() => {
    setLoading(true);
    // Simulate data fetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, updateInterval);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAssetChange = (asset: any) => {
    setSelectedAsset(asset);
    onAssetChange(asset);
  };

  const renderChart = () => {
    switch (activeTab) {
      case 0:
        return (
          <PriceChart
            assets={assets}
            onAssetChange={handleAssetChange}
          />
        );
      case 1:
        return (
          <MarketCapChart
            assets={assets}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="chart tabs"
        >
          <Tab
            icon={<TrendingUp sx={{ mr: 1 }} />}
            label="Price Analysis"
          />
          <Tab
            icon={<TrendingFlat sx={{ mr: 1 }} />}
            label="Market Cap & Orders"
          />
        </Tabs>
      </Box>

      {/* Chart Content */}
      <Box sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {renderChart()}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
        <Stack direction="row" spacing={2}>
          <MuiTooltip title="Previous Chart">
            <IconButton
              onClick={() => setActiveTab((prev) => (prev === 0 ? 1 : 0))}
              size="small"
            >
              <ArrowLeft />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Next Chart">
            <IconButton
              onClick={() => setActiveTab((prev) => (prev === 1 ? 0 : 1))}
              size="small"
            >
              <ArrowRight />
            </IconButton>
          </MuiTooltip>
        </Stack>

        <Stack direction="row" spacing={2}>
          <MuiTooltip title="Refresh Data">
            <IconButton
              onClick={() => {
                setLoading(true);
                // Simulate data refresh
                setTimeout(() => setLoading(false), 1000);
              }}
              size="small"
            >
              <Refresh />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Settings">
            <IconButton
              onClick={() => setShowSettings(true)}
              size="small"
            >
              <Settings />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Help">
            <IconButton
              onClick={() => setShowHelp(true)}
              size="small"
            >
              <Help />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>Chart Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              Update Interval
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography>
                {Math.round(updateInterval / 1000)} seconds
              </Typography>
              <Slider
                value={updateInterval}
                min={1000}
                max={60000}
                step={1000}
                onChange={(_, value) => setUpdateInterval(value as number)}
                marks={[
                  { value: 1000, label: '1s' },
                  { value: 5000, label: '5s' },
                  { value: 10000, label: '10s' },
                  { value: 30000, label: '30s' },
                  { value: 60000, label: '1m' },
                ]}
                valueLabelDisplay="auto"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md">
        <DialogTitle>Chart Usage Guide</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">Price Analysis Chart</Typography>
            <Typography>
              The price chart displays technical indicators with customizable settings. Use the controls at the top to:
              <ul>
                <li>Switch between different assets</li>
                <li>Toggle technical indicators</li>
                <li>Adjust zoom level</li>
              </ul>
            </Typography>

            <Typography variant="h6">Market Cap & Orders Chart</Typography>
            <Typography>
              The market cap chart shows:
              <ul>
                <li>Market capitalization distribution</li>
                <li>Buy/sell order depth</li>
                <li>Investment thresholds based on market cap</li>
                <li>Real-time updates of order book</li>
              </ul>
            </Typography>

            <Typography variant="h6">Investment Thresholds</Typography>
            <Typography>
              The minimum investment thresholds are calculated based on market cap:
              <ul>
                <li>$100B+ cap: ≥ $100,000 investment</li>
                <li>$10B-$100B: ≥ $50,000</li>
                <li>$1B-$10B: ≥ $10,000</li>
                <li>$100M-$1B: ≥ $5,000</li>
                <li>$10M-$100M: ≥ $1,000</li>
                <li>< $10M: ≥ $500</li>
              </ul>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChartCarousel;