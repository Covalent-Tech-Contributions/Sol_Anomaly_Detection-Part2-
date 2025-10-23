# Solana Token OHLCV Anomaly Detection

A comprehensive real-time monitoring application for Solana blockchain that detects anomalies in both wallet activity and token price movements using the GoldRush Streaming API.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.7-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 🚀 Features

### Wallet Activity Monitoring
- **Real-time Transaction Tracking**: Monitor wallet transactions as they happen
- **Token Balance Updates**: Live balance updates for all tokens
- **Transaction Anomaly Detection**:
  - Large transaction alerts
  - Failed transaction detection
  - Activity burst detection
- **Comprehensive Statistics**: Success rates, transaction counts, and more

### OHLCV Token Price Monitoring
- **Real-time Price Data**: Stream OHLCV (Open, High, Low, Close, Volume) data for Solana tokens
- **Advanced Anomaly Detection**:
  - **Price Spike Detection**: Identifies unusual price movements using statistical analysis
  - **Volume Spike Detection**: Detects abnormal trading volume (2x-5x average)
  - **Volatility Detection**: Monitors price spread for high volatility patterns
- **Statistical Analysis**:
  - Average price tracking
  - Standard deviation calculations
  - Volume analysis
  - Price change percentages
- **Visual Dashboard**: Beautiful UI displaying all OHLCV data and anomalies
- **Historical Data**: Maintains last 50 candles for trend analysis

## 📋 Prerequisites

- Node.js 16+ and npm
- GoldRush API Key ([Get one here](https://goldrush.dev/platform/apikey))
- Solana wallet address (for wallet monitoring)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root:

```env
# Required: GoldRush API Key
VITE_GOLDRUSH_API_KEY=your_goldrush_api_key_here

# Optional: Default wallet to monitor
VITE_SOLANA_WALLET_ADDRESS=your_wallet_address_here

# Optional: Default token for OHLCV (Wrapped SOL by default)
VITE_TOKEN_ADDRESS=So11111111111111111111111111111111111111112
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📊 Usage

### Monitoring Modes

The application offers two monitoring modes accessible via tabs:

#### 1. Wallet Monitor
- Track all transactions for a specific wallet
- Monitor token balances
- Detect transaction anomalies
- View comprehensive transaction history

#### 2. OHLCV Token Monitor
- Real-time price monitoring for Solana tokens
- Detect price spikes and drops
- Monitor volume surges
- Track market volatility
- View candle history

### Changing Settings

1. Click the **Settings** icon in the header
2. Modify wallet address or token address
3. Click **Reconnect** to apply changes

### Understanding Anomalies

#### Wallet Anomalies
- **Large Transaction**: Transaction exceeds threshold amount
- **Failed Transaction**: Transaction failed (potential security issue)
- **Activity Burst**: Unusual number of transactions in short time

#### OHLCV Anomalies
- **Price Spike (HIGH)**: Price change > 2 standard deviations
- **Price Spike (CRITICAL)**: Price change > 3 standard deviations
- **Volume Spike (HIGH)**: Volume > 2x average
- **Volume Spike (CRITICAL)**: Volume > 5x average
- **High Volatility (MEDIUM)**: Price spread > 3x normal

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   ├── AnomalyAlert.jsx       # Anomaly display component
│   ├── TokenBalances.jsx      # Token balance display
│   ├── TransactionTable.jsx   # Transaction history
│   ├── OHLCVMonitor.jsx       # OHLCV monitoring dashboard
│   └── WalletAnomalyDetector.jsx
├── hooks/
│   └── useGoldrushStreaming.js # Streaming hooks
├── services/
│   ├── anomalyDetection.js    # Anomaly detection logic
│   ├── dataProcessing.js      # Data transformation
│   └── goldrushClient.js      # GoldRush API client
├── App.jsx                     # Main application
└── main.jsx                    # Entry point
```

### Key Technologies
- **React 19**: Latest React with modern hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **GoldRush SDK**: Real-time blockchain streaming
- **Lucide React**: Modern icon library

## 🔧 Configuration

### Streaming Parameters

OHLCV streaming can be configured in `useOHLCVStreaming` hook:

```javascript
const { candles, anomalies } = useOHLCVStreaming(tokenAddress, {
  interval: StreamingInterval.ONE_MINUTE,    // Data interval
  timeframe: StreamingTimeframe.ONE_HOUR,    // Timeframe
  maxHistory: 50                             // Candles to keep
});
```

### Anomaly Thresholds

Modify thresholds in `src/services/anomalyDetection.js`:

```javascript
// Price spike: Currently 2x and 3x standard deviation
if (Math.abs(priceChange) > stats.stdDev * 2) { ... }

// Volume spike: Currently 2x and 5x average
if (volumeChange > 2) { ... }

// Volatility: Currently 3x average spread
if (spread > avgSpread * 3) { ... }
```

## 📱 Features Breakdown

### Real-time Streaming
- WebSocket connections to GoldRush API
- Automatic reconnection handling
- Live data updates without page refresh

### Anomaly Detection Algorithms
1. **Statistical Analysis**: Standard deviation for price movements
2. **Threshold-Based**: Volume and amount thresholds
3. **Pattern Recognition**: Activity bursts and volatility

### Data Processing
- Multiple API response format handling
- Data normalization and validation
- Historical data management
- Statistical calculations

## 🐛 Troubleshooting

### No OHLCV Data Received
- OHLCV streaming is in BETA - may have limited availability
- Contact support@covalenthq.com for Beta access
- Check browser console for detailed logs
- Verify token has active trading on Solana DEXs

### Connection Issues
- Verify `VITE_GOLDRUSH_API_KEY` in `.env`
- Check API key has streaming permissions
- Ensure stable internet connection
- Check browser console for errors

### No Wallet Data
- Verify wallet address is correct
- Check wallet has recent transaction activity
- Ensure API key has appropriate permissions

## 📚 Documentation

- [OHLCV Integration Guide](./OHLCV_INTEGRATION.md) - Detailed OHLCV feature documentation
- [GoldRush API Docs](https://goldrush.dev/docs) - Official API documentation
- [Solana Docs](https://docs.solana.com/) - Solana blockchain documentation

## 🔍 Console Logging

The application provides comprehensive logging:

- `🔗` Connection events
- `✓` Successful operations
- `📡` Streaming subscriptions
- `⚠️` Anomaly detections
- `✗` Errors and issues
- `🛑` Cleanup operations

## 🚧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [GoldRush (Covalent)](https://goldrush.dev/) for the streaming API
- [Solana](https://solana.com/) blockchain
- React and Vite teams for excellent tooling

## 📞 Support

For issues or questions:
- GoldRush Support: support@covalenthq.com
- API Key: https://goldrush.dev/platform/apikey
- Documentation: https://goldrush.dev/docs

---

Built with ❤️ for the Solana ecosystem
