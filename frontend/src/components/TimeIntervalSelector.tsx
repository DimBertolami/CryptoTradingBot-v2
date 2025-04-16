import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectTimeInterval,
  setTimeInterval,
} from '../features/timeInterval/timeIntervalSlice';

// Define time intervals with their display names and API values
export type TimeInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d' | '1y';

const timeIntervals: { [key: string]: { label: string; value: TimeInterval } } = {
  '1m': { label: '1m', value: '1m' },
  '5m': { label: '5m', value: '5m' },
  '10m': { label: '10m', value: '10m' },
  '30m': { label: '30m', value: '30m' },
  '1h': { label: '1h', value: '1h' },
  '1d': { label: '1d', value: '1d' },
  '1y': { label: '1y', value: '1y' },
};

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: '40px',
          '&.Mui-selected': {
            backgroundColor: '#2196f3',
            color: 'white',
          },
        },
      },
    },
  },
});

interface TimeIntervalSelectorProps {
  onChange?: (interval: TimeInterval) => void;
}

export const TimeIntervalSelector: React.FC<TimeIntervalSelectorProps> = ({ onChange }) => {
  const dispatch = useAppDispatch();
  const currentInterval = useAppSelector(selectTimeInterval);

  const handleIntervalChange = (interval: TimeInterval) => {
    dispatch(setTimeInterval(interval));
    if (onChange) {
      onChange(interval);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Time Interval
        </Typography>
        <ButtonGroup
          variant="outlined"
          size="small"
          sx={{
            '& .MuiButton-root': {
              borderRadius: '4px',
            },
          }}
        >
          {Object.entries(timeIntervals).map(([key, { label, value }]) => (
            <Button
              key={key}
              onClick={() => handleIntervalChange(value)}
              variant={currentInterval === value ? 'contained' : 'outlined'}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
    </ThemeProvider>
  );
};

export default TimeIntervalSelector;