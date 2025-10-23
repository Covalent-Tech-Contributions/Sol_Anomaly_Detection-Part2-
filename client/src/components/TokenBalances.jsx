import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TokenBalances({ balances }) {
  const sortedBalances = Object.entries(balances)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 10);

  const getTrendIcon = (balance) => {
    if (balance > 0) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (balance < 0) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return null;
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-400';
    if (balance < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Token Balances</h2>
        <span className="px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 text-sm font-semibold">
          {sortedBalances.length} tokens
        </span>
      </div>

      <div className="space-y-2">
        {sortedBalances.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400 text-center">
              Waiting for wallet data...<br />
              <span className="text-xs">Real-time balances will appear here</span>
            </p>
          </div>
        ) : (
          sortedBalances.map(([token, balance]) => (
            <div
              key={token}
              className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {token.charAt(0)}
                </div>
                <span className="text-white font-mono font-semibold">{token}</span>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(balance)}
                <span className={`font-mono font-semibold ${getBalanceColor(balance)}`}>
                  {balance >= 0 ? '+' : ''}{balance.toFixed(4)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}