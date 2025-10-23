import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { formatPrice, formatVolume } from '../services/dataProcessing';

export default function OHLCVMonitor({ candles, anomalies, stats }) {
  const [currentCandle, setCurrentCandle] = useState(null);
  const [streamStatus, setStreamStatus] = useState({
    isActive: true,
    dataCount: candles.length,
    lastUpdate: null
  });

  useEffect(() => {
    if (candles.length > 0) {
      setCurrentCandle(candles[candles.length - 1]);
      setStreamStatus(prev => ({
        ...prev,
        dataCount: candles.length,
        lastUpdate: new Date()
      }));
    }
  }, [candles]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900/30 border-red-700 text-red-400';
      case 'HIGH':
        return 'bg-orange-900/30 border-orange-700 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
      default:
        return 'bg-blue-900/30 border-blue-700 text-blue-400';
    }
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Stream Status */}
      <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">OHLCV Stream Status</h3>
            <p className="text-slate-400 text-sm">Real-time token price monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full ${streamStatus.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'} text-sm font-semibold`}>
              {streamStatus.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-slate-400 text-xs mb-1">Candles Received</p>
            <p className="text-white text-2xl font-bold">{streamStatus.dataCount}</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-slate-400 text-xs mb-1">Anomalies</p>
            <p className="text-red-400 text-2xl font-bold">{anomalies.length}</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-slate-400 text-xs mb-1">Last Update</p>
            <p className="text-white text-sm font-mono">
              {streamStatus.lastUpdate ? streamStatus.lastUpdate.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Candle */}
      {currentCandle ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentCandle.baseToken?.symbol || 'Token'} Price Data
              </h3>
              <p className="text-slate-400 text-sm">
                {new Date(currentCandle.timestamp).toLocaleString()}
              </p>
            </div>
            {currentCandle.baseToken && (
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">Token</p>
                <p className="text-white font-mono text-sm">
                  {currentCandle.baseToken.address.substring(0, 10)}...
                </p>
              </div>
            )}
          </div>

          {/* OHLCV Data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <p className="text-blue-400 text-xs font-semibold">OPEN</p>
              </div>
              <p className="text-white text-lg font-mono">{formatPrice(currentCandle.open)}</p>
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-xs font-semibold">HIGH</p>
              </div>
              <p className="text-white text-lg font-mono">{formatPrice(currentCandle.high)}</p>
            </div>

            <div className="bg-red-900/20 border border-red-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-xs font-semibold">LOW</p>
              </div>
              <p className="text-white text-lg font-mono">{formatPrice(currentCandle.low)}</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-400 text-xs font-semibold">CLOSE</p>
              </div>
              <p className="text-white text-lg font-mono">{formatPrice(currentCandle.close)}</p>
            </div>
          </div>

          {/* Volume Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-900/20 border border-purple-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <p className="text-purple-400 text-xs font-semibold">VOLUME</p>
              </div>
              <p className="text-white text-lg font-mono">{formatVolume(currentCandle.volume)}</p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <p className="text-cyan-400 text-xs font-semibold">VOLUME USD</p>
              </div>
              <p className="text-white text-lg font-mono">
                ${(currentCandle.volumeUsd || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Token Info */}
          {currentCandle.baseToken && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded">
              <p className="text-slate-400 text-xs mb-2">TOKEN INFORMATION</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Name: </span>
                  <span className="text-white font-semibold">{currentCandle.baseToken.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Symbol: </span>
                  <span className="text-white font-semibold">{currentCandle.baseToken.symbol}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Decimals: </span>
                  <span className="text-white font-semibold">{currentCandle.baseToken.decimals}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12">
          <div className="text-center">
            <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
            <p className="text-white text-lg font-bold mb-2">🔄 Waiting for OHLCV data...</p>
            <p className="text-slate-400 text-sm mb-4">
              The stream is connected and monitoring for trading activity
            </p>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-400 text-xs font-semibold mb-2">📡 Stream Status</p>
              <div className="text-left text-xs space-y-1">
                <p className="text-slate-300">
                  • Connection: <span className="text-green-400 font-semibold">Active ✓</span>
                </p>
                <p className="text-slate-300">
                  • Updates Received: <span className="text-yellow-400 font-semibold">{streamStatus.dataCount}</span>
                </p>
                <p className="text-slate-300">
                  • Waiting for: <span className="text-purple-400 font-semibold">Trading Activity</span>
                </p>
              </div>
            </div>
            <div className="mt-6 text-xs text-slate-500 space-y-1">
              <p>💡 This is normal - OHLCV data appears when trades occur</p>
              <p>⏰ Data typically arrives within 1-5 minutes for active tokens</p>
              <p>🔧 Try a different token or check console for logs</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && stats.totalCandles > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-xs mb-1">Avg Price</p>
              <p className="text-white font-mono text-sm">{stats.avgPrice}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Max Price</p>
              <p className="text-green-400 font-mono text-sm">{stats.maxPrice}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Min Price</p>
              <p className="text-red-400 font-mono text-sm">{stats.minPrice}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Price Change</p>
              <p className={`font-mono text-sm ${getPriceChangeColor(parseFloat(stats.priceChangePercent))}`}>
                {stats.priceChangePercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-slate-800/50 border border-red-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">⚠️ Anomalies Detected</h3>
            <span className="ml-auto px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-sm font-semibold">
              {anomalies.length} alerts
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-sm">[{anomaly.severity}] {anomaly.type}</p>
                  <span className="text-xs opacity-75">{anomaly.value}</span>
                </div>
                <p className="text-xs opacity-90">{anomaly.details}</p>
                <p className="text-xs opacity-60 mt-1">
                  {anomaly.timestamp?.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          {anomalies.length > 5 && (
            <p className="text-center text-slate-400 text-sm mt-3">
              +{anomalies.length - 5} more anomalies
            </p>
          )}
        </div>
      )}

      {/* Candle History */}
      {candles.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Candle History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {candles.slice().reverse().slice(0, 20).map((candle, idx) => (
              <div
                key={candle.id || idx}
                className="p-3 bg-slate-700/20 hover:bg-slate-700/40 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs mb-1">
                      {new Date(candle.timestamp).toLocaleString()}
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">O:</span>
                        <span className="text-white ml-1">{formatPrice(candle.open)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">H:</span>
                        <span className="text-green-400 ml-1">{formatPrice(candle.high)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">L:</span>
                        <span className="text-red-400 ml-1">{formatPrice(candle.low)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">C:</span>
                        <span className="text-white ml-1">{formatPrice(candle.close)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Vol</p>
                    <p className="text-purple-400 text-xs font-mono">
                      {formatVolume(candle.volume)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {candles.length > 20 && (
            <p className="text-center text-slate-400 text-sm mt-3">
              Showing 20 of {candles.length} candles
            </p>
          )}
        </div>
      )}
    </div>
  );
}

