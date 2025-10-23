# OHLCV Token Anomaly Detection Integration

This document explains the OHLCV (Open, High, Low, Close, Volume) streaming integration that has been added to your Solana Anomaly Detection application.

## Overview

The application now includes a comprehensive OHLCV token monitoring system that streams real-time price data for Solana tokens using the GoldRush Streaming API. It detects price anomalies, volume spikes, and volatility patterns in real-time.

## Features Integrated

### 1. **OHLCV Streaming Hook** (`src/hooks/useGoldrushStreaming.js`)
- New `useOHLCVStreaming` hook for subscribing to token OHLCV data
- Automatically processes incoming candle data
- Maintains historical candle data (default: 50 candles)
- Real-time anomaly detection
- Statistical analysis of price and volume

### 2. **Anomaly Detection** (`src/services/anomalyDetection.js`)
Three types of anomalies are detected:

#### Price Spike Detection
- Uses standard deviation to identify unusual price movements
- **HIGH severity**: Price change > 2 standard deviations from average
- **CRITICAL severity**: Price change > 3 standard deviations from average
- Detects both surges and drops

#### Volume Spike Detection
- Compares current volume to historical average
- **HIGH severity**: Volume > 2x average
- **CRITICAL severity**: Volume > 5x average

#### Volatility Detection
- Analyzes high-low price spread
- **MEDIUM severity**: Spread > 3x normal spread
- Indicates increased market uncertainty

### 3. **Data Processing** (`src/services/dataProcessing.js`)
- `processOHLCVCandle()`: Handles multiple GoldRush API response formats
- `formatPrice()`: Formats prices to 6 decimal places
- `formatVolume()`: Formats volume in scientific notation
- `calculateOHLCVStatistics()`: Computes comprehensive statistics

### 4. **OHLCV Monitor Component** (`src/components/OHLCVMonitor.jsx`)
Beautiful UI displaying:
- Real-time stream status
- Current candle OHLCV data
- Volume and USD volume
- Token information
- Detected anomalies with severity levels
- Candle history (last 20 candles)
- Statistics dashboard

### 5. **Enhanced App Integration** (`src/App.jsx`)
- Tab-based navigation (Wallet Monitor / OHLCV Token Monitor)
- Separate monitoring for wallet activity and token prices
- Configurable token address via settings
- Real-time statistics for both monitoring modes

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required: GoldRush API Key
VITE_GOLDRUSH_API_KEY=your_api_key_here

# Optional: Default token to monitor
VITE_TOKEN_ADDRESS=So11111111111111111111111111111111111111112
```

### Default Token
By default, the app monitors **Wrapped SOL** (wSOL):
- Address: `So11111111111111111111111111111111111111112`

You can change this in the Settings panel or via environment variable.

## Usage

### Starting the Application

```bash
npm install
npm run dev
```

### Switching Between Modes

1. **Wallet Monitor**: Track wallet transactions, balances, and anomalies
2. **OHLCV Token Monitor**: Monitor token price data and market anomalies

Click the tabs in the header to switch between modes.

### Changing the Monitored Token

1. Click the Settings icon in the header
2. Enter a new Solana token address in "Token Address (for OHLCV)"
3. Click "Reconnect" to apply changes

## How It Works

### Data Flow

```
GoldRush API Stream
    ↓
useOHLCVStreaming Hook
    ↓
processOHLCVCandle() - Parse response
    ↓
detectOHLCVAnomalies() - Analyze for anomalies
    ↓
OHLCVMonitor Component - Display results
```

### Anomaly Detection Logic

The system maintains a rolling history of candles and:

1. **Calculates Statistics**:
   - Average close price
   - Average volume
   - Standard deviation of prices

2. **Compares Current Candle**:
   - Price vs historical average
   - Volume vs historical average
   - High-low spread vs previous spread

3. **Triggers Alerts**:
   - When thresholds are exceeded
   - Displays severity level
   - Shows detailed information

## API Integration Details

### Subscription Parameters

```javascript
{
  chain_name: StreamingChain.SOLANA_MAINNET,
  token_addresses: [tokenAddress],
  interval: StreamingInterval.ONE_MINUTE,
  timeframe: StreamingTimeframe.ONE_HOUR
}
```

### Response Format Handling

The code handles multiple response formats from the GoldRush API:
- Direct GraphQL format: `data.ohlcvCandlesForToken`
- Nested format: `data.data.ohlcvCandlesForToken`
- Array format: Direct array of candles
- Items format: `data.items`

## Components Modified

1. **src/App.jsx** - Added OHLCV tab and integration
2. **src/hooks/useGoldrushStreaming.js** - Added `useOHLCVStreaming` hook
3. **src/services/anomalyDetection.js** - Added OHLCV anomaly detection
4. **src/services/dataProcessing.js** - Added OHLCV data processing
5. **src/services/goldrushClient.js** - Enhanced callbacks
6. **src/components/OHLCVMonitor.jsx** - New component (created)

## Troubleshooting

### No Data Received
- OHLCV streaming is in BETA and may have limited availability
- Ensure your API key has access to streaming endpoints
- Contact support@covalenthq.com for Beta access
- Check console for detailed logs

### Connection Issues
- Verify your API key in `.env` file
- Check browser console for errors
- Ensure stable internet connection

### Token Not Found
- Verify the token address is correct
- Ensure the token has active trading on Solana DEXs
- Try the default Wrapped SOL address first

## Console Logging

The integration includes comprehensive logging:
- `📡` Subscription events
- `✓` Successful data reception
- `⚠️` Anomaly detection alerts
- `✗` Error messages
- `🛑` Cleanup events

Check your browser console for detailed streaming information.

## Notes from Original CLI

This integration is based on the `goldrush-cli.js` implementation with the following adaptations:

1. **React State Management**: Uses React hooks instead of console display
2. **UI Components**: Visual representation instead of terminal output
3. **Real-time Updates**: State updates trigger component re-renders
4. **Error Handling**: Graceful error display in UI
5. **Browser Compatibility**: Adapted for browser environment

## Future Enhancements

Potential improvements:
- Historical chart visualization
- Customizable anomaly thresholds
- Multi-token monitoring
- Export anomaly reports
- WebSocket reconnection logic
- Notification system for critical anomalies

## Support

For issues or questions:
- GoldRush Support: support@covalenthq.com
- API Documentation: https://goldrush.dev/docs
- Beta Access: Request via support email

