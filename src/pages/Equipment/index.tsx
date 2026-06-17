import { useState } from 'react';
import { Wrench, Factory, Fan, ArrowUpDown, Calendar, Clock, AlertCircle, CheckCircle, Timer, UserPlus, Plus, Search, MapPin } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { formatDateTime, formatRelativeTime, getTimeRemaining } from '@/utils/helpers';

const equipmentIcons: Record<string, any> = {
  conveyor: Factory, dryer: Wrench, ventilator: Fan, elevator: ArrowUpDown,
};
const equipmentLabels: Record<string, string> = {
  conveyor: '输送机', dryer: '烘干机', ventilator: '通风机', elevator: '提升机',
};

export default function Equipment() {
  const { equipment, maintenanceOrders, addMaintenanceOrder, completeOrder, escalateOrder } = useGrainStore();
  const [showRepairModal, setShowRepairModal] = useState<string | null>(null);
  const [repairDesc, setRepairDesc] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filteredOrders = maintenanceOrders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'pending') return o.status === 'pending' || o.status === 'escalated';
    return o.status === filter;
  });

  const handleReportRepair = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) return;
    addMaintenanceOrder({
      equipmentId,
      type: 'repair',
      title: `${eq.name}故障报修`,
      description: repairDesc || '扫码发现异常，需维修',
      status: 'pending',
      deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    });
    setShowRepairModal(null);
    setRepairDesc('');
  };

  const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
    pending: { label: '待接单', class: 'bg-temp-warm/20 text-temp-warm', icon: Clock },
    accepted: { label: '已接单', class: 'bg-primary-500/20 text-primary-300', icon: UserPlus },
    processing: { label: '处理中', class: 'bg-wheat/20 text-wheat', icon: Wrench },
    completed: { label: '已完成', class: 'bg-temp-normal/20 text-temp-normal', icon: CheckCircle },
    escalated: { label: '已升级', class: 'bg-temp-danger/20 text-temp-danger', icon: AlertCircle },
  };

  return (
    <div className="min-h-screen">
      <Header title="设备管理" subtitle="输送机、烘干机等设备巡检与报修 · 超时自动升级" />
      <div className="p-6 space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-lg">设备总览</h3>
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-temp-normal" />正常 {equipment.filter(e => e.status === 'normal').length}</span>
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-temp-danger animate-pulse" />故障 {equipment.filter(e => e.status === 'fault').length}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {equipment.map(eq => {
              const Icon = equipmentIcons[eq.type];
              const nextMaintDays = Math.ceil((new Date(eq.nextMaintenance).getTime() - Date.now()) / 86400000);
              const needsMaint = nextMaintDays <= 0;
              return (
                <div key={eq.id} className={`p-4 rounded-xl border transition-colors ${
                  eq.status === 'fault' ? 'border-temp-danger/40 bg-temp-danger/5' :
                  needsMaint ? 'border-temp-warm/40 bg-temp-warm/5' :
                  'border-border bg-bg-dark'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                        eq.status === 'fault' ? 'bg-temp-danger/20' : needsMaint ? 'bg-temp-warm/20' : 'bg-wheat/10'
                      }`}>
                        <Icon className={`w-6 h-6 ${eq.status === 'fault' ? 'text-temp-danger' : needsMaint ? 'text-temp-warm' : 'text-wheat'}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{eq.name}</p>
                        <p className="text-xs text-gray-500">{eq.code} · {equipmentLabels[eq.type]}</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      eq.status === 'normal' ? 'bg-temp-normal/20 text-temp-normal' :
                      eq.status === 'fault' ? 'bg-temp-danger/20 text-temp-danger animate-pulse' :
                      'bg-temp-warm/20 text-temp-warm'
                    }`}>
                      {eq.status === 'normal' ? '正常' : eq.status === 'fault' ? '故障' : '维护中'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1.5 text-gray-400"><MapPin className="w-3.5 h-3.5" />{eq.location}</div>
                    <div className="flex items-center gap-1.5 text-gray-400"><Timer className="w-3.5 h-3.5" />运行 {eq.runHours}h</div>
                  </div>
                  <div className={`p-2.5 rounded-lg flex items-center justify-between ${needsMaint ? 'bg-temp-warm/10' : 'bg-bg'}`}>
                    <div>
                      <p className="text-xs text-gray-500">下次保养</p>
                      <p className={`text-sm font-medium ${needsMaint ? 'text-temp-warm' : ''}`}>
                        {needsMaint ? `已逾期 ${Math.abs(nextMaintDays)} 天` : `还有 ${nextMaintDays} 天`}
                      </p>
                    </div>
                    <button
                      className="btn-wheat text-xs py-1.5 px-3"
                      onClick={() => setShowRepairModal(eq.id)}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      扫码报修
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg">工单中心</h3>
            <div className="flex gap-2">
              {[
                { v: 'all', l: '全部' },
                { v: 'pending', l: '待处理' },
                { v: 'processing', l: '处理中' },
                { v: 'completed', l: '已完成' },
              ].map(t => (
                <button
                  key={t.v}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === t.v ? 'bg-wheat text-bg-dark font-medium' : 'bg-bg-dark text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setFilter(t.v)}
                >
                  {t.l}
                </button>
              ))}
              <button className="btn-outline text-sm ml-2">
                <Plus className="w-4 h-4" />
                新建巡检
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredOrders.map(order => {
              const eq = equipment.find(e => e.id === order.equipmentId);
              const cfg = statusConfig[order.status];
              const timeStatus = order.status === 'pending' || order.status === 'accepted' ? getTimeRemaining(order.deadline) : null;
              return (
                <div key={order.id} className={`p-5 hover:bg-bg-light/30 transition-colors ${order.escalated ? 'bg-temp-danger/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        order.escalated ? 'bg-temp-danger/20' : cfg.class.replace('text-', 'bg-').replace('/20', '/15')
                      }`}>
                        <cfg.icon className={`w-5 h-5 ${order.escalated ? 'text-temp-danger animate-pulse' : cfg.class.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{order.title}</span>
                          <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                          <span className="badge bg-bg-light text-gray-400 text-xs">
                            {order.type === 'inspection' ? '巡检工单' : '报修工单'}
                          </span>
                          {order.escalated && (
                            <span className="badge bg-temp-danger/20 text-temp-danger animate-pulse text-xs">
                              <AlertCircle className="w-3 h-3 mr-0.5" />超时自动升级
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{order.description}</p>
                        <div className="flex items-center gap-5 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{eq?.name} - {eq?.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />创建 {formatRelativeTime(order.createdAt)}</span>
                          {order.assignee && <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" />处理人: {order.assignee}</span>}
                          {timeStatus && (
                            <span className={`flex items-center gap-1 font-medium ${timeStatus.urgent ? 'text-temp-danger' : 'text-gray-400'}`}>
                              <Timer className="w-3 h-3" />剩余 {timeStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && !order.escalated && (
                        <button className="btn-outline text-sm py-1.5" onClick={() => escalateOrder(order.id)}>
                          升级主管
                        </button>
                      )}
                      {(order.status === 'processing' || order.status === 'accepted') && (
                        <button className="btn-wheat text-sm py-1.5" onClick={() => completeOrder(order.id)}>
                          完成工单
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showRepairModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowRepairModal(null)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[440px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-5 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-wheat" />
              设备报修
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-sm font-medium">{equipment.find(e => e.id === showRepairModal)?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{equipment.find(e => e.id === showRepairModal)?.location}</p>
              </div>
              <div>
                <label className="label">故障描述</label>
                <textarea className="input min-h-[100px] resize-none" placeholder="请描述故障现象..." value={repairDesc} onChange={e => setRepairDesc(e.target.value)} />
                <p className="text-xs text-gray-500 mt-2">⚠ 报修后超2小时未接单将自动升级设备主管</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
              <button className="btn-outline" onClick={() => setShowRepairModal(null)}>取消</button>
              <button className="btn-danger" onClick={() => handleReportRepair(showRepairModal)}>一键报修</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
