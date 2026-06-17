export const getTempColor = (temp: number): string => {
  if (temp < 15) return '#3B82F6';
  if (temp < 20) return '#22C55E';
  if (temp < 25) return '#EAB308';
  if (temp < 28) return '#F97316';
  return '#EF4444';
};

export const getTempBgClass = (temp: number): string => {
  if (temp < 15) return 'bg-temp-cool';
  if (temp < 20) return 'bg-temp-normal';
  if (temp < 25) return 'bg-temp-warm';
  if (temp < 28) return 'bg-temp-hot';
  return 'bg-temp-danger';
};

export const getAlertLevelColor = (level: string): string => {
  switch (level) {
    case 'critical': return '#EF4444';
    case 'danger': return '#F97316';
    case 'warning': return '#EAB308';
    default: return '#3B82F6';
  }
};

export const getAlertLevelLabel = (level: string): string => {
  switch (level) {
    case 'critical': return '严重';
    case 'danger': return '危险';
    case 'warning': return '警告';
    default: return '提示';
  }
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

export const getTimeRemaining = (deadline: string): { text: string; urgent: boolean } => {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: '已超时', urgent: true };
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours < 2) return { text: `${hours}小时${mins}分`, urgent: true };
  return { text: `${hours}小时${mins}分`, urgent: false };
};

export const formatRelativeFuture = (iso: string): string => {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return '已到期';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟后`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时后`;
  const days = Math.floor(hours / 24);
  return `${days}天后`;
};

export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

export const formatCurrency = (n: number): string => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(n);
};

export const formatNumber = (n: number): string => {
  return new Intl.NumberFormat('zh-CN').format(n);
};
