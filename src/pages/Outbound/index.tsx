import { useState } from 'react';
import { Truck, Scan, Package, AlertOctagon, Plus, Search, Check, X, MapPin, QrCode } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS, GRADE_LABELS, GrainVariety } from '@/types';
import { formatDateTime, formatNumber } from '@/utils/helpers';

export default function Outbound() {
  const { outboundTasks, grainBatches, warehouses, createOutboundTask, quarantineBatch } = useGrainStore();
  const [showCreate, setShowCreate] = useState(false);
  const [variety, setVariety] = useState<GrainVariety>('wheat');
  const [quantity, setQuantity] = useState(500);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ match: boolean; message: string } | null>(null);

  const handleCreateTask = () => {
    createOutboundTask(variety, quantity);
    setShowCreate(false);
  };

  const handleScan = (taskId: string) => {
    const task = outboundTasks.find(t => t.id === taskId);
    if (!task) return;
    const firstItem = task.items[0];
    const batch = grainBatches.find(b => b.id === firstItem.batchId);
    if (batch && batch.grade === firstItem.grade) {
      setScanResult({ match: true, message: `核验通过: ${VARIETY_LABELS[batch.variety]} ${GRADE_LABELS[batch.grade]},与入库记录一致` });
    } else {
      setScanResult({ match: false, message: `核验失败: 等级不匹配，入库登记为${GRADE_LABELS[firstItem.grade]}，实际检测不符` });
      if (batch) quarantineBatch(batch.id, '出库扫码核验等级不匹配');
    }
    setSelectedTask(taskId);
  };

  const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: '待拣货', class: 'bg-gray-500/20 text-gray-400' },
    picking: { label: '拣货中', class: 'bg-wheat/20 text-wheat' },
    verifying: { label: '核验中', class: 'bg-primary-500/20 text-primary-300' },
    completed: { label: '已完成', class: 'bg-temp-normal/20 text-temp-normal' },
    exception: { label: '异常', class: 'bg-temp-danger/20 text-temp-danger' },
  };

  return (
    <div className="min-h-screen">
      <Header title="出库管理" subtitle="先进先出原则 · 扫码核验 · 异常批次自动隔离追溯" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9 w-64" placeholder="搜索出库单号..." />
          </div>
          <button className="btn-wheat" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            创建出库任务
          </button>
        </div>

        {showCreate && (
          <div className="card">
            <h3 className="font-display font-semibold text-lg mb-5">创建出库任务 - 先进先出原则</h3>
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label className="label">出库品种</label>
                <select className="input" value={variety} onChange={e => setVariety(e.target.value as GrainVariety)}>
                  {Object.entries(VARIETY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">出库数量 (吨)</label>
                <input type="number" className="input" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
            </div>
            <div className="p-4 bg-bg-light/50 rounded-lg border border-border-light/30 mb-5">
              <p className="text-sm text-gray-400 mb-2">💡 系统将自动按入库时间从早到晚匹配批次 (FIFO原则)</p>
              <p className="text-sm text-gray-300">预计匹配 {VARIETY_LABELS[variety]} 批次 {Math.ceil(quantity / 1000)} 个</p>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-outline" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-wheat" onClick={handleCreateTask}>确认创建</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {outboundTasks.map(task => (
            <div key={task.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-wheat/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-wheat" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-semibold text-lg">{task.code}</h4>
                        <span className={`badge ${statusConfig[task.status].class}`}>{statusConfig[task.status].label}</span>
                      </div>
                      <p className="text-xs text-gray-500">创建时间: {formatDateTime(task.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(task.status === 'picking' || task.status === 'verifying') && (
                    <button className="btn-outline" onClick={() => { handleScan(task.id); }}>
                      <Scan className="w-4 h-4" />
                      扫码核验
                    </button>
                  )}
                </div>
              </div>

              {task.exceptionReason && (
                <div className="p-4 mb-4 rounded-lg bg-temp-danger/10 border border-temp-danger/30 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-temp-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-temp-danger">异常处理</p>
                    <p className="text-sm text-gray-300 mt-1">{task.exceptionReason}</p>
                    <p className="text-xs text-temp-warm mt-2">相关批次已自动隔离，已生成追溯工单至产地</p>
                  </div>
                </div>
              )}

              {selectedTask === task.id && scanResult && (
                <div className={`p-4 mb-4 rounded-lg flex items-start gap-3 border ${
                  scanResult.match ? 'bg-temp-normal/10 border-temp-normal/30' : 'bg-temp-danger/10 border-temp-danger/30'
                }`}>
                  {scanResult.match ? <Check className="w-5 h-5 text-temp-normal flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-temp-danger flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${scanResult.match ? 'text-temp-normal' : 'text-temp-danger'}`}>
                      {scanResult.match ? '核验通过' : '核验不通过'}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">{scanResult.message}</p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead className="bg-bg-dark">
                    <tr>
                      <th className="table-th text-xs">批次号</th>
                      <th className="table-th text-xs">品种/等级</th>
                      <th className="table-th text-xs">产地</th>
                      <th className="table-th text-xs">数量</th>
                      <th className="table-th text-xs">存放位置</th>
                      <th className="table-th text-xs">电子标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {task.items.map((item, idx) => {
                      const batch = grainBatches.find(b => b.id === item.batchId);
                      return (
                        <tr key={idx} className="hover:bg-bg-light/20">
                          <td className="table-td font-mono text-wheat text-sm">{item.batchId}</td>
                          <td className="table-td text-sm">
                            <span className="mr-2">{VARIETY_LABELS[item.variety]}</span>
                            <span className="badge bg-primary-500/20 text-primary-300 text-xs">{GRADE_LABELS[item.grade]}</span>
                          </td>
                          <td className="table-td text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" />{item.origin}</td>
                          <td className="table-td text-sm font-mono">{formatNumber(item.quantity)}t</td>
                          <td className="table-td text-sm">
                            {warehouses.find(w => w.id === item.warehouseId)?.name} · {item.position}
                          </td>
                          <td className="table-td text-sm">
                            <span className="inline-flex items-center gap-1 text-wheat">
                              <QrCode className="w-3.5 h-3.5" />
                              {batch?.eTagId || '--'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
