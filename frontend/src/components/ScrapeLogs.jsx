import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const ScrapeLogs = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Clock className="w-8 h-8 text-slate-500 mb-3" />
        <p className="text-slate-400">No scrape logs found yet.</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'retried':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'failed':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'retried':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col max-h-[600px]">
      <div className="px-5 py-4 border-b border-glass-border/50 bg-dark-800/50 shrink-0">
        <h3 className="text-lg font-medium text-white">Activity Logs</h3>
        <p className="mt-1 text-sm text-slate-400">Recent automated and manual checks.</p>
      </div>
      
      <div className="overflow-y-auto flex-grow custom-scrollbar">
        <table className="min-w-full divide-y divide-glass-border/50">
          <thead className="bg-dark-900/50 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border/30">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-300">
                  <div className="flex flex-col">
                    <span>{new Date(log.attempt_timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs text-slate-500">{new Date(log.attempt_timestamp).toLocaleTimeString()}</span>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)}
                    <span className="ml-1.5 capitalize">{log.status}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-400 max-w-[200px] truncate group-hover:text-slate-300 transition-colors" title={log.error_message}>
                  {log.error_message || <span className="text-emerald-500/70">Completed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScrapeLogs;
