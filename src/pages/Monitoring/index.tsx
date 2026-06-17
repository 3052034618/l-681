import { useState } from 'react';
import { Thermometer, Bug, Droplets, AlertTriangle, Wind, FlaskConical, Check, Clock, User, MessageSquare, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { getTempColor, getAlertLevelColor, getAlertLevelLabel, formatDateTime, formatRelativeTime, formatRelativeFuture } from '@/utils/helpers';
import { FumigationPlan } from '@/types';

const sensorIcons = { temperature: Thermometer, pest: Bug, humidity: Droplets };
const sensorLabels = { temperature: '粮温', pest: '虫害', humidity: '湿度' };
const sensorUnits = { temperature: '℃', pest: '头/kg', humidity: '%' };

export default function Monitoring() {
  const { warehouses, alerts, fumigationPlans, resolveAlert, startVentilation, createFumigationFromAlert, approveFumigation, startFumigationExecution, completeFumigation } = useGrainStore();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedAlertType, setSelectedAlertType] = useState<string>('all');
  const [showFumigationModal, setShowFumigationModal] = useState<FumigationPlan | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [executingPlanId, setExecutingPlanId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (selectedWarehouse !== 'all' && a.warehouseId !== selectedWarehouse) return false;
    if (selectedAlertType !== 'all' && a.type !== selectedAlertType) return false;
    return true;
  });

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId, '王保管员');
  };

  return (
    <div className="min-h-screen">
      <Header title="实时监控中心" subtitle="传感器数据每5秒自动刷新 · 超标自动报警" />
      <div className="p-6 space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-lg">传感器实时数据</h3>
            <div className="flex gap-2">
              <select className="input w-40" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                <option value="all">全部仓廒</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {warehouses
              .filter(w => selectedWarehouse === 'all' || w.id === selectedWarehouse)
              .map(warehouse => (
                <div key={warehouse.id} className={`p-4 rounded-xl border transition-colors ${
                  warehouse.status === 'warning' ? 'border-temp-warm/40 bg-temp-warm/5' : 'border-border bg-bg-dark'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-semibold">{warehouse.name}</h4>
                    {warehouse.status === 'warning' && <span className="badge bg-temp-warm/20 text-temp-warm">异常</span>}
                  </div>
                  <div className="space-y-3">
                    {warehouse.sensors.map(sensor => {
                      const Icon = sensorIcons[sensor.type];
                      const isAlarm = sensor.status === 'alarm';
                      const isOffline = sensor.status === 'offline';
                      return (
                        <div key={sensor.id} className={`p-3 rounded-lg ${
                          isOffline ? 'bg-bg opacity-60' : isAlarm ? 'bg-temp-danger/10 border border-temp-danger/30' : 'bg-bg-light'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${isAlarm ? 'text-temp-danger animate-pulse' : isOffline ? 'text-gray-500' : 'text-wheat'}`} />
                              <span className="text-sm text-gray-300">{sensor.name}</span>
                            </div>
                            <span className={`w-2 h-2 rounded-full ${
                              isOffline ? 'bg-gray-500' : isAlarm ? 'bg-temp-danger animate-pulse' : 'bg-temp-normal'
                            }`} />
                          </div>
                          <div className="flex items-end justify-between">
                            <span className={`text-2xl font-mono font-bold ${
                              isAlarm ? 'text-temp-danger' : isOffline ? 'text-gray-500' : 'text-white'
                            }`} style={sensor.type === 'temperature' ? { color: getTempColor(sensor.value) } : {}}>
                              {isOffline ? '--' : sensor.value}
                              <span className="text-sm font-normal text-gray-500 ml-1">{sensorUnits[sensor.type]}</span>
                            </span>
                            <span className="text-xs text-gray-500">阈值: {sensor.threshold}{sensorUnits[sensor.type]}</span>
                          </div>
                          {isAlarm && <p className="text-xs text-temp-danger mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />超过阈值</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">报警中心</h3>
              <div className="flex gap-2">
                <select className="input w-32 text-sm py-1.5" value={selectedAlertType} onChange={e => setSelectedAlertType(e.target.value)}>
                  <option value="all">全部类型</option>
                  <option value="temperature">温度报警</option>
                  <option value="pest">虫害报警</option>
                  <option value="equipment">设备报警</option>
                </select>
              </div>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border transition-all ${
                  alert.status === 'resolved' ? 'border-border bg-bg-dark opacity-60' :
                  alert.level === 'critical' ? 'border-temp-danger/40 bg-temp-danger/5' :
                  alert.level === 'danger' ? 'border-temp-hot/40 bg-temp-hot/5' :
                  'border-border bg-bg-dark'
                }`}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5"
                      style={{ backgroundColor: getAlertLevelColor(alert.level), boxShadow: `0 0 10px ${getAlertLevelColor(alert.level)}` }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="badge text-xs" style={{ backgroundColor: `${getAlertLevelColor(alert.level)}20`, color: getAlertLevelColor(alert.level) }}>
                            {getAlertLevelLabel(alert.level)}
                          </span>
                          <span className="badge bg-bg-light text-gray-400 text-xs">
                            {sensorLabels[alert.type as keyof typeof sensorLabels]}
                          </span>
                          <span className="text-xs text-gray-500">{warehouses.find(w => w.id === alert.warehouseId)?.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatRelativeTime(alert.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-2">{alert.message}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className={`text-xs ${
                          alert.status === 'pending' ? 'text-temp-warm' :
                          alert.status === 'processing' ? 'text-wheat' :
                          'text-temp-normal'
                        }`}>
                          {alert.status === 'pending' ? '⏳ 待处理' : alert.status === 'processing' ? `👤 处理中 · ${alert.handler}` : '✓ 已解决'}
                        </span>
                        {alert.status !== 'resolved' && (
                          <div className="flex gap-2">
                            {alert.type === 'temperature' && alert.status === 'pending' && (
                              <button className="btn-outline text-xs py-1.5 px-3" onClick={() => startVentilation(alert.id)}>
                                <Wind className="w-3.5 h-3.5" />
                                启动通风
                              </button>
                            )}
                            {alert.type === 'pest' && alert.status === 'pending' && (
                              <button className="btn-outline text-xs py-1.5 px-3" onClick={() => createFumigationFromAlert(alert.id)}>
                                <FlaskConical className="w-3.5 h-3.5" />
                                提交熏蒸
                              </button>
                            )}
                            <button className="btn-wheat text-xs py-1.5 px-3" onClick={() => handleResolve(alert.id)}>
                              标记处理
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">熏蒸方案审批</h3>
              <button className="btn-wheat text-sm">
                <FlaskConical className="w-4 h-4" />
                新建熏蒸方案
              </button>
            </div>
            <div className="space-y-4">
              {fumigationPlans.map(plan => {
                const steps = [
                  { key: 'warehouseMinister', label: '仓储部长', role: '仓储部长' },
                  { key: 'qualityInspector', label: '质检员', role: '质检员' },
                ];
                return (
                  <div key={plan.id} className="p-4 rounded-xl bg-bg-dark border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FlaskConical className="w-4 h-4 text-wheat" />
                          <span className="font-semibold">{warehouses.find(w => w.id === plan.warehouseId)?.name} 熏蒸方案</span>
                        </div>
                        <p className="text-xs text-gray-500">提交人: {plan.createdBy} · {formatDateTime(plan.createdAt)}</p>
                      </div>
                      <span className={`badge ${
                        plan.status === 'approved' ? 'bg-temp-normal/20 text-temp-normal' :
                        plan.status === 'rejected' ? 'bg-temp-danger/20 text-temp-danger' :
                        plan.status === 'executing' ? 'bg-wheat/20 text-wheat' :
                        'bg-temp-warm/20 text-temp-warm'
                      }`}>
                        {plan.status === 'approved' ? '已批准' :
                          plan.status === 'rejected' ? '已驳回' :
                          plan.status === 'executing' ? '执行中' :
                          plan.status === 'completed' ? '已完成' : '待审批'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm mb-4 p-3 bg-bg rounded-lg">
                      <div><span className="text-gray-500 text-xs">药剂</span><p className="font-medium mt-0.5">{plan.agent}</p></div>
                      <div><span className="text-gray-500 text-xs">用量</span><p className="font-medium mt-0.5 font-mono">{plan.dosage} g/m³</p></div>
                      <div><span className="text-gray-500 text-xs">时长</span><p className="font-medium mt-0.5 font-mono">{plan.duration} h</p></div>
                      <div><span className="text-gray-500 text-xs">批次</span><p className="font-medium mt-0.5 font-mono">{plan.batchId}</p></div>
                    </div>
                    {(plan.startTime || plan.estimatedEndTime) && (
                      <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-bg-light/40 rounded-lg">
                        {plan.startTime && (
                          <div><span className="text-gray-500">开始时间</span><p className="font-medium mt-0.5">{formatDateTime(plan.startTime)}</p></div>
                        )}
                        {plan.estimatedEndTime && (
                          <div><span className="text-gray-500">预计结束</span><p className="font-medium mt-0.5">{formatDateTime(plan.estimatedEndTime)}</p></div>
                        )}
                        {plan.endTime && (
                          <div><span className="text-gray-500">完成时间</span><p className="font-medium mt-0.5 text-temp-normal">{formatDateTime(plan.endTime)}</p></div>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mb-4">原因: {plan.reason}</p>
                    <div className="flex items-center mb-4">
                      {steps.map((st, idx) => {
                        const appr = plan.approvals[st.key as keyof typeof plan.approvals];
                        const prevKey = idx === 0 ? null : steps[idx - 1].key;
                        const prevApproved = prevKey ? plan.approvals[prevKey as keyof typeof plan.approvals]?.approved : true;
                        let stepStatus: 'done' | 'reject' | 'current' | 'pending';
                        if (appr?.approved === true) {
                          stepStatus = 'done';
                        } else if (appr?.approved === false) {
                          stepStatus = 'reject';
                        } else if (prevApproved && plan.status !== 'rejected') {
                          stepStatus = 'current';
                        } else {
                          stepStatus = 'pending';
                        }
                        return (
                          <div key={st.key} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <button
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  stepStatus === 'done' ? 'bg-temp-normal text-white' :
                                  stepStatus === 'reject' ? 'bg-temp-danger text-white' :
                                  stepStatus === 'current' ? 'bg-wheat text-bg-dark hover:bg-wheat-600' :
                                  'bg-bg-light text-gray-500 border border-border'
                                }`}
                                onClick={() => stepStatus === 'current' && setShowFumigationModal(plan)}
                              >
                                {stepStatus === 'done' ? <Check className="w-5 h-5" /> : stepStatus === 'reject' ? <X className="w-5 h-5" /> : idx + 1}
                              </button>
                              <span className={`text-xs mt-1.5 ${
                                stepStatus === 'current' ? 'text-wheat' :
                                stepStatus === 'done' ? 'text-temp-normal' :
                                stepStatus === 'reject' ? 'text-temp-danger' :
                                'text-gray-500'
                              }`}>{st.label}</span>
                              {appr?.comment && <span className="text-xs text-gray-500 mt-1 italic max-w-[80px] truncate">"{appr.comment}"</span>}
                            </div>
                            {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${stepStatus === 'done' ? 'bg-temp-normal' : stepStatus === 'reject' ? 'bg-temp-danger' : 'bg-border'}`} />}
                          </div>
                        );
                      })}
                    </div>
                    {plan.status === 'approved' && (
                      <div className="flex justify-end">
                        <button className="btn-wheat text-sm" onClick={() => {
                          setExecutingPlanId(plan.id);
                          startFumigationExecution(plan.id);
                          setTimeout(() => setExecutingPlanId(null), 1000);
                        }}>
                          <FlaskConical className="w-4 h-4" />
                          {executingPlanId === plan.id ? '启动中...' : '启动熏蒸执行'}
                        </button>
                      </div>
                    )}
                    {plan.status === 'executing' && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-wheat flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          熏蒸执行中 {plan.estimatedEndTime ? `· 预计 ${formatRelativeFuture(plan.estimatedEndTime)} 结束` : ''}
                        </span>
                        <button className="btn-outline text-sm" onClick={() => {
                          setExecutingPlanId(plan.id);
                          completeFumigation(plan.id);
                          setTimeout(() => setExecutingPlanId(null), 1000);
                        }}>
                          <Check className="w-4 h-4" />
                          {executingPlanId === plan.id ? '处理中...' : '完成熏蒸'}
                        </button>
                      </div>
                    )}
                    {plan.status === 'completed' && (
                      <div className="flex justify-end">
                        <span className="text-xs text-temp-normal flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          熏蒸已完成，相关虫害报警已解除
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showFumigationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setShowFumigationModal(null); setApprovalComment(''); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-[480px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-5">审批熏蒸方案</h3>
            <div className="space-y-4">
              <div className="p-4 bg-bg rounded-lg">
                <p className="text-sm text-gray-400 mb-2">方案详情</p>
                <p className="font-medium">{warehouses.find(w => w.id === showFumigationModal.warehouseId)?.name}</p>
                <p className="text-sm text-gray-400 mt-1">{showFumigationModal.agent} · {showFumigationModal.dosage}g/m³ · {showFumigationModal.duration}h</p>
              </div>
              <div>
                <label className="label"><MessageSquare className="w-4 h-4 inline mr-1.5" />审批意见</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="请输入审批意见..." value={approvalComment} onChange={e => setApprovalComment(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
              <button className="btn-outline" onClick={() => { setShowFumigationModal(null); setApprovalComment(''); }}>取消</button>
              <button className="btn-danger" onClick={() => {
                const currentRole = showFumigationModal.approvals.warehouseMinister ? 'qualityInspector' : 'warehouseMinister';
                approveFumigation(showFumigationModal.id, currentRole, approvalComment || '驳回，需重新评估', false);
                setShowFumigationModal(null);
                setApprovalComment('');
              }}>驳回</button>
              <button className="btn-wheat" onClick={() => {
                const currentRole = showFumigationModal.approvals.warehouseMinister ? 'qualityInspector' : 'warehouseMinister';
                approveFumigation(showFumigationModal.id, currentRole, approvalComment || '同意执行', true);
                setShowFumigationModal(null);
                setApprovalComment('');
              }}>批准</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
