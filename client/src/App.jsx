import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, WifiOff, Settings, BarChart3 } from 'lucide-react';
import AnomalyAlert from './components/AnomalyAlert';
import TokenBalances from './components/TokenBalances';
import TransactionTable from './components/TransactionTable';
import OHLCVMonitor from './components/OHLCVMonitor';
import { initializeGoldrushClient, getGoldrushClient, disconnectGoldrushClient } from './services/goldrushClient';
import { StreamingChain } from '@covalenthq/client-sdk';
import {
  processTransactionData,
  processBalanceData,
  detectUnusualPatterns,
  calculateTransactionStats,
} from './services/dataProcessing';
import { detectAnomalies } from './services/anomalyDetection';
import { useOHLCVStreaming } from './hooks/useGoldrushStreaming';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(
    import.meta.env.VITE_SOLANA_WALLET_ADDRESS || import.meta.env.REACT_APP_SOLANA_WALLET_ADDRESS || 'JUP4Fb2cqiRiBcsFyH4qBLEV9DdroVHix7gpQtzLChE' // Jupiter Program - Very Active
  );
  const [tokenAddress, setTokenAddress] = useState(
    import.meta.env.VITE_TOKEN_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC - High Volume Trading
  );
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' or 'ohlcv'

  const clientRef = useRef(null);
  const unsubscribeRef = useRef({});
  const previousDataRef = useRef({
    recentTxCount: 0,
    lastBalances: {},
  });

  // Use OHLCV streaming hook
  const { 
    isConnected: ohlcvConnected, 
    candles, 
    anomalies: ohlcvAnomalies, 
    stats: ohlcvStats, 
    error: ohlcvError,
    streamInfo 
  } = useOHLCVStreaming(tokenAddress);

  /**
   * Initialize Goldrush connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize client
      initializeGoldrushClient();
      clientRef.current = getGoldrushClient();
      setIsConnected(true);

      console.log('Connected to Goldrush Streaming API');
    } catch (err) {
      console.error('Failed to initialize Goldrush:', err);
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Subscribe to wallet activity
   */
  const subscribeToWalletActivity = useCallback(() => {
    if (!clientRef.current) return;

    try {
      // Subscribe to wallet activity stream
      unsubscribeRef.current.wallet = clientRef.current.StreamingService.subscribeToWalletActivity(
        {
          chain_name: StreamingChain.SOLANA_MAINNET,
          wallet_addresses: [walletAddress],
        },
        {
          next: (response) => {
            const data = response?.data;
            if (!data) return;

            // Process transaction data
            const processedTx = processTransactionData(data);

            // Add to transactions
            setTransactions((prev) => [processedTx, ...prev.slice(0, 99)]);

            // Update balances
            if (data.token_symbol) {
              setBalances((prev) => ({
                ...prev,
                [data.token_symbol]: (prev[data.token_symbol] || 0) + (data.value_change || 0),
              }));
            }

            // Detect anomalies
            const newAnomalies = detectAnomalies(data, previousDataRef.current);
            if (newAnomalies.length > 0) {
              newAnomalies.forEach((anomaly) => {
                addAnomaly(anomaly.title, anomaly.message, anomaly.severity);
              });
            }
          },
          error: (err) => {
            console.error('Wallet subscription error:', err);
            addAnomaly('Connection Error', `Streaming error: ${err.message}`, 'error');
          },
        }
      );
    } catch (err) {
      console.error('Failed to subscribe to wallet activity:', err);
    }
  }, [walletAddress]);

  /**
   * Subscribe to token balances
   */
  const subscribeToTokenBalances = useCallback(() => {
    if (!clientRef.current) return;

    try {
      unsubscribeRef.current.balances = clientRef.current.StreamingService.subscribeToTokenBalances(
        {
          chain_name: StreamingChain.SOLANA_MAINNET,
          wallet_addresses: [walletAddress],
        },
        {
          next: (response) => {
            const data = response?.data;
            if (!data) return;

            const processedBalance = processBalanceData(data);
            setBalances((prev) => ({
              ...prev,
              [processedBalance.token]: processedBalance.balance,
            }));
          },
          error: (err) => {
            console.error('Balance subscription error:', err);
          },
        }
      );
    } catch (err) {
      console.error('Failed to subscribe to token balances:', err);
    }
  }, [walletAddress]);

  /**
   * Add anomaly to list
   */
  const addAnomaly = useCallback((title, message, severity = 'info') => {
    const newAnomaly = {
      id: Math.random(),
      title,
      message,
      severity,
      timestamp: new Date(),
    };

    setAnomalies((prev) => [newAnomaly, ...prev.slice(0, 19)]);
  }, []);

  /**
   * Calculate statistics from transactions
   */
  useEffect(() => {
    const newStats = calculateTransactionStats(transactions);
    setStats(newStats);

    // Detect unusual patterns
    const patterns = detectUnusualPatterns(transactions);
    previousDataRef.current.recentTxCount = transactions.length;
  }, [transactions]);

  /**
   * Setup streaming on mount
   */
  useEffect(() => {
    initializeConnection();

    return () => {
      cleanup();
    };
  }, [initializeConnection]);

  /**
   * Subscribe to data streams when connected
   */
  useEffect(() => {
    if (isConnected && clientRef.current) {
      subscribeToWalletActivity();
      subscribeToTokenBalances();
    }

    return () => {
      // Cleanup will be handled in main cleanup
    };
  }, [isConnected, walletAddress, subscribeToWalletActivity, subscribeToTokenBalances]);

  /**
   * Cleanup function
   */
  const cleanup = async () => {
    Object.values(unsubscribeRef.current).forEach((unsub) => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (err) {
          console.error('Error unsubscribing:', err);
        }
      }
    });
    unsubscribeRef.current = {};

    try {
      await disconnectGoldrushClient();
    } catch (err) {
      console.error('Error disconnecting:', err);
    }

    setIsConnected(false);
  };

  /**
   * Handle wallet address change
   */
  const handleWalletAddressChange = (newAddress) => {
    setWalletAddress(newAddress);
    setTransactions([]);
    setBalances({});
    setAnomalies([]);
  };

  /**
   * Reconnect function
   */
  const handleReconnect = () => {
    cleanup();
    setTimeout(() => {
      initializeConnection();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Solana Anomaly Detector</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time wallet monitoring with Goldrush Streaming</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                isConnected
                  ? 'bg-green-900/20 border-green-700/50 text-green-400'
                  : 'bg-red-900/20 border-red-700/50 text-red-400'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-semibold">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-semibold">Disconnected</span>
                  </>
                )}
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'wallet'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Wallet Monitor
            </button>
            <button
              onClick={() => setActiveTab('ohlcv')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'ohlcv'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              OHLCV Token Monitor
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => handleWalletAddressChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500"
                    placeholder="Enter Solana wallet address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Token Address (for OHLCV)
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 font-mono text-sm"
                    placeholder="Enter Solana token address"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Default: So11111111111111111111111111111111111111112 (Wrapped SOL)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReconnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                  >
                    Reconnect
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400">
            <p className="font-semibold mb-2">Wallet Stream Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleReconnect}
              className="mt-3 px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* OHLCV Error Alert */}
        {ohlcvError && activeTab === 'ohlcv' && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400">
            <p className="font-semibold mb-2">OHLCV Stream Error</p>
            <p className="text-sm">{ohlcvError}</p>
            <p className="text-xs mt-2 text-slate-400">
              Note: OHLCV streaming may have limited availability. Contact support@covalenthq.com for Beta access.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Connecting to Goldrush Streaming API...</p>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {!isLoading && (
          <>
            {activeTab === 'wallet' ? (
              <>
                {/* Wallet Info Card */}
                <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 mb-6">
                  <p className="text-slate-400 text-sm mb-2">Monitoring Wallet</p>
                  <p className="text-white text-2xl font-mono font-semibold break-all">{walletAddress}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Total Anomalies</p>
                    <p className="text-3xl font-bold text-red-400">{anomalies.length}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Transactions</p>
                    <p className="text-3xl font-bold text-blue-400">{transactions.length}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Tokens Tracked</p>
                    <p className="text-3xl font-bold text-green-400">{Object.keys(balances).length}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-400">{stats?.successRate || '0'}%</p>
                  </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2">
                    <AnomalyAlert anomalies={anomalies} />
                  </div>
                  <div>
                    <TokenBalances balances={balances} />
                  </div>
                </div>

                {/* Transactions Table */}
                <TransactionTable transactions={transactions} />
              </>
            ) : (
              <>
                {/* OHLCV Monitor Tab */}
                <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm mb-2">Monitoring Token</p>
                      <p className="text-white text-xl font-mono font-semibold break-all">{tokenAddress}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${
                      ohlcvConnected
                        ? 'bg-green-900/20 border-green-700/50 text-green-400'
                        : 'bg-red-900/20 border-red-700/50 text-red-400'
                    }`}>
                      {ohlcvConnected ? (
                        <>
                          <Wifi className="w-4 h-4 inline mr-2 animate-pulse" />
                          <span className="text-sm font-semibold">Streaming</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 inline mr-2" />
                          <span className="text-sm font-semibold">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Token Selector */}
                  {candles.length === 0 && (
                    <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4">
                      <p className="text-blue-400 text-xs font-semibold mb-2">💡 Try Popular Tokens:</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setTokenAddress('So11111111111111111111111111111111111111112')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Wrapped SOL
                        </button>
                        <button
                          onClick={() => setTokenAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
                        >
                          USDC
                        </button>
                        <button
                          onClick={() => setTokenAddress('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
                        >
                          JUP
                        </button>
                        <button
                          onClick={() => setTokenAddress('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
                        >
                          mSOL
                        </button>
                      </div>
                      <p className="text-slate-500 text-xs mt-2">
                        Click a token to switch, or use Settings to enter a custom address
                      </p>
                    </div>
                  )}
                </div>

                {/* OHLCV Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Candles</p>
                    <p className="text-3xl font-bold text-blue-400">{candles.length}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Anomalies</p>
                    <p className="text-3xl font-bold text-red-400">{ohlcvAnomalies.length}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Avg Price</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">
                      {ohlcvStats?.avgPrice || '0.000000'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Price Change</p>
                    <p className={`text-2xl font-bold font-mono ${
                      parseFloat(ohlcvStats?.priceChangePercent || 0) > 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {ohlcvStats?.priceChangePercent || '0.00'}%
                    </p>
                  </div>
                </div>

                {/* OHLCV Monitor Component */}
                <OHLCVMonitor 
                  candles={candles} 
                  anomalies={ohlcvAnomalies} 
                  stats={ohlcvStats}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;