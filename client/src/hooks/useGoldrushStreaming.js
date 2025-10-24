import { useEffect, useState, useRef } from 'react';
import {
  initializeGoldrushClient,
  getGoldrushClient,
  disconnectGoldrushClient,
} from '../services/goldrushClient';
import { StreamingChain, StreamingInterval, StreamingTimeframe } from '@covalenthq/client-sdk';
import { processOHLCVCandle, calculateOHLCVStatistics } from '../services/dataProcessing';
import { detectOHLCVAnomalies } from '../services/anomalyDetection';
//
export const useGoldrushStreaming = (walletAddress) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef({});

  useEffect(() => {
    const setupStreaming = async () => {
      try {
        initializeGoldrushClient();
        const client = getGoldrushClient();
        setIsConnected(true);

        // Subscribe to wallet activity
        unsubscribeRef.current.wallet = client.StreamingService.subscribeToWalletActivity(
          {
            chain_name: StreamingChain.SOLANA_MAINNET,
            wallet_addresses: [walletAddress],
          },
          {
            next: (data) => {
              setTransactions(prev => [
                {
                  id: Math.random(),
                  hash: data.tx_hash,
                  type: data.tx_type,
                  timestamp: new Date(data.timestamp),
                  ...data
                },
                ...prev.slice(0, 99)
              ]);
            },
            error: (err) => {
              console.error('Streaming error:', err);
              setError(err.message);
            }
          }
        );
      } catch (err) {
        console.error('Setup error:', err);
        setError(err.message);
        setIsConnected(false);
      }
    };

    setupStreaming();

    return () => {
      Object.values(unsubscribeRef.current).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      disconnectGoldrushClient();
    };
  }, [walletAddress]);

  return { isConnected, transactions, balances, error };
};

/**
 * Hook for OHLCV token streaming
 */
export const useOHLCVStreaming = (tokenAddress, options = {}) => {
  const {
    interval = StreamingInterval.ONE_MINUTE,
    timeframe = StreamingTimeframe.ONE_HOUR,
    maxHistory = 50
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [candles, setCandles] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [streamInfo, setStreamInfo] = useState({
    startTime: null,
    dataCount: 0,
    lastUpdate: null
  });

  const unsubscribeRef = useRef(null);
  const candleHistoryRef = useRef([]);

  useEffect(() => {
    if (!tokenAddress) return;

    const setupOHLCVStream = async () => {
      try {
        initializeGoldrushClient();
        const client = getGoldrushClient();
        setIsConnected(true);
        
        setStreamInfo(prev => ({
          ...prev,
          startTime: new Date()
        }));

        console.log('📡 Subscribing to OHLCV stream for token:', tokenAddress);

        // Subscribe to OHLCV token data
        unsubscribeRef.current = client.StreamingService.subscribeToOHLCVTokens(
          {
            chain_name: StreamingChain.SOLANA_MAINNET,
            token_addresses: [tokenAddress],
            interval: interval,
            timeframe: timeframe,
          },
          {
            next: (data) => {
              console.log('✓ OHLCV Data received:', data);
              console.log('📊 Data type:', typeof data, 'Is Array:', Array.isArray(data), 'Length:', data?.length);

              // Process the candle data
              const processedCandles = processOHLCVCandle(data);
              
              if (!processedCandles || processedCandles.length === 0) {
                console.warn('⚠️ No candles in this update - waiting for trading activity...');
                console.log('💡 This is normal if the token has no recent trades. The stream is active and monitoring.');
                
                // Update stream info even if no candles
                setStreamInfo(prev => ({
                  ...prev,
                  dataCount: prev.dataCount + 1,
                  lastUpdate: new Date()
                }));
                return;
              }

              // Process each candle
              processedCandles.forEach((candle) => {
                // Add to history
                candleHistoryRef.current = [...candleHistoryRef.current, candle].slice(-maxHistory);

                // Update state
                setCandles(candleHistoryRef.current);

                // Detect anomalies
                const history = candleHistoryRef.current.slice(0, -1); // All except current
                const detectedAnomalies = detectOHLCVAnomalies(candle, history);

                if (detectedAnomalies.length > 0) {
                  console.log('⚠️ Anomalies detected:', detectedAnomalies);
                  setAnomalies(prev => [...detectedAnomalies, ...prev].slice(0, 50));
                }

                // Update stream info
                setStreamInfo(prev => ({
                  ...prev,
                  dataCount: prev.dataCount + 1,
                  lastUpdate: new Date()
                }));
              });

              // Calculate statistics
              const newStats = calculateOHLCVStatistics(candleHistoryRef.current);
              setStats(newStats);
            },
            error: (err) => {
              console.error('✗ OHLCV subscription error:', err);
              setError(err.message || 'Streaming error occurred');
            },
            complete: () => {
              console.log('✓ OHLCV stream completed');
              setIsConnected(false);
            }
          }
        );

        console.log('✓ OHLCV stream setup complete');
      } catch (err) {
        console.error('✗ Failed to setup OHLCV stream:', err);
        setError(err.message);
        setIsConnected(false);
      }
    };

    setupOHLCVStream();

    return () => {
      if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
        console.log('🛑 Unsubscribing from OHLCV stream');
        unsubscribeRef.current();
      }
    };
  }, [tokenAddress, interval, timeframe, maxHistory]);

  return { 
    isConnected, 
    candles, 
    anomalies, 
    stats, 
    error, 
    streamInfo 
  };
};