export const ANOMALY_RULES = {
  LARGE_TRANSACTION: {
    threshold: 1000,
    type: 'THRESHOLD_BASED',
    severity: 'warning'
  },
  MULTIPLE_FAILED_TXS: {
    threshold: 3,
    timeWindow: 60000, // 1 minute
    type: 'STATISTICAL',
    severity: 'error'
  },
  UNUSUAL_TOKEN_ACTIVITY: {
    type: 'BEHAVIORAL',
    severity: 'info'
  },
  PRICE_CRASH: {
    threshold: -15, // percent
    type: 'MARKET_BASED',
    severity: 'warning'
  }
};

/**
 * Calculate statistics from price history (for OHLCV anomaly detection)
 */
export const calculateOHLCVStats = (history) => {
  if (history.length < 2) return null;

  const closes = history.map(c => parseFloat(c.close) || 0).filter(p => p > 0);
  const volumes = history.map(v => parseFloat(v.volume) || 0).filter(v => v > 0);

  if (closes.length < 2) return null;

  const avgClose = closes.reduce((a, b) => a + b) / closes.length;
  const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b) / volumes.length : 0;

  const stdDev = Math.sqrt(
    closes.reduce((sq, n) => sq + Math.pow(n - avgClose, 2), 0) / closes.length
  );

  return { avgClose, avgVolume, stdDev };
};

/**
 * Detect anomalies in OHLCV candle data
 */
export const detectOHLCVAnomalies = (candle, history) => {
  const anomalies = [];

  if (history.length < 3) return anomalies;

  const stats = calculateOHLCVStats(history);
  if (!stats) return anomalies;

  const currentPrice = parseFloat(candle.close) || 0;
  const currentVolume = parseFloat(candle.volume) || 0;
  const currentHigh = parseFloat(candle.high) || 0;
  const currentLow = parseFloat(candle.low) || 0;

  if (currentPrice <= 0) return anomalies;

  // Price spike detection (using standard deviation)
  const priceChange = ((currentPrice - stats.avgClose) / stats.avgClose) * 100;
  if (Math.abs(priceChange) > stats.stdDev * 2) {
    anomalies.push({
      type: 'PRICE_SPIKE',
      severity: Math.abs(priceChange) > stats.stdDev * 3 ? 'CRITICAL' : 'HIGH',
      value: priceChange.toFixed(2) + '%',
      details: `Price: ${currentPrice.toFixed(6)} vs Avg: ${stats.avgClose.toFixed(6)}`,
      title: priceChange > 0 ? 'Price Surge Detected' : 'Price Drop Detected',
      message: `${Math.abs(priceChange).toFixed(2)}% ${priceChange > 0 ? 'increase' : 'decrease'} from average`,
      timestamp: new Date()
    });
  }

  // Volume spike detection
  if (stats.avgVolume > 0) {
    const volumeChange = currentVolume / stats.avgVolume;
    if (volumeChange > 2) {
      anomalies.push({
        type: 'VOLUME_SPIKE',
        severity: volumeChange > 5 ? 'CRITICAL' : 'HIGH',
        value: volumeChange.toFixed(2) + 'x',
        details: `Volume: ${currentVolume.toExponential(4)} vs Avg: ${stats.avgVolume.toExponential(4)}`,
        title: 'Volume Spike Detected',
        message: `${volumeChange.toFixed(2)}x higher than average volume`,
        timestamp: new Date()
      });
    }
  }

  // High-Low spread anomaly (volatility)
  const spread = currentHigh - currentLow;
  if (history.length > 0) {
    const lastHigh = parseFloat(history[history.length - 1].high) || 0;
    const lastLow = parseFloat(history[history.length - 1].low) || 0;
    const avgSpread = (lastHigh - lastLow) || 0.00001;
    if (spread > avgSpread * 3) {
      anomalies.push({
        type: 'HIGH_VOLATILITY',
        severity: 'MEDIUM',
        value: (spread / avgSpread).toFixed(2) + 'x',
        details: `Spread: ${spread.toFixed(6)} vs Avg: ${avgSpread.toFixed(6)}`,
        title: 'High Volatility Detected',
        message: `Price spread is ${(spread / avgSpread).toFixed(2)}x higher than normal`,
        timestamp: new Date()
      });
    }
  }

  return anomalies;
};

/**
 * Detect anomalies in transaction data
 */
export const detectAnomalies = (txData, previousData) => {
  const anomalies = [];

  // Threshold-based: Large transaction
  if (Math.abs(txData.value_change) > ANOMALY_RULES.LARGE_TRANSACTION.threshold) {
    anomalies.push({
      type: 'LARGE_TRANSACTION',
      severity: 'warning',
      title: 'Large Transaction Detected',
      message: `Unusual amount: ${Math.abs(txData.value_change).toFixed(2)} ${txData.token_symbol}`,
      timestamp: new Date()
    });
  }

  // Behavioral: Failed transactions
  if (txData.status === 'failed') {
    anomalies.push({
      type: 'FAILED_TRANSACTION',
      severity: 'error',
      title: 'Transaction Failed',
      message: `TX ${txData.tx_hash} failed - possible security issue`,
      timestamp: new Date()
    });
  }

  // Statistical: Activity burst
  if (previousData.recentTxCount > ANOMALY_RULES.UNUSUAL_TOKEN_ACTIVITY.threshold) {
    anomalies.push({
      type: 'ACTIVITY_BURST',
      severity: 'info',
      title: 'Unusual Activity',
      message: `${previousData.recentTxCount} transactions in last minute`,
      timestamp: new Date()
    });
  }

  return anomalies;
};