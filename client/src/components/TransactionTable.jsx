import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

export default function TransactionTable({ transactions }) {
  const [expandedTx, setExpandedTx] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-900/30 text-green-400';
      case 'failed':
        return 'bg-red-900/30 text-red-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      default:
        return 'bg-slate-900/30 text-slate-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'send':
        return 'text-red-400';
      case 'receive':
        return 'text-green-400';
      case 'swap':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
        <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-sm font-semibold">
          {transactions.length} total
        </span>
      </div>

      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400 text-center">
              No transactions yet...<br />
              <span className="text-xs">Transactions will appear here in real-time</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div key={tx.id || index} className="border border-slate-700/50 rounded-lg overflow-hidden">
                <div
                  className="p-4 bg-slate-700/20 hover:bg-slate-700/40 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() =>
                    setExpandedTx(expandedTx === tx.id ? null : tx.id)
                  }
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                        expandedTx === tx.id ? 'rotate-180' : ''
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-semibold ${getTypeColor(tx.type)}`}>
                          {tx.type.toUpperCase()}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300 text-sm font-mono">
                          {formatHash(tx.hash)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTime(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {tx.token && (
                      <span className="text-slate-300 font-semibold">
                        {tx.amount ? (
                          <>
                            {tx.type === 'send' ? '-' : '+'}
                            {Math.abs(tx.amount).toFixed(4)} {tx.token}
                          </>
                        ) : (
                          tx.token
                        )}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>

                {expandedTx === tx.id && (
                  <div className="p-4 bg-slate-700/10 border-t border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                          Transaction Hash
                        </p>
                        <p className="text-slate-200 font-mono break-all text-xs">
                          {tx.hash}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                          Type
                        </p>
                        <p className={`capitalize font-semibold ${getTypeColor(tx.type)}`}>
                          {tx.type}
                        </p>
                      </div>
                      {tx.token && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                            Token
                          </p>
                          <p className="text-slate-200 font-semibold">{tx.token}</p>
                        </div>
                      )}
                      {tx.amount !== undefined && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                            Amount
                          </p>
                          <p className="text-slate-200 font-mono">
                            {Math.abs(tx.amount).toFixed(4)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <p
                          className={`capitalize font-semibold ${getStatusColor(tx.status)}`}
                        >
                          {tx.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
                          Time
                        </p>
                        <p className="text-slate-200">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {tx.hash && (
                      <a
                        href={`https://solscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-sm font-semibold transition-colors"
                      >
                        View on Solscan
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}