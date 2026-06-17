import { Bell, Download, RefreshCw, Search } from 'lucide-react';
import { useGrainStore } from '@/store/grainStore';
import { formatDateTime } from '@/utils/helpers';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showExport?: boolean;
}

export default function Header({ title, subtitle, showExport = false }: HeaderProps) {
  const { currentTime, alerts } = useGrainStore();
  const pendingAlerts = alerts.filter((a) => a.status === 'pending' || a.status === 'processing').length;

  return (
    <header className="bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-display font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-64" placeholder="搜索批次号、仓廒..." />
        </div>
        {showExport && (
          <button className="btn-outline text-sm">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        )}
        <button className="relative w-10 h-10 rounded-lg bg-bg-dark border border-border flex items-center justify-center hover:bg-bg-light transition-colors">
          <Bell className="w-5 h-5" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
              {pendingAlerts}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-dark border border-border">
          <RefreshCw className="w-4 h-4 text-wheat animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-sm font-mono text-gray-300">{formatDateTime(currentTime.toISOString())}</span>
        </div>
      </div>
    </header>
  );
}
