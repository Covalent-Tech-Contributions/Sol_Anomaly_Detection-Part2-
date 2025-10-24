/**
 * Data Processing Service
 * Handles data transformation, filtering, and aggregation from Goldrush streaming
 */

/**
 * Process incoming transaction data
 */
//
export const processTransactionData = (rawData) => {
  if (!rawData) return null;

  const data = rawData.data || rawData;

  return {
    id: generateId(),
    hash: data.tx_hash || data.hash || '',
    type: data.tx_type || data.type || 'transfer',
    token: data.token_symbol || data.symbol || 'UNKNOWN',
    amount: Math.abs(parseFloat(data.value_change || data.amount || 0)),
    status: data.status || 'pending',
    timestamp: data.timestamp || new Date().toISOString(),
    from: data.from_address || '',
    to: data.to_address || '',
    gasUsed: data.gas_used || 0,
    fee: parseFloat(data.transaction_fee || 0),
  };
};

/**
 * Process wallet balance data
 */
export const processBalanceData = (rawData) => {
  if (!rawData) return null;

  const data = rawData.data || rawData;

  return {
    token: data.token_symbol || data.symbol || 'UNKNOWN',
    balance: parseFloat(data.balance || 0),
    usdValue: parseFloat(data.quote || 0),
    decimals: parseInt(data.decimals || 0),
    contractAddress: data.contract_address || data.tokenAddress || '',
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Process price data from Goldrush
 */
export const processPriceData = (rawData) => {
  if (!rawData) return null;

  const data = rawData.data || rawData;

  return {
    token: data.token_symbol || data.symbol || 'UNKNOWN',
    price: parseFloat(data.price_usd || data.price || 0),
    priceChange24h: parseFloat(data.price_change_24h || 0),
    marketCap: parseFloat(data.market_cap_usd || 0),
    volume24h: parseFloat(data.volume_usd_24h || 0),
    timestamp: data.timestamp || new Date().toISOString(),
  };
};

/**
 * Calculate statistics from transaction history
 */
export const calculateTransactionStats = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      successRate: 0,
      failureRate: 0,
      averageAmount: 0,
      totalVolume: 0,
      txByType: {},
    };
  }

  const totalTx = transactions.length;
  const successfulTx = transactions.filter((tx) => tx.status === 'success').length;
  const failedTx = transactions.filter((tx) => tx.status === 'failed').length;

  const txByType = transactions.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {});

  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const averageAmount = totalVolume / totalTx;

  return {
    totalTransactions: totalTx,
    successRate: ((successfulTx / totalTx) * 100).toFixed(2),
    failureRate: ((failedTx / totalTx) * 100).toFixed(2),
    averageAmount: averageAmount.toFixed(4),
    totalVolume: totalVolume.toFixed(4),
    txByType,
  };
};

/**
 * Detect unusual patterns in recent transactions
 */
