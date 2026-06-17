import { useState } from 'react';
import { Truck, Scan, Package, AlertOctagon, Plus, Search, Check, X, MapPin, QrCode, Droplets, Bug, Sparkles, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS, GRADE_LABELS, GrainVariety, QualityCheckResult } from '@/types';
import { formatDateTime, formatNumber } from '@/utils/helpers';

export default function Outbound() {
  const { outboundTasks, grainBatches, warehouses, createOutboundTask, quarantineBatch, advanceOutboundTask } = useGrainStore();
  const [showCreate, setShowCreate] = useState(false);
  const [variety, setVariety] = useState<GrainVariety>('wheat');
  const [quantity, setQuantity] = useState(500);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ match: boolean; message: string; detail?: string } | null>(null);
  const [showQualityModal, setShowQualityModal] = useState<{ taskId: string; batchId: string } | null>(null);
  const [qualityResult, setQualityResult] = useState<QualityCheckResult | null>(null);
  const [qualityChecking, setQualityChecking] = useState(false);

  const handleCreateTask = () => {
    const task = createOutboundTask(variety, quantity);
    setShowCreate(false);
  };

  const simulateQualityCheck = (batchId: string): QualityCheckResult => {
    const batch = grainBatches.find(b => b.id === batchId);
    if (!batch) {
      return {
        grade: { passed: false, expected: '一等', detected: '一等' },
        moisture: { passed: true, expected: 13, detected: 13, threshold: 14.5 },
        pest: { passed: true, detected: 0, threshold: 5 },
        impurity: { passed: true, detected: 0.5, threshold: 1.0 },
        overallPassed: false,
        failedItem: '未找到批次信息',
      };
    }

    const hasFailure = Math.random() < 0.35;
    const failItems = ['grade', 'moisture', 'pest', 'impurity'];
    const failIndex = hasFailure ? Math.floor(Math.random() * 4) : -1;

    const expectedGrade = GRADE_LABELS[batch.grade];
    const detectedGrade = failIndex === 0
      ? (batch.grade === 'grade1' ? GRADE_LABELS.grade2 : GRADE_LABELS.grade1)
      : expectedGrade;
    const gradePassed = failIndex !== 0;

    const detectedMoisture = failIndex === 1
      ? 15.2 + Math.random() * 2
      : Math.max(11, Math.min(14, batch.moisture + (Math.random() - 0.5)));

    const detectedPest = failIndex === 2
      ? 6 + Math.random() * 4
      : Math.max(0, Math.min(3, batch.pestLevel + Math.floor(Math.random() * 3)));

    const detectedImpurity = failIndex === 3
      ? 1.2 + Math.random() * 0.5
      : 0.3 + Math.random() * 0.4;

    const moisturePassed = detectedMoisture <= 14.5;
    const pestPassed = detectedPest < 5;
    const impurityPassed = detectedImpurity < 1.0;

    const failedItemName = failIndex === 0 ? '等级' : failIndex === 1 ? '水分' : failIndex === 2 ? '虫害' : failIndex === 3 ? '杂质' : undefined;

    return {
      grade: { passed: gradePassed, expected: expectedGrade, detected: detectedGrade },
      moisture: { passed: moisturePassed, expected: batch.moisture, detected: Number(detectedMoisture.toFixed(1)), threshold: 14.5 },
      pest: { passed: pestPassed, detected: Number(detectedPest.toFixed(1)), threshold: 5 },
      impurity: { passed: impurityPassed, detected: Number(detectedImpurity.toFixed(2)), threshold: 1.0 },
      overallPassed: gradePassed && moisturePassed && pestPassed && impurityPassed,
      failedItem: failedItemName,
    };
  };

  const handleStartQualityCheck = async (taskId: string, batchId: string) => {
    setShowQualityModal({ taskId, batchId });
    setQualityChecking(true);
    setQualityResult(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = simulateQualityCheck(batchId);
    setQualityResult(result);
    setQualityChecking(false);
  };

  const handleConfirmQualityResult = () => {
    if (!showQualityModal || !qualityResult) return;
    const { taskId, batchId } = showQualityModal;
    const batch = grainBatches.find(b => b.id === batchId);

    if (qualityResult.overallPassed) {
      advanceOutboundTask(taskId, 'completed');
      setScanResult({
        match: true,
        message: `核验通过: 所有质检项合格，准予出库`,
        detail: `批次 ${batchId} · 标签 ${batch?.eTagId} · 等级 ${GRADE_LABELS[batch?.grade || 'grade1']}`,
      });
    } else {
      const failDetail = `${qualityResult.failedItem}不合格`;
      let reason = `出库质检${failDetail}: `;
      if (!qualityResult.grade.passed) reason += `等级${qualityResult.grade.expected}→${qualityResult.grade.detected} `;
      if (!qualityResult.moisture.passed) reason += `水分${qualityResult.moisture.detected}% `;
      if (!qualityResult.pest.passed) reason += `虫害${qualityResult.pest.detected}头/kg `;
      if (!qualityResult.impurity.passed) reason += `杂质${qualityResult.impurity.detected}% `;
      quarantineBatch(batchId, reason.trim());
      setScanResult({
        match: false,
        message: `核验失败: ${failDetail}，批次已自动隔离`,
        detail: `批次 ${batchId} · 标签 ${batch?.eTagId} · 产地 ${batch?.origin}`,
      });
    }

    setSelectedTask(taskId);
    setShowQualityModal(null);
    setQualityResult(null);
  };

  const handleScan = (taskId: string) => {
    const task = outboundTasks.find(t => t.id === taskId);
    if (!task) return;
    const firstItem = task.items[0];
    handleStartQualityCheck(taskId, firstItem.batchId);
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
                    {scanResult.detail && <p className="text-xs text-gray-500 mt-1">追溯: {scanResult.detail}</p>}
                    {!scanResult.match && <p className="text-xs text-temp-warm mt-2">相关批次已自动隔离，已生成追溯工单至产地</p>}
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

      {showQualityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { !qualityChecking && setShowQualityModal(null); setQualityResult(null); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-2">出库质检核验</h3>
            {qualityResult && showQualityModal && (
              <p className="text-sm text-gray-400 mb-5">
                批次: {showQualityModal.batchId} · {grainBatches.find(b => b.id === showQualityModal.batchId)?.origin}
              </p>
            )}

            {qualityChecking ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-wheat animate-spin mb-4" />
                <p className="text-lg font-medium text-wheat">正在进行质检检测...</p>
                <p className="text-sm text-gray-500 mt-2">等级 · 水分 · 虫害 · 杂质 四项指标检测中</p>
              </div>
            ) : qualityResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
                  qualityResult.overallPassed
                    ? 'bg-temp-normal/10 border border-temp-normal/30'
                    : 'bg-temp-danger/10 border border-temp-danger/30'
                }`}>
                  {qualityResult.overallPassed
                    ? <Check className="w-8 h-8 text-temp-normal flex-shrink-0" />
                    : <X className="w-8 h-8 text-temp-danger flex-shrink-0" />}
                  <div>
                    <p className={`text-lg font-semibold ${qualityResult.overallPassed ? 'text-temp-normal' : 'text-temp-danger'}`}>
                      {qualityResult.overallPassed ? '质检合格' : '质检不合格'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {qualityResult.overallPassed
                        ? '所有检测项均符合标准，准予出库'
                        : `检测项 "${qualityResult.failedItem}" 不符合标准，批次将自动隔离`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-lg border ${
                    qualityResult.grade.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">等级</span>
                      {qualityResult.grade.passed
                        ? <Check className="w-4 h-4 text-temp-normal" />
                        : <X className="w-4 h-4 text-temp-danger" />}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">登记</p>
                        <p className="font-mono text-lg">{qualityResult.grade.expected}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">实测</p>
                        <p className={`font-mono text-lg ${!qualityResult.grade.passed ? 'text-temp-danger' : ''}`}>
                          {qualityResult.grade.detected}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    qualityResult.moisture.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Droplets className="w-4 h-4" />水分
                      </span>
                      {qualityResult.moisture.passed
                        ? <Check className="w-4 h-4 text-temp-normal" />
                        : <X className="w-4 h-4 text-temp-danger" />}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">登记</p>
                        <p className="font-mono text-lg">{qualityResult.moisture.expected}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">实测 (≤{qualityResult.moisture.threshold}%)</p>
                        <p className={`font-mono text-lg ${!qualityResult.moisture.passed ? 'text-temp-danger' : ''}`}>
                          {qualityResult.moisture.detected}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    qualityResult.pest.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Bug className="w-4 h-4" />虫害
                      </span>
                      {qualityResult.pest.passed
                        ? <Check className="w-4 h-4 text-temp-normal" />
                        : <X className="w-4 h-4 text-temp-danger" />}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">阈值</p>
                        <p className="font-mono text-lg">&lt; {qualityResult.pest.threshold} 头/kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">实测</p>
                        <p className={`font-mono text-lg ${!qualityResult.pest.passed ? 'text-temp-danger' : ''}`}>
                          {qualityResult.pest.detected} 头/kg
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    qualityResult.impurity.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />杂质
                      </span>
                      {qualityResult.impurity.passed
                        ? <Check className="w-4 h-4 text-temp-normal" />
                        : <X className="w-4 h-4 text-temp-danger" />}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">阈值</p>
                        <p className="font-mono text-lg">&lt; {qualityResult.impurity.threshold}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">实测</p>
                        <p className={`font-mono text-lg ${!qualityResult.impurity.passed ? 'text-temp-danger' : ''}`}>
                          {qualityResult.impurity.detected}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
                  <button className="btn-outline" onClick={() => {
                    setShowQualityModal(null);
                    setQualityResult(null);
                  }}>取消</button>
                  <button
                    className={qualityResult.overallPassed ? 'btn-wheat' : 'btn-danger'}
                    onClick={handleConfirmQualityResult}
                  >
                    {qualityResult.overallPassed ? '确认通过' : '确认隔离'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
