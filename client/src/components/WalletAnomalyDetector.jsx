import React, { useState } from 'react';
import { useGoldrushStreaming } from '../hooks/useGoldrushStreaming';
import AnomalyAlert from './AnomalyAlert';
import TransactionTable from './TransactionTable';
import TokenBalances from './TokenBalances';
import { Wifi, WifiOff } from 'lucide-react';
//
export default function WalletAnomalyDetector() {
  const walletAddress = process.env.REACT_APP_SOLANA_WALLET_ADDRESS || 'YOUR_WALLET';
  const { isConnected, transactions, balances, error } = useGoldrushStreaming(walletAddress);
  const [anomalies, setAnomalies] = useState([]);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Solana Anomaly Detector</h1>
          <div className={`flex items-center gap-2 px-4 py-2 rounded ${
            isConnected ? 'bg-green-900/30' : 'bg-red-900/30'
          }`}>
            {isConnected ? (
              <><Wifi className="text-green-400" /><span className="text-green-400">Connected</span></>
            ) : (
              <><WifiOff className="text-red-400" /><span className="text-red-400">Disconnected</span></>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnomalyAlert anomalies={anomalies} />
          <TokenBalances balances={balances} />
        </div>

        {/* Transactions */}
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}