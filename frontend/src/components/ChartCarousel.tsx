import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import PriceChart from './PriceChart';
import MarketCapChart from './MarketCapChart';

interface ChartCarouselProps {
  assets: any[];
  onAssetChange: (asset: any) => void;
}

const ChartCarousel: React.FC<ChartCarouselProps> = ({ assets, onAssetChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);

  // Update selected asset when it changes from parent
  useEffect(() => {
    if (assets.length > 0 && selectedAsset !== assets[0]) {
      setSelectedAsset(assets[0]);
    }
  }, [assets]);

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
        {renderChart()}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
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
      </Box>
    </Box>
  );
};

export default ChartCarousel;