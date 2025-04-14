import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  Area,
} from 'recharts';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  ArrowUpward,
  ArrowDownward,
  Sort,
  Refresh,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';

interface MarketCapData {
  id: string;
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  volume: number;
  change24h: number;
  buyOrders: number;
  sellOrders: number;
  buyVolume: number;
  sellVolume: number;
  orderBook: {
    buy: Array<{ price: number; amount: number }>;
    sell: Array<{ price: number; amount: number }>;
  };
}

interface MarketCapChartProps {
  assets: any[];
}

const MarketCapChart: React.FC<MarketCapChartProps> = ({ assets }) => {
  const [sortedData, setSortedData] = useState<MarketCapData[]>([]);
  const [sortField, setSortField] = useState<'marketCap' | 'volume' | 'change24h' | 'buyVolume' | 'sellVolume'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<MarketCapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [investmentThreshold, setInvestmentThreshold] = useState(1000);
  const [orderBookDialogOpen, setOrderBookDialogOpen] = useState(false);

  // Sort data based on selected field
  useEffect(() => {
    const sorted = [...assets].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    setSortedData(sorted);
  }, [assets, sortField, sortDirection]);

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Calculate investment thresholds based on market cap
  const getInvestmentThreshold = (marketCap: number) => {
    if (marketCap >= 100000000000) { // $100B+
      return {
        min: 100000,
        max: 500000,
        label: '≥ $100,000',
        color: '#1976d2',
      };
    } else if (marketCap >= 10000000000) { // $10B - $100B
      return {
        min: 50000,
        max: 250000,
        label: '≥ $50,000',
        color: '#4caf50',
      };
    } else if (marketCap >= 1000000000) { // $1B - $10B
      return {
        min: 10000,
        max: 50000,
        label: '≥ $10,000',
        color: '#ff9800',
      };
    } else if (marketCap >= 100000000) { // $100M - $1B
      return {
        min: 5000,
        max: 25000,
        label: '≥ $5,000',
        color: '#f44336',
      };
    } else if (marketCap >= 10000000) { // $10M - $100M
      return {
        min: 1000,
        max: 5000,
        label: '≥ $1,000',
        color: '#9c27b0',
      };
    } else {
      return {
        min: 500,
        max: 2500,
        label: '≥ $500',
        color: '#607d8b',
      };
    }
  };

  // Calculate order book depth
  const getOrderBookDepth = (asset: MarketCapData) => {
    const buyDepth = asset.orderBook.buy.reduce((sum, order) => sum + order.amount, 0);
    const sellDepth = asset.orderBook.sell.reduce((sum, order) => sum + order.amount, 0);
    return {
      buy: buyDepth,
      sell: sellDepth,
      spread: asset.orderBook.sell[0].price - asset.orderBook.buy[0].price,
    };
  };

  // Real-time updates
  useInterval(() => {
    // Simulate real-time updates
    setSortedData(prev => prev.map(asset => ({
      ...asset,
      price: asset.price * (1 + Math.random() * 0.005 - 0.0025), // ±0.5% random change
      change24h: Math.random() * 10 - 5, // -5% to +5% random change
      volume: asset.volume * (1 + Math.random() * 0.01 - 0.005), // ±1% random change
    })));
  }, 5000); // Update every 5 seconds

  // Order book visualization
  const renderOrderBook = () => {
    if (!selectedAsset) return null;

    const { buy, sell, spread } = getOrderBookDepth(selectedAsset);
    
    return (
      <Dialog open={orderBookDialogOpen} onClose={() => setOrderBookDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">
              {selectedAsset.name} Order Book
            </Typography>
            <Chip
              label={`Spread: ${spread.toFixed(4)} (${(spread / selectedAsset.price * 100).toFixed(2)}%)`}
              color={spread < 0.01 ? 'success' : spread < 0.1 ? 'warning' : 'error'}
            />
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Buy Orders */}
            <Box>
              <Typography variant="subtitle1" color="success.main">
                Buy Orders (Depth: {formatNumber(buy)} BTC)
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={selectedAsset.orderBook.buy}>
                  <XAxis dataKey="price" />
                  <YAxis />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    fill="#4caf50"
                    stroke="#4caf50"
                    name="Buy Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {/* Sell Orders */}
            <Box>
              <Typography variant="subtitle1" color="error.main">
                Sell Orders (Depth: {formatNumber(sell)} BTC)
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={selectedAsset.orderBook.sell}>
                  <XAxis dataKey="price" />
                  <YAxis />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    fill="#f44336"
                    stroke="#f44336"
                    name="Sell Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderBookDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Market Cap Distribution Chart */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Market Capitalization Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="marketCap"
              fill="#1976d2"
              name="Market Cap"
            >
              {sortedData.slice(0, 10).map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={getInvestmentThreshold(entry.marketCap).color}
                />
              ))}
            </Bar>
            <Bar
              dataKey="volume"
              fill="#4caf50"
              name="24h Volume"
            >
              {sortedData.slice(0, 10).map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill="#4caf50"
                />
              ))}
            </Bar>
            <Line
              dataKey="price"
              stroke="#f44336"
              strokeWidth={2}
              name="Price"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Buy/Sell Orders Table */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Buy/Sell Orders
        </Typography>
        
        {/* Sort Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={sortField === 'marketCap' ? 'contained' : 'outlined'}
            onClick={() => setSortField('marketCap')}
          >
            Market Cap
          </Button>
          <Button
            variant={sortField === 'volume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('volume')}
          >
            Volume
          </Button>
          <Button
            variant={sortField === 'change24h' ? 'contained' : 'outlined'}
            onClick={() => setSortField('change24h')}
          >
            24h Change
          </Button>
          <Button
            variant={sortField === 'buyVolume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('buyVolume')}
          >
            Buy Volume
          </Button>
          <Button
            variant={sortField === 'sellVolume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('sellVolume')}
          >
            Sell Volume
          </Button>
          <IconButton
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          </IconButton>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coin</TableCell>
                <TableCell align="right">Market Cap</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">24h Volume</TableCell>
                <TableCell align="right">Buy Orders</TableCell>
                <TableCell align="right">Sell Orders</TableCell>
                <TableCell align="right">Min Investment</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((asset, index) => {
                const threshold = getInvestmentThreshold(asset.marketCap);
                const { buy, sell, spread } = getOrderBookDepth(asset);

                return (
                  <TableRow key={index}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell align="right">
                      ${formatNumber(asset.marketCap)}
                    </TableCell>
                    <TableCell align="right">
                      ${asset.price.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color: asset.change24h >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {asset.change24h.toFixed(2)}%
                        {asset.change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      ${formatNumber(asset.volume)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={asset.buyOrders.toLocaleString()}
                          color="success"
                          size="small"
                        />
                        <Typography variant="caption" color="success.main">
                          Depth: {formatNumber(buy)} BTC
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={asset.sellOrders.toLocaleString()}
                          color="error"
                          size="small"
                        />
                        <Typography variant="caption" color="error.main">
                          Depth: {formatNumber(sell)} BTC
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={threshold.label}
                        color={threshold.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={() => {
                            setSelectedAsset(asset);
                            setOrderBookDialogOpen(true);
                          }}
                        >
                          <TrendingFlat />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            // TODO: Implement investment calculator
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            // TODO: Implement investment calculator
                          }}
                        >
                          <Remove />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Investment Calculator */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Investment Calculator
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>
              Investment Amount: ${investmentThreshold.toLocaleString()}
            </Typography>
            <Slider
              value={investmentThreshold}
              min={500}
              max={500000}
              step={100}
              onChange={(_, value) => setInvestmentThreshold(value as number)}
              marks={[
                { value: 500, label: '$500' },
                { value: 1000, label: '$1,000' },
                { value: 5000, label: '$5,000' },
                { value: 10000, label: '$10,000' },
                { value: 50000, label: '$50,000' },
                { value: 100000, label: '$100,000' },
                { value: 500000, label: '$500,000' },
              ]}
              valueLabelDisplay="auto"
            />
          </Stack>
        </Box>
      </Box>

      {/* Order Book Dialog */}
      {renderOrderBook()}
    </Box>
  );
};

export default MarketCapChart;