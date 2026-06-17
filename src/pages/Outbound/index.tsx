import { useState, useMemo } from 'react';
import { Truck, Scan, AlertOctagon, Plus, Search, Check, X, MapPin, QrCode, Droplets, Bug, Sparkles, Loader2, FileWarning, History, RefreshCw, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS, GRADE_LABELS, GrainVariety, QualityCheckResult, StockCheckResult, QuarantineRecord } from '@/types';
import { formatDateTime, formatNumber } from '@/utils/helpers';

export default function Outbound() {
  const {
    outboundTasks, grainBatches, warehouses,
    createOutboundTask, checkOutboundStock,
    checkSingleBatchQuality, quarantineRecords, updateQuarantineRecord,
    requestReinspection, submitReinspection, releaseQuarantineBatch, finalizeOutbound,
  } = useGrainStore();

  const [activeTab, setActiveTab] = useState<'tasks' | 'quarantine'>('tasks');
  const [showCreate, setShowCreate] = useState(false);
  const [variety, setVariety] = useState<GrainVariety>('wheat');
  const [quantity, setQuantity] = useState(500);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ match: boolean; message: string; detail?: string } | null>(null);
  const [showQualityModal, setShowQualityModal] = useState<{ taskId: string; batchId: string } | null>(null);
  const [qualityResult, setQualityResult] = useState<QualityCheckResult | null>(null);
  const [qualityChecking, setQualityChecking] = useState(false);
  const [stockCheck, setStockCheck] = useState<StockCheckResult | null>(null);
  const [showStockConfirm, setShowStockConfirm] = useState(false);

  const [taskSearch, setTaskSearch] = useState('');
  const [qrBatchSearch, setQrBatchSearch] = useState('');
  const [qrTaskSearch, setQrTaskSearch] = useState('');
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('all');

  const [showReinspectModal, setShowReinspectModal] = useState<{ record: QuarantineRecord; step: 'request' | 'submit' | 'decision' } | null>(null);
  const [reinspectNote, setReinspectNote] = useState('');
  const [reinspectResult, setReinspectResult] = useState<QualityCheckResult | null>(null);
  const [reinspectChecking, setReinspectChecking] = useState(false);

  const pendingRecords = quarantineRecords.filter(r => r.processStatus === 'pending').length;

  const filteredOutboundTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return outboundTasks;
    return outboundTasks.filter(t =>
      t.code.toLowerCase().includes(q) ||
      t.items.some(i => i.batchId.toLowerCase().includes(q))
    );
  }, [outboundTasks, taskSearch]);

  const filteredQuarantineRecords = useMemo(() => {
    return quarantineRecords.filter(r => {
      const batchMatch = !qrBatchSearch.trim() || r.batchId.toLowerCase().includes(qrBatchSearch.trim().toLowerCase());
      const taskMatch = !qrTaskSearch.trim() ||
        (r.outboundTaskCode && r.outboundTaskCode.toLowerCase().includes(qrTaskSearch.trim().toLowerCase())) ||
        (r.outboundTaskId && r.outboundTaskId.toLowerCase().includes(qrTaskSearch.trim().toLowerCase()));
      const statusMatch = qrStatusFilter === 'all' || r.processStatus === qrStatusFilter;
      return batchMatch && taskMatch && statusMatch;
    });
  }, [quarantineRecords, qrBatchSearch, qrTaskSearch, qrStatusFilter]);

  const quarantineStatusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'bg-temp-warm/20 text-temp-warm' },
    reinspect: { label: '复检中', class: 'bg-wheat/20 text-wheat' },
    released: { label: '已放行', class: 'bg-temp-normal/20 text-temp-normal' },
    return: { label: '已退货', class: 'bg-temp-danger/20 text-temp-danger' },
    disposed: { label: '已处置', class: 'bg-gray-500/20 text-gray-400' },
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

  const handleStockPreview = () => {
    const check = checkOutboundStock(variety, quantity);
    setStockCheck(check);
    if (!check.canFullfill) {
      setShowStockConfirm(true);
    } else {
      createOutboundTask(variety, quantity);
      setShowCreate(false);
      setStockCheck(null);
    }
  };

  const handleConfirmPartial = () => {
    createOutboundTask(variety, quantity, true);
    setShowStockConfirm(false);
    setShowCreate(false);
    setStockCheck(null);
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
    const { allPassed, batchFailed } = checkSingleBatchQuality(taskId, batchId, qualityResult);
    const task = outboundTasks.find(t => t.id === taskId);
    if (batchFailed) {
      setScanResult({
        match: false,
        message: `批次质检失败: ${qualityResult.failedItem}不合格，已自动进入隔离台账。其他批次可继续扫码核验。`,
        detail: `批次 ${batchId} · 标签 ${batch?.eTagId} · 产地 ${batch?.origin} · 关联出库 ${task?.code}`,
      });
    } else {
      const remaining = task?.items.filter(i => !i.qualityStatus || i.qualityStatus === 'unchecked').length || 0;
      setScanResult({
        match: allPassed,
        message: allPassed
          ? `批次质检通过，所有批次核验完毕，出库单已完成，合格库存已扣减`
          : `批次质检通过，还有 ${remaining} 个批次待核验，可继续扫码`,
        detail: `批次 ${batchId} · 标签 ${batch?.eTagId} · 等级 ${GRADE_LABELS[batch?.grade || 'grade1']}`,
      });
    }
    setSelectedTask(taskId);
    setShowQualityModal(null);
    setQualityResult(null);
  };

  const handleScan = (taskId: string) => {
    const task = outboundTasks.find(t => t.id === taskId);
    if (!task) return;
    const nextUnchecked = task.items.find(i => i.qualityStatus !== 'passed' && i.qualityStatus !== 'failed');
    if (nextUnchecked) {
      handleStartQualityCheck(taskId, nextUnchecked.batchId);
    } else {
      const passedCount = task.items.filter(i => i.qualityStatus === 'passed').length;
      const failedCount = task.items.filter(i => i.qualityStatus === 'failed').length;
      const qtyPassed = task.items.filter(i => i.qualityStatus === 'passed').reduce((s, i) => s + i.quantity, 0);
      const qtyFailed = task.items.filter(i => i.qualityStatus === 'failed').reduce((s, i) => s + i.quantity, 0);
      setScanResult({
        match: passedCount === task.items.length,
        message: passedCount === task.items.length
          ? `所有批次均已核验通过，出库单已完成`
          : `核验完成：${passedCount}批共${formatNumber(qtyPassed)}t 合格 · ${failedCount}批共${formatNumber(qtyFailed)}t 已隔离`,
      });
      setSelectedTask(taskId);
    }
  };

  const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: '待拣货', class: 'bg-gray-500/20 text-gray-400' },
    picking: { label: '拣货中', class: 'bg-wheat/20 text-wheat' },
    verifying: { label: '核验中', class: 'bg-primary-500/20 text-primary-300' },
    completed: { label: '已完成', class: 'bg-temp-normal/20 text-temp-normal' },
    exception: { label: '部分隔离', class: 'bg-temp-danger/20 text-temp-danger' },
  };

  const qualityBadge = (s?: string) => {
    if (s === 'passed') return <span className="badge bg-temp-normal/20 text-temp-normal text-xs"><Check className="w-3 h-3 inline mr-1" />合格</span>;
    if (s === 'failed') return <span className="badge bg-temp-danger/20 text-temp-danger text-xs"><X className="w-3 h-3 inline mr-1" />已隔离</span>;
    return <span className="badge bg-wheat/10 text-wheat text-xs"><Scan className="w-3 h-3 inline mr-1" />待核验</span>;
  };

  const handleFinalize = (taskId: string) => {
    const r = finalizeOutbound(taskId);
    const task = outboundTasks.find(t => t.id === taskId);
    setScanResult({
      match: r.quarantined === 0,
      message: r.quarantined === 0
        ? `已完成出库：${formatNumber(r.completed)}t 正常扣减`
        : `已完成核验：${formatNumber(r.completed)}t 正常出库 · ${formatNumber(r.quarantined)}t 已隔离（见异常台账）`,
      detail: task ? `出库单 ${task.code}` : '',
    });
    setSelectedTask(taskId);
  };

  const handleStartReinspection = (record: QuarantineRecord) => {
    setShowReinspectModal({ record, step: 'request' });
    setReinspectNote('');
    setReinspectResult(null);
  };

  const handleConfirmRequestReinspect = () => {
    if (!showReinspectModal) return;
    requestReinspection(showReinspectModal.record.id, reinspectNote || '申请复检');
    setShowReinspectModal({ ...showReinspectModal, step: 'submit' });
    setReinspectNote('');
    setReinspectChecking(true);
    setTimeout(() => {
      const res = simulateQualityCheck(showReinspectModal.record.batchId);
      setReinspectResult(res);
      setReinspectChecking(false);
      setShowReinspectModal({ ...showReinspectModal, step: 'decision' });
    }, 2000);
  };

  const handleReleaseBatch = (toNewOutbound: boolean) => {
    if (!showReinspectModal) return;
    const newTaskId = releaseQuarantineBatch(showReinspectModal.record.id, toNewOutbound);
    if (toNewOutbound && newTaskId) {
      setActiveTab('tasks');
      setSelectedTask(newTaskId);
      setTaskSearch(newTaskId);
    }
    setShowReinspectModal(null);
    setReinspectResult(null);
    setReinspectNote('');
  };

  const handleReturnOrDispose = (status: 'return' | 'disposed') => {
    if (!showReinspectModal) return;
    updateQuarantineRecord(showReinspectModal.record.id, status, status === 'return' ? '已退回供应商' : '已就地处置销毁');
    setShowReinspectModal(null);
    setReinspectResult(null);
    setReinspectNote('');
  };

  return (
    <div className="min-h-screen">
      <Header title="出库管理" subtitle="逐批次扫码质检 · 合格/隔离独立处理 · 复检闭环追溯" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'tasks' ? 'bg-wheat text-bg-dark' : 'bg-bg-card text-gray-400 hover:text-white border border-border'}`}
              onClick={() => setActiveTab('tasks')}
            >
              <Truck className="w-4 h-4 inline mr-2" />出库任务 <span className="opacity-60 ml-1">({filteredOutboundTasks.length})</span>
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'quarantine' ? 'bg-wheat text-bg-dark' : 'bg-bg-card text-gray-400 hover:text-white border border-border'}`}
              onClick={() => setActiveTab('quarantine')}
            >
              <FileWarning className="w-4 h-4 inline mr-2" />隔离异常台账 {pendingRecords > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-temp-danger text-white">{pendingRecords}</span>}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-9 w-72"
                placeholder={activeTab === 'tasks' ? '搜索出库单号 / 批次号...' : '请使用下方筛选器搜索'}
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
              />
            </div>
            {activeTab === 'tasks' && (
              <button className="btn-wheat" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                创建出库任务
              </button>
            )}
          </div>
        </div>

        {activeTab === 'tasks' && (
          <>
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
                  <p className="text-sm text-gray-400 mb-2">💡 系统将自动按入库时间从早到晚匹配批次 (FIFO原则)，自动排除预警和隔离状态批次</p>
                  <p className="text-sm text-gray-300">预计匹配 {VARIETY_LABELS[variety]} 批次 {Math.ceil(quantity / 1000)} 个</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button className="btn-outline" onClick={() => { setShowCreate(false); setStockCheck(null); }}>取消</button>
                  <button className="btn-wheat" onClick={handleStockPreview}>库存预检并创建</button>
                </div>
              </div>
            )}

            {showStockConfirm && stockCheck && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setShowStockConfirm(false); setStockCheck(null); }}>
                <div className="bg-bg-card rounded-2xl p-6 w-[640px] border border-border" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-temp-warm/20 flex items-center justify-center">
                      <AlertOctagon className="w-7 h-7 text-temp-warm" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-xl text-temp-warm">库存不足预警</h3>
                      <p className="text-sm text-gray-400 mt-1">当前可用库存无法完全满足出库需求，请确认是否部分出库</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="p-4 rounded-lg bg-bg-dark border border-border">
                      <p className="text-xs text-gray-500 mb-1">申请数量</p>
                      <p className="text-2xl font-mono font-bold">{formatNumber(stockCheck.requested)} <span className="text-sm text-gray-400">t</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-dark border border-border">
                      <p className="text-xs text-gray-500 mb-1">可用库存</p>
                      <p className="text-2xl font-mono font-bold text-temp-normal">{formatNumber(stockCheck.available)} <span className="text-sm text-gray-400">t</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-temp-danger/10 border border-temp-danger/30">
                      <p className="text-xs text-temp-danger mb-1">缺口数量</p>
                      <p className="text-2xl font-mono font-bold text-temp-danger">{formatNumber(stockCheck.shortfall)} <span className="text-sm text-gray-400">t</span></p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-300 mb-2">拟匹配批次 (仅出库 {stockCheck.matchedBatches.reduce((s, m) => s + m.quantity, 0)} 吨):</p>
                    <div className="max-h-28 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                      {stockCheck.matchedBatches.map((m, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-wheat">{m.batchId}</span>
                          <span className="text-gray-400">{m.origin}</span>
                          <span className="font-mono">{formatNumber(m.quantity)}t</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {stockCheck.alternativeBatches.length > 0 && (
                    <div className="mb-5 p-4 rounded-lg bg-primary-500/5 border border-primary-500/20">
                      <p className="text-sm font-medium text-primary-300 mb-2">💡 可替代品种批次推荐 (库存充足):</p>
                      <div className="grid grid-cols-2 gap-2">
                        {stockCheck.alternativeBatches.slice(0, 4).map((a, i) => (
                          <div key={i} className="text-xs text-gray-300 flex items-center justify-between px-2 py-1.5 rounded bg-bg-dark/60">
                            <span className="font-mono text-wheat mr-2">{a.batchId}</span>
                            <span>{VARIETY_LABELS[a.variety]}</span>
                            <span className="text-gray-500">{a.origin}</span>
                            <span className="font-mono text-temp-normal">{formatNumber(a.quantity)}t</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <button className="btn-outline" onClick={() => { setShowStockConfirm(false); setStockCheck(null); }}>取消，调整需求</button>
                    <button className="btn-danger" onClick={handleConfirmPartial}>确认部分出库 ({formatNumber(stockCheck.available)}t)</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredOutboundTasks.length === 0 ? (
                <div className="card text-center py-20">
                  <Truck className="w-16 h-16 mx-auto text-gray-600 opacity-40 mb-4" />
                  <p className="text-gray-400">{taskSearch ? `未找到与"${taskSearch}"匹配的出库任务` : '暂无出库任务'}</p>
                  {taskSearch && <button className="btn-outline mt-4" onClick={() => setTaskSearch('')}>清除搜索</button>}
                </div>
              ) : filteredOutboundTasks.map(task => {
                const passedCount = task.items.filter(i => i.qualityStatus === 'passed').length;
                const failedCount = task.items.filter(i => i.qualityStatus === 'failed').length;
                const uncheckedCount = task.items.filter(i => !i.qualityStatus || i.qualityStatus === 'unchecked').length;
                const allDone = uncheckedCount === 0;
                const passedQty = task.items.filter(i => i.qualityStatus === 'passed').reduce((s, i) => s + i.quantity, 0);
                const failedQty = task.items.filter(i => i.qualityStatus === 'failed').reduce((s, i) => s + i.quantity, 0);
                const uncheckedQty = task.items.filter(i => !i.qualityStatus || i.qualityStatus === 'unchecked').reduce((s, i) => s + i.quantity, 0);
                const passedItems = task.items.filter(i => i.qualityStatus === 'passed');
                const failedItems = task.items.filter(i => i.qualityStatus === 'failed');
                const uncheckedItems = task.items.filter(i => !i.qualityStatus || i.qualityStatus === 'unchecked');
                return (
                  <div key={task.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-wheat/10 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-wheat" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-semibold text-lg">{task.code}</h4>
                              <span className={`badge ${statusConfig[task.status].class}`}>{statusConfig[task.status].label}</span>
                              {(task.status === 'verifying' || task.status === 'exception') && (
                                <span className="badge bg-primary-500/10 text-primary-300 text-xs">
                                  已验 {passedCount + failedCount}/{task.items.length}
                                  {uncheckedCount > 0 && <span className="text-wheat ml-1">·{uncheckedCount}待验</span>}
                                  {failedCount > 0 && <span className="text-temp-danger ml-1">·{failedCount}隔离</span>}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              创建时间: {formatDateTime(task.createdAt)} ·
                              合格 {formatNumber(passedQty)}t ·
                              隔离 {formatNumber(failedQty)}t ·
                              待验 {formatNumber(uncheckedQty)}t
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(task.status === 'picking' || task.status === 'verifying') && uncheckedCount > 0 && (
                          <button className="btn-outline" onClick={() => { handleScan(task.id); }}>
                            <Scan className="w-4 h-4" />
                            扫码核验下一批
                          </button>
                        )}
                        {allDone && (task.status !== 'completed' && task.status !== 'exception') && (
                          <button className="btn-wheat" onClick={() => handleFinalize(task.id)}>
                            <Check className="w-4 h-4" />
                            完成核验并扣库存
                          </button>
                        )}
                      </div>
                    </div>

                    {task.exceptionReason && (
                      <div className="p-4 mb-4 rounded-lg bg-temp-danger/10 border border-temp-danger/30 flex items-start gap-3">
                        <AlertOctagon className="w-5 h-5 text-temp-danger flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-temp-danger">存在不合格批次</p>
                          <p className="text-sm text-gray-300 mt-1">{task.exceptionReason}</p>
                          <p className="text-xs text-temp-warm mt-2">不合格批次已进入【隔离异常台账】，可进行复检或退货处置；其他合格批次可正常出库扣减</p>
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
                            {scanResult.match ? '核验通过' : '核验提示'}
                          </p>
                          <p className="text-sm text-gray-300 mt-1">{scanResult.message}</p>
                          {scanResult.detail && <p className="text-xs text-gray-500 mt-1">追溯: {scanResult.detail}</p>}
                        </div>
                      </div>
                    )}

                    {uncheckedItems.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-wheat mb-2 flex items-center gap-2">
                          <Scan className="w-4 h-4" /> 待核验批次 ({uncheckedItems.length}批 · {formatNumber(uncheckedQty)}t)
                        </h5>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <table className="w-full">
                            <thead className="bg-bg-dark"><tr>
                              <th className="table-th text-xs">批次号</th>
                              <th className="table-th text-xs">品种/等级</th>
                              <th className="table-th text-xs">产地</th>
                              <th className="table-th text-xs">数量</th>
                              <th className="table-th text-xs">存放位置</th>
                              <th className="table-th text-xs">电子标签</th>
                              <th className="table-th text-xs">状态</th>
                              <th className="table-th text-xs">操作</th>
                            </tr></thead>
                            <tbody>
                              {uncheckedItems.map((item, idx) => {
                                const batch = grainBatches.find(b => b.id === item.batchId);
                                return (
                                  <tr key={idx} className="hover:bg-bg-light/20">
                                    <td className="table-td font-mono text-wheat text-sm">{item.batchId}</td>
                                    <td className="table-td text-sm"><span className="mr-2">{VARIETY_LABELS[item.variety]}</span><span className="badge bg-primary-500/20 text-primary-300 text-xs">{GRADE_LABELS[item.grade]}</span></td>
                                    <td className="table-td text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" />{item.origin}</td>
                                    <td className="table-td text-sm font-mono">{formatNumber(item.quantity)}t</td>
                                    <td className="table-td text-sm">{warehouses.find(w => w.id === item.warehouseId)?.name} · {item.position}</td>
                                    <td className="table-td text-sm"><span className="inline-flex items-center gap-1 text-wheat"><QrCode className="w-3.5 h-3.5" />{batch?.eTagId || '--'}</span></td>
                                    <td className="table-td">{qualityBadge(item.qualityStatus)}</td>
                                    <td className="table-td">
                                      <button className="text-xs px-2.5 py-1.5 rounded-md bg-wheat/10 text-wheat hover:bg-wheat/20 transition-colors font-medium" onClick={() => handleStartQualityCheck(task.id, item.batchId)}>
                                        <Scan className="w-3 h-3 inline mr-1" />扫码质检
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {passedItems.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-temp-normal mb-2 flex items-center gap-2">
                          <Check className="w-4 h-4" /> 合格批次 ({passedItems.length}批 · {formatNumber(passedQty)}t)
                        </h5>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <table className="w-full">
                            <thead className="bg-bg-dark"><tr>
                              <th className="table-th text-xs">批次号</th>
                              <th className="table-th text-xs">品种/等级</th>
                              <th className="table-th text-xs">产地</th>
                              <th className="table-th text-xs">数量</th>
                              <th className="table-th text-xs">存放位置</th>
                              <th className="table-th text-xs">电子标签</th>
                              <th className="table-th text-xs">状态</th>
                            </tr></thead>
                            <tbody>
                              {passedItems.map((item, idx) => {
                                const batch = grainBatches.find(b => b.id === item.batchId);
                                return (
                                  <tr key={idx}>
                                    <td className="table-td font-mono text-wheat text-sm">{item.batchId}</td>
                                    <td className="table-td text-sm"><span className="mr-2">{VARIETY_LABELS[item.variety]}</span><span className="badge bg-primary-500/20 text-primary-300 text-xs">{GRADE_LABELS[item.grade]}</span></td>
                                    <td className="table-td text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" />{item.origin}</td>
                                    <td className="table-td text-sm font-mono">{formatNumber(item.quantity)}t</td>
                                    <td className="table-td text-sm">{warehouses.find(w => w.id === item.warehouseId)?.name} · {item.position}</td>
                                    <td className="table-td text-sm"><span className="inline-flex items-center gap-1 text-wheat"><QrCode className="w-3.5 h-3.5" />{batch?.eTagId || '--'}</span></td>
                                    <td className="table-td">{qualityBadge(item.qualityStatus)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {failedItems.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-temp-danger mb-2 flex items-center gap-2">
                          <X className="w-4 h-4" /> 已隔离批次 ({failedItems.length}批 · {formatNumber(failedQty)}t)
                        </h5>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <table className="w-full">
                            <thead className="bg-bg-dark"><tr>
                              <th className="table-th text-xs">批次号</th>
                              <th className="table-th text-xs">品种/等级</th>
                              <th className="table-th text-xs">产地</th>
                              <th className="table-th text-xs">数量</th>
                              <th className="table-th text-xs">不合格项</th>
                              <th className="table-th text-xs">状态</th>
                              <th className="table-th text-xs">操作</th>
                            </tr></thead>
                            <tbody>
                              {failedItems.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="table-td font-mono text-wheat text-sm">{item.batchId}</td>
                                  <td className="table-td text-sm"><span className="mr-2">{VARIETY_LABELS[item.variety]}</span><span className="badge bg-primary-500/20 text-primary-300 text-xs">{GRADE_LABELS[item.grade]}</span></td>
                                  <td className="table-td text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" />{item.origin}</td>
                                  <td className="table-td text-sm font-mono">{formatNumber(item.quantity)}t</td>
                                  <td className="table-td text-sm text-temp-danger font-medium">{item.qualityResult?.failedItem || '质检不合格'}</td>
                                  <td className="table-td">{qualityBadge(item.qualityStatus)}</td>
                                  <td className="table-td">
                                    <button className="text-xs px-2.5 py-1.5 rounded-md bg-temp-warm/10 text-temp-warm hover:bg-temp-warm/20 transition-colors font-medium" onClick={() => {
                                      setActiveTab('quarantine');
                                      setQrBatchSearch(item.batchId);
                                    }}>
                                      <FileWarning className="w-3 h-3 inline mr-1" />查看台账
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'quarantine' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="card"><p className="text-sm text-gray-400">隔离总批次</p><p className="stat-value text-gradient mt-2">{quarantineRecords.length}</p></div>
              <div className="card"><p className="text-sm text-gray-400">待处理</p><p className="stat-value text-temp-warm mt-2">{quarantineRecords.filter(r => r.processStatus === 'pending').length}</p></div>
              <div className="card"><p className="text-sm text-gray-400">复检中</p><p className="stat-value text-wheat mt-2">{quarantineRecords.filter(r => r.processStatus === 'reinspect').length}</p></div>
              <div className="card"><p className="text-sm text-gray-400">已处理完成</p><p className="stat-value text-temp-normal mt-2">{quarantineRecords.filter(r => r.processStatus === 'return' || r.processStatus === 'disposed' || r.processStatus === 'released').length}</p></div>
            </div>

            <div className="card">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="label">批次号搜索</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input pl-9" placeholder="输入批次号..." value={qrBatchSearch} onChange={e => setQrBatchSearch(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">出库单号搜索</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input pl-9" placeholder="输入出库单号..." value={qrTaskSearch} onChange={e => setQrTaskSearch(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">处理状态筛选</label>
                  <select className="input" value={qrStatusFilter} onChange={e => setQrStatusFilter(e.target.value)}>
                    <option value="all">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="reinspect">复检中</option>
                    <option value="released">已放行</option>
                    <option value="return">已退货</option>
                    <option value="disposed">已处置</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="btn-outline" onClick={() => { setQrBatchSearch(''); setQrTaskSearch(''); setQrStatusFilter('all'); }}>重置筛选</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredQuarantineRecords.length === 0 ? (
                <div className="card text-center py-20">
                  <FileWarning className="w-16 h-16 mx-auto text-gray-600 opacity-40 mb-4" />
                  <p className="text-gray-400">暂无匹配的隔离异常记录</p>
                  <p className="text-sm text-gray-500 mt-2">当出库质检出现不合格批次时，将自动在此登记追溯信息</p>
                </div>
              ) : filteredQuarantineRecords.map((r: QuarantineRecord) => (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-temp-danger/10 flex items-center justify-center flex-shrink-0">
                        <AlertOctagon className="w-5 h-5 text-temp-danger" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="font-display font-semibold text-lg">隔离登记 #{r.id}</h4>
                          <span className={`badge ${quarantineStatusConfig[r.processStatus].class}`}>{quarantineStatusConfig[r.processStatus].label}</span>
                          {r.reInspectionCount > 0 && (
                            <span className="badge bg-wheat/20 text-wheat text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />复检{r.reInspectionCount}次</span>
                          )}
                          {r.releasedOutboundTaskId && (
                            <button className="badge bg-primary-500/10 text-primary-300 text-xs hover:bg-primary-500/20 transition-colors cursor-pointer" onClick={() => { setActiveTab('tasks'); setTaskSearch(r.releasedOutboundTaskId!); }}>
                              <ArrowRight className="w-3 h-3 inline mr-1" />关联新出库单
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          隔离时间: {formatDateTime(r.quarantineTime)} ·
                          批次号: <span className="font-mono text-wheat">{r.batchId}</span> ·
                          标签: <span className="font-mono text-primary-300">{r.eTagId}</span>
                        </p>
                      </div>
                    </div>
                    {(r.processStatus === 'pending' || r.processStatus === 'reinspect') && (
                      <div className="flex gap-2">
                        {r.processStatus === 'pending' && (
                          <button className="btn-outline" onClick={() => handleStartReinspection(r)}><RefreshCw className="w-4 h-4" />申请复检</button>
                        )}
                        {(r.processStatus === 'pending' || (r.processStatus === 'reinspect' && r.reInspectionCount > 0)) && (
                          <button className="btn-danger" onClick={() => handleReturnOrDispose('return')}>退货处置</button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-3 mb-4 p-4 rounded-lg bg-bg-dark border border-border">
                    <div><p className="text-xs text-gray-500 mb-1">品种/等级</p><p className="text-sm">{VARIETY_LABELS[r.variety]} · {GRADE_LABELS[r.grade]}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">产地</p><p className="text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-500" />{r.origin}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">存放仓廒</p><p className="text-sm">{warehouses.find(w => w.id === r.warehouseId)?.name || r.warehouseId}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">关联出库单</p><p className="text-sm font-mono text-wheat">{r.outboundTaskCode || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">不合格项</p><p className="text-sm text-temp-danger font-medium">{r.failedItems.join('、')}</p></div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className={`p-3 rounded-lg border ${r.qualityDetail.grade.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">等级</span>{r.qualityDetail.grade.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                      <p className="text-xs text-gray-500">登记 {r.qualityDetail.grade.expected} · 实测 <span className={!r.qualityDetail.grade.passed ? 'text-temp-danger font-bold' : ''}>{r.qualityDetail.grade.detected}</span></p>
                    </div>
                    <div className={`p-3 rounded-lg border ${r.qualityDetail.moisture.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Droplets className="w-3 h-3" />水分</span>{r.qualityDetail.moisture.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                      <p className="text-xs text-gray-500">阈值 ≤{r.qualityDetail.moisture.threshold}% · 实测 <span className={!r.qualityDetail.moisture.passed ? 'text-temp-danger font-bold' : ''}>{r.qualityDetail.moisture.detected}%</span></p>
                    </div>
                    <div className={`p-3 rounded-lg border ${r.qualityDetail.pest.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Bug className="w-3 h-3" />虫害</span>{r.qualityDetail.pest.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                      <p className="text-xs text-gray-500">阈值 &lt;{r.qualityDetail.pest.threshold}头/kg · 实测 <span className={!r.qualityDetail.pest.passed ? 'text-temp-danger font-bold' : ''}>{r.qualityDetail.pest.detected}</span>头/kg</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${r.qualityDetail.impurity.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" />杂质</span>{r.qualityDetail.impurity.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                      <p className="text-xs text-gray-500">阈值 &lt;{r.qualityDetail.impurity.threshold}% · 实测 <span className={!r.qualityDetail.impurity.passed ? 'text-temp-danger font-bold' : ''}>{r.qualityDetail.impurity.detected}%</span></p>
                    </div>
                  </div>

                  {r.reInspections.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg bg-wheat/5 border border-wheat/20">
                      <p className="text-sm font-medium text-wheat mb-3 flex items-center gap-2"><History className="w-4 h-4" />复检历史记录 ({r.reInspections.length}次)</p>
                      <div className="space-y-3">
                        {r.reInspections.map((ri, i) => (
                          <div key={i} className="p-3 rounded-lg bg-bg-dark/70 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="badge bg-wheat/20 text-wheat text-xs">第{i + 1}次复检</span>
                                <span className="text-xs text-gray-400">{formatDateTime(ri.time)} · {ri.operator}</span>
                              </div>
                              <span className={`badge ${ri.result.overallPassed ? 'bg-temp-normal/20 text-temp-normal' : 'bg-temp-danger/20 text-temp-danger'} text-xs`}>{ri.result.overallPassed ? '合格' : '不合格'}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <span className={ri.result.grade.passed ? 'text-gray-400' : 'text-temp-danger'}>等级: {ri.result.grade.expected}/{ri.result.grade.detected}</span>
                              <span className={ri.result.moisture.passed ? 'text-gray-400' : 'text-temp-danger'}>水分: {ri.result.moisture.detected}%</span>
                              <span className={ri.result.pest.passed ? 'text-gray-400' : 'text-temp-danger'}>虫害: {ri.result.pest.detected}头/kg</span>
                              <span className={ri.result.impurity.passed ? 'text-gray-400' : 'text-temp-danger'}>杂质: {ri.result.impurity.detected}%</span>
                            </div>
                            {ri.note && <p className="text-xs text-gray-500 mt-2 italic">备注: "{ri.note}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.processNote && (
                    <div className="p-3 rounded-lg bg-wheat/5 border border-wheat/20">
                      <p className="text-xs text-wheat mb-1 flex items-center gap-1"><History className="w-3 h-3" />处理记录 / 备注</p>
                      <p className="text-sm text-gray-300">{r.processNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showQualityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { !qualityChecking && setShowQualityModal(null); setQualityResult(null); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-2">出库质检核验</h3>
            {qualityResult && showQualityModal && (
              <p className="text-sm text-gray-400 mb-5">批次: {showQualityModal.batchId} · {grainBatches.find(b => b.id === showQualityModal.batchId)?.origin}</p>
            )}
            {qualityChecking ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-wheat animate-spin mb-4" />
                <p className="text-lg font-medium text-wheat">正在进行质检检测...</p>
                <p className="text-sm text-gray-500 mt-2">等级 · 水分 · 虫害 · 杂质 四项指标检测中</p>
              </div>
            ) : qualityResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${qualityResult.overallPassed ? 'bg-temp-normal/10 border border-temp-normal/30' : 'bg-temp-danger/10 border border-temp-danger/30'}`}>
                  {qualityResult.overallPassed ? <Check className="w-8 h-8 text-temp-normal flex-shrink-0" /> : <X className="w-8 h-8 text-temp-danger flex-shrink-0" />}
                  <div>
                    <p className={`text-lg font-semibold ${qualityResult.overallPassed ? 'text-temp-normal' : 'text-temp-danger'}`}>
                      {qualityResult.overallPassed ? '本批次质检合格' : '本批次质检不合格'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {qualityResult.overallPassed
                        ? '本批次四项指标均符合标准，等待其他批次核验后统一扣减库存'
                        : `检测项 "${qualityResult.failedItem}" 不符合标准，已自动进入隔离台账。其他批次可继续扫码核验，互不影响。`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'grade', label: '等级', icon: null, status: qualityResult.grade.passed, values: `登记 ${qualityResult.grade.expected} · 实测 ${qualityResult.grade.detected}` },
                    { key: 'moisture', label: '水分', icon: <Droplets className="w-4 h-4" />, status: qualityResult.moisture.passed, values: `登记 ${qualityResult.moisture.expected}% · 实测 (≤${qualityResult.moisture.threshold}%) ${qualityResult.moisture.detected}%` },
                    { key: 'pest', label: '虫害', icon: <Bug className="w-4 h-4" />, status: qualityResult.pest.passed, values: `阈值 <${qualityResult.pest.threshold}头/kg · 实测 ${qualityResult.pest.detected}头/kg` },
                    { key: 'impurity', label: '杂质', icon: <Sparkles className="w-4 h-4" />, status: qualityResult.impurity.passed, values: `阈值 <${qualityResult.impurity.threshold}% · 实测 ${qualityResult.impurity.detected}%` },
                  ].map(item => (
                    <div key={item.key} className={`p-4 rounded-lg border ${item.status ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1">{item.icon}{item.label}</span>
                        {item.status ? <Check className="w-4 h-4 text-temp-normal" /> : <X className="w-4 h-4 text-temp-danger" />}
                      </div>
                      <p className={`text-xs ${!item.status ? 'text-temp-danger font-bold' : 'text-gray-500'}`}>{item.values}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
                  <button className="btn-outline" onClick={() => { setShowQualityModal(null); setQualityResult(null); }}>关闭</button>
                  <button className={qualityResult.overallPassed ? 'btn-wheat' : 'btn-danger'} onClick={handleConfirmQualityResult}>
                    {qualityResult.overallPassed ? '确认本批次通过' : '确认隔离并继续核验其他批次'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showReinspectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowReinspectModal(null)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[580px] max-h-[90vh] overflow-y-auto border border-border" onClick={e => e.stopPropagation()}>
            {showReinspectModal.step === 'request' && (
              <>
                <h3 className="font-display font-semibold text-xl mb-2">申请复检</h3>
                <p className="text-sm text-gray-400 mb-4">批次: <span className="font-mono text-wheat">{showReinspectModal.record.batchId}</span> · 关联: {showReinspectModal.record.outboundTaskCode || '—'}</p>
                <div className="mb-4">
                  <label className="label">复检说明</label>
                  <textarea className="input h-24 resize-none" placeholder="请输入复检原因和抽样说明..." value={reinspectNote} onChange={e => setReinspectNote(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3">
                  <button className="btn-outline" onClick={() => setShowReinspectModal(null)}>取消</button>
                  <button className="btn-wheat" onClick={handleConfirmRequestReinspect}>提交复检申请</button>
                </div>
              </>
            )}

            {showReinspectModal.step === 'submit' && (
              <>
                <h3 className="font-display font-semibold text-xl mb-2">复检检测中</h3>
                <p className="text-sm text-gray-400 mb-4">批次: <span className="font-mono text-wheat">{showReinspectModal.record.batchId}</span> · 第{showReinspectModal.record.reInspectionCount + 1}次复检</p>
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-wheat animate-spin mb-4" />
                  <p className="text-lg font-medium text-wheat">正在进行复检检测...</p>
                  <p className="text-sm text-gray-500 mt-2">等级 · 水分 · 虫害 · 杂质 四项指标检测中</p>
                </div>
              </>
            )}

            {showReinspectModal.step === 'decision' && reinspectResult && (
              <>
                <h3 className="font-display font-semibold text-xl mb-2">复检结果处理</h3>
                <p className="text-sm text-gray-400 mb-4">批次: <span className="font-mono text-wheat">{showReinspectModal.record.batchId}</span> · 第{showReinspectModal.record.reInspectionCount + 1}次复检</p>
                <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${reinspectResult.overallPassed ? 'bg-temp-normal/10 border border-temp-normal/30' : 'bg-temp-danger/10 border border-temp-danger/30'}`}>
                  {reinspectResult.overallPassed ? <Check className="w-8 h-8 text-temp-normal flex-shrink-0" /> : <X className="w-8 h-8 text-temp-danger flex-shrink-0" />}
                  <div>
                    <p className={`text-lg font-semibold ${reinspectResult.overallPassed ? 'text-temp-normal' : 'text-temp-danger'}`}>
                      复检{reinspectResult.overallPassed ? '合格' : '不合格'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {reinspectResult.overallPassed
                        ? '复检全部指标通过，可选择放行至库存或重新开立出库单'
                        : `复检"${reinspectResult.failedItem || '部分指标'}"仍不达标，可选择再次复检、退货或就地处置`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-lg border ${reinspectResult.grade.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">等级</span>{reinspectResult.grade.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                    <p className="text-xs text-gray-500">登记 {reinspectResult.grade.expected} · 实测 <span className={!reinspectResult.grade.passed ? 'text-temp-danger font-bold' : ''}>{reinspectResult.grade.detected}</span></p>
                  </div>
                  <div className={`p-3 rounded-lg border ${reinspectResult.moisture.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Droplets className="w-3 h-3" />水分</span>{reinspectResult.moisture.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                    <p className="text-xs text-gray-500">阈值 ≤{reinspectResult.moisture.threshold}% · 实测 <span className={!reinspectResult.moisture.passed ? 'text-temp-danger font-bold' : ''}>{reinspectResult.moisture.detected}%</span></p>
                  </div>
                  <div className={`p-3 rounded-lg border ${reinspectResult.pest.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Bug className="w-3 h-3" />虫害</span>{reinspectResult.pest.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                    <p className="text-xs text-gray-500">阈值 &lt;{reinspectResult.pest.threshold}头/kg · 实测 <span className={!reinspectResult.pest.passed ? 'text-temp-danger font-bold' : ''}>{reinspectResult.pest.detected}</span>头/kg</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${reinspectResult.impurity.passed ? 'bg-bg-dark border-border' : 'bg-temp-danger/5 border-temp-danger/30'}`}>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" />杂质</span>{reinspectResult.impurity.passed ? <Check className="w-3 h-3 text-temp-normal" /> : <X className="w-3 h-3 text-temp-danger" />}</div>
                    <p className="text-xs text-gray-500">阈值 &lt;{reinspectResult.impurity.threshold}% · 实测 <span className={!reinspectResult.impurity.passed ? 'text-temp-danger font-bold' : ''}>{reinspectResult.impurity.detected}%</span></p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="label">处理备注</label>
                  <textarea className="input h-20 resize-none" placeholder="请输入处理意见..." value={reinspectNote} onChange={e => setReinspectNote(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 flex-wrap">
                  <button className="btn-outline" onClick={() => setShowReinspectModal(null)}>关闭</button>
                  {!reinspectResult.overallPassed && showReinspectModal.record.reInspectionCount < 2 && (
                    <button className="btn-outline" onClick={() => handleConfirmRequestReinspect()}><RefreshCw className="w-4 h-4" />再次复检</button>
                  )}
                  {reinspectResult.overallPassed && (
                    <>
                      <button className="btn-outline" onClick={() => handleReleaseBatch(false)}>解除隔离回库</button>
                      <button className="btn-wheat" onClick={() => handleReleaseBatch(true)}>转新出库单</button>
                    </>
                  )}
                  {!reinspectResult.overallPassed && (
                    <>
                      <button className="btn-danger" onClick={() => handleReturnOrDispose('return')}>退回供应商</button>
                      <button className="btn-danger" onClick={() => handleReturnOrDispose('disposed')}>就地处置</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}