export const detectUnusualPatterns = (transactions, config = {}) => {
  const {
    timeWindow = 60000, // 1 minute
    burstThreshold = 5,
    failureThreshold = 0.5,
  } = config;

  const patterns = [];
  const now = Date.now();

  // Recent transactions within time window
  const recentTxs = transactions.filter(
    (tx) => now - new Date(tx.timestamp).getTime() < timeWindow
  );

  // Pattern 1: Activity burst
  if (recentTxs.length > burstThreshold) {
    patterns.push({
      type: 'ACTIVITY_BURST',
      severity: 'info',
      description: `${recentTxs.length} transactions in the last minute`,
      data: { count: recentTxs.length, timeWindow },
    });
  }

  // Pattern 2: High failure rate
  const failedCount = recentTxs.filter((tx) => tx.status === 'failed').length;
  if (recentTxs.length > 0 && failedCount / recentTxs.length > failureThreshold) {
    patterns.push({
      type: 'HIGH_FAILURE_RATE',
      severity: 'warning',
      description: `${((failedCount / recentTxs.length) * 100).toFixed(1)}% transaction failure rate`,
      data: { failedCount, totalCount: recentTxs.length },
    });
  }

  // Pattern 3: Token concentration
  const tokenCounts = recentTxs.reduce((acc, tx) => {
    acc[tx.token] = (acc[tx.token] || 0) + 1;
    return acc;
  }, {});

  const maxTokenTxs = Math.max(...Object.values(tokenCounts));
  if (recentTxs.length > 3 && maxTokenTxs / recentTxs.length > 0.7) {
    const dominantToken = Object.keys(tokenCounts).find(
      (token) => tokenCounts[token] === maxTokenTxs
    );
    patterns.push({
      type: 'TOKEN_CONCENTRATION',
      severity: 'info',
      description: `${dominantToken} accounts for ${((maxTokenTxs / recentTxs.length) * 100).toFixed(0)}% of activity`,
      data: { token: dominantToken, percentage: ((maxTokenTxs / recentTxs.length) * 100).toFixed(1) },
    });
  }

  return patterns;
};

/**
 * Aggregate balance data by token
 */
export const aggregateBalances = (balances) => {
  const aggregated = {};
  let totalUsdValue = 0;

  Object.entries(balances).forEach(([token, data]) => {
    aggregated[token] = {
      balance: parseFloat(data.balance || 0),
      usdValue: parseFloat(data.usdValue || 0),
    };
    totalUsdValue += aggregated[token].usdValue;
  });

  return {
    balances: aggregated,
    totalUsdValue: totalUsdValue.toFixed(2),
  };
};

/**
 * Filter transactions by criteria
 */
export const filterTransactions = (transactions, filters = {}) => {
  const {
    type = null,
    status = null,
    token = null,
    minAmount = 0,
    maxAmount = Infinity,
    startDate = null,
    endDate = null,
  } = filters;

  return transactions.filter((tx) => {
    if (type && tx.type !== type) return false;
    if (status && tx.status !== status) return false;
    if (token && tx.token !== token) return false;
    if (tx.amount < minAmount || tx.amount > maxAmount) return false;

    if (startDate || endDate) {
      const txTime = new Date(tx.timestamp).getTime();
      if (startDate && txTime < new Date(startDate).getTime()) return false;
      if (endDate && txTime > new Date(endDate).getTime()) return false;
    }

    return true;
  });
};

/**
 * Calculate price impact and volatility
 */
export const calculatePriceMetrics = (priceHistory) => {
  if (!priceHistory || priceHistory.length < 2) {
    return {
      volatility: 0,
      trend: 'neutral',
      maxPrice: 0,
      minPrice: 0,
      priceChange: 0,
    };
  }

  const prices = priceHistory.map((p) => parseFloat(p.price || 0));
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  // Calculate volatility (standard deviation)
  const mean = prices.reduce((a, b) => a + b) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);

  // Determine trend
  let trend = 'neutral';
  if (priceChange > 5) trend = 'bullish';
  else if (priceChange < -5) trend = 'bearish';

  return {
    volatility: volatility.toFixed(4),
    trend,
    maxPrice: maxPrice.toFixed(4),
    minPrice: minPrice.toFixed(4),
    priceChange: priceChange.toFixed(2),
  };
};

/**
 * Generate transaction summary
 */
export const generateTransactionSummary = (transaction) => {
  return {
    ...transaction,
    displayType: capitalizeFirstLetter(transaction.type),
    displayStatus: capitalizeFirstLetter(transaction.status),
    formattedAmount: `${transaction.type === 'send' ? '-' : '+'}${transaction.amount.toFixed(4)} ${transaction.token}`,
    timeAgo: getTimeAgo(new Date(transaction.timestamp)),
  };
};

/**
 * Helper: Generate unique ID
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Helper: Capitalize first letter
 */
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Helper: Get relative time string
 */
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
};

