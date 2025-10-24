import React from 'react';
import { AlertCircle, TrendingDown, AlertTriangle, Info } from 'lucide-react';
//
export default function AnomalyAlert({ anomalies }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-400';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 flex-shrink-0" />;
      default:
        return <TrendingDown className="w-5 h-5 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Detected Anomalies</h2>
        <span className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-sm font-semibold">
          {anomalies.length} alerts
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {anomalies.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400 text-center">
              ✓ No anomalies detected.<br />
              <span className="text-xs">System operating normally.</span>
            </p>
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`p-4 rounded-lg border flex gap-3 transition-all ${getSeverityColor(
                anomaly.severity
              )}`}
            >
              {getSeverityIcon(anomaly.severity)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{anomaly.title}</p>
                <p className="text-xs opacity-80 break-words">{anomaly.message}</p>
                <p className="text-xs opacity-60 mt-1">
                  {anomaly.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}