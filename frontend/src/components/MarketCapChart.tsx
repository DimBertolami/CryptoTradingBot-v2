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
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Sort,
} from '@mui/icons-material';

interface MarketCapData {
  name: string;
  marketCap: number;
  price: number;
  volume: number;
  change24h: number;
  buyOrders: number;
  sellOrders: number;
}

interface MarketCapChartProps {
  assets: any[];
}

const MarketCapChart: React.FC<MarketCapChartProps> = ({ assets }) => {
  const [sortedData, setSortedData] = useState<MarketCapData[]>([]);
  const [sortField, setSortField] = useState<'marketCap' | 'volume' | 'change24h'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
      return '≥ $100,000';
    } else if (marketCap >= 10000000000) { // $10B - $100B
      return '≥ $50,000';
    } else if (marketCap >= 1000000000) { // $1B - $10B
      return '≥ $10,000';
    } else if (marketCap >= 100000000) { // $100M - $1B
      return '≥ $5,000';
    } else if (marketCap >= 10000000) { // $10M - $100M
      return '≥ $1,000';
    } else {
      return '≥ $500';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Market Cap Distribution Chart */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Market Capitalization Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
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
            />
            <Bar
              dataKey="volume"
              fill="#4caf50"
              name="24h Volume"
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
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((asset, index) => (
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
                      }}
                    >
                      {asset.change24h.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    ${formatNumber(asset.volume)}
                  </TableCell>
                  <TableCell align="right">
                    {asset.buyOrders.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {asset.sellOrders.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {getInvestmentThreshold(asset.marketCap)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default MarketCapChart;