/**
 * Process incoming OHLCV candle data
 */
export const processOHLCVCandle = (rawData) => {
  if (!rawData) return null;

  // Handle different response formats from GoldRush API
  let candles = [];
  
  if (rawData.ohlcvCandlesForToken) {
    // Direct GraphQL response format
    candles = Array.isArray(rawData.ohlcvCandlesForToken) 
      ? rawData.ohlcvCandlesForToken 
      : [rawData.ohlcvCandlesForToken];
  } else if (rawData.data && rawData.data.ohlcvCandlesForToken) {
    // Nested GraphQL response format
    candles = Array.isArray(rawData.data.ohlcvCandlesForToken) 
      ? rawData.data.ohlcvCandlesForToken 
      : [rawData.data.ohlcvCandlesForToken];
  } else if (Array.isArray(rawData)) {
    // Direct array format
    candles = rawData;
  } else if (rawData.items) {
    // Items array format
    candles = rawData.items;
  } else {
    // Single candle object
    candles = [rawData];
  }

  // Process each candle
  return candles.map(candle => ({
    id: generateId(),
    timestamp: candle.timestamp || new Date().toISOString(),
    open: parseFloat(candle.open) || 0,
    high: parseFloat(candle.high) || 0,
    low: parseFloat(candle.low) || 0,
    close: parseFloat(candle.close) || 0,
    volume: parseFloat(candle.volume) || 0,
    volumeUsd: parseFloat(candle.volume_usd) || 0,
    quoteRate: parseFloat(candle.quote_rate) || 0,
    quoteRateUsd: parseFloat(candle.quote_rate_usd) || 0,
    baseToken: candle.base_token ? {
      name: candle.base_token.contract_name || 'Unknown',
      symbol: candle.base_token.contract_ticker_symbol || 'UNKNOWN',
      address: candle.base_token.contract_address || '',
      decimals: candle.base_token.contract_decimals || 0
    } : null,
    quoteToken: candle.quote_token ? {
      name: candle.quote_token.contract_name || 'Unknown',
      symbol: candle.quote_token.contract_ticker_symbol || 'UNKNOWN',
      address: candle.quote_token.contract_address || '',
      decimals: candle.quote_token.contract_decimals || 0
    } : null,
    rawData: candle
  }));
};

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  if (!price || price === 0) return '0.000000';
  const num = parseFloat(price);
  return num.toFixed(6);
};

/**
 * Format volume for display
 */
export const formatVolume = (volume) => {
  if (!volume || volume === 0) return '0.0000e+0';
  const num = parseFloat(volume);
  return num.toExponential(4);
};

/**
 * Calculate OHLCV statistics
 */
export const calculateOHLCVStatistics = (candles) => {
  if (!candles || candles.length === 0) {
    return {
      totalCandles: 0,
      avgPrice: 0,
      avgVolume: 0,
      maxPrice: 0,
      minPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
      totalVolume: 0
    };
  }

  const prices = candles.map(c => c.close).filter(p => p > 0);
  const volumes = candles.map(c => c.volume).filter(v => v > 0);

  if (prices.length === 0) {
    return {
      totalCandles: candles.length,
      avgPrice: 0,
      avgVolume: 0,
      maxPrice: 0,
      minPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
      totalVolume: 0
    };
  }

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const totalVolume = volumes.reduce((a, b) => a + b, 0);

  const priceChange = prices[prices.length - 1] - prices[0];
  const priceChangePercent = ((priceChange / prices[0]) * 100) || 0;

  return {
    totalCandles: candles.length,
    avgPrice: avgPrice.toFixed(6),
    avgVolume: avgVolume.toExponential(4),
    maxPrice: maxPrice.toFixed(6),
    minPrice: minPrice.toFixed(6),
    priceChange: priceChange.toFixed(6),
    priceChangePercent: priceChangePercent.toFixed(2),
    totalVolume: totalVolume.toExponential(4)
  };
};