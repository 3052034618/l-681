import { useState } from 'react';
import { TrendingDown, AlertTriangle, Check, Clock, User, DollarSign, Package, MessageSquare, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS } from '@/types';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/helpers';

const minStockConfig: Record<string, number> = {
  wheat: 8000, corn: 25000, rice: 10000, soybean: 15000, barley: 5000,
};

export default function Rotation() {
  const { grainBatches, procurementSuggestions, approveProcurement } = useGrainStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const stockByVariety = Object.entries(VARIETY_LABELS).map(([key, label]) => {
    const stock = grainBatches.filter(b => b.variety === key && b.status !== 'outbound').reduce((s, b) => s + b.weight, 0);
    const min = minStockConfig[key] || 5000;
    return { variety: key, label, stock, min, ratio: stock / min };
  });

  const handleApprove = (id: string, approved: boolean) => {
    const suggestion = procurementSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    let role: 'warehouse' | 'finance' | 'generalManager' = 'warehouse';
    if (!suggestion.approvals.warehouse) role = 'warehouse';
    else if (!suggestion.approvals.finance) role = 'finance';
    else role = 'generalManager';
    approveProcurement(id, role, comment || (approved ? '同意' : '驳回'), approved);
    setSelectedId(null);
    setComment('');
  };

  const statusMap: Record<string, { label: string; class: string; step: number }> = {
    draft: { label: '草稿', class: 'bg-gray-500/20 text-gray-400', step: 0 },
    warehouse_approval: { label: '仓储审批', class: 'bg-wheat/20 text-wheat', step: 1 },
    finance_approval: { label: '财务审核', class: 'bg-primary-500/20 text-primary-300', step: 2 },
    gm_approval: { label: '总经理审批', class: 'bg-temp-warm/20 text-temp-warm', step: 3 },
    approved: { label: '已通过', class: 'bg-temp-normal/20 text-temp-normal', step: 4 },
    rejected: { label: '已驳回', class: 'bg-temp-danger/20 text-temp-danger', step: -1 },
  };

  const steps = [
    { key: 'warehouse', label: '仓储部长', icon: User },
    { key: 'finance', label: '财务审核', icon: DollarSign },
    { key: 'generalManager', label: '总经理', icon: User },
  ];

  return (
    <div className="min-h-screen">
      <Header title="库存轮换与采购" subtitle="安全库存预警 · 三级审批流程 · 智能采购建议" />
      <div className="p-6 space-y-6">
        <div className="card">
          <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-temp-warm" />
            安全库存预警
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {stockByVariety.map(item => {
              const isLow = item.stock < item.min;
              const percent = Math.min(100, (item.stock / item.min) * 100);
              return (
                <div key={item.variety} className={`p-4 rounded-xl border ${isLow ? 'border-temp-danger/40 bg-temp-danger/5' : 'border-border bg-bg-dark'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{item.label}</span>
                    {isLow && <TrendingDown className="w-5 h-5 text-temp-danger animate-pulse" />}
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-mono font-bold" style={{ color: isLow ? '#EF4444' : '#fff' }}>
                      {formatNumber(item.stock)}<span className="text-sm font-normal text-gray-500 ml-1">吨</span>
                    </span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-gradient-to-r from-temp-danger to-temp-hot' : 'bg-gradient-to-r from-primary-400 to-wheat'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">安全线: {formatNumber(item.min)}t</span>
                    <span className={isLow ? 'text-temp-danger' : 'text-gray-400'}>
                      {isLow ? `缺${formatNumber(item.min - item.stock)}t` : `${percent.toFixed(0)}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-wheat" />
              轮换采购建议审批
            </h3>
          </div>
          <div className="space-y-5">
            {procurementSuggestions.map(s => {
              const cfg = statusMap[s.status];
              return (
                <div key={s.id} className="p-5 rounded-xl bg-bg-dark border border-border">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-wheat/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-wheat" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="badge bg-wheat/15 text-wheat font-medium">{VARIETY_LABELS[s.variety]}</span>
                          <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">创建时间: {formatDateTime(s.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-gradient">{formatNumber(s.quantity)}<span className="text-sm text-gray-500 font-normal ml-1">吨</span></p>
                      <p className="text-sm text-gray-400 mt-1">预估金额 ¥{formatCurrency(s.estimatedCost)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-5 p-4 bg-bg rounded-lg">
                    <div><p className="text-xs text-gray-500">当前库存</p><p className="font-mono font-medium mt-1">{formatNumber(s.currentStock)} t</p></div>
                    <div><p className="text-xs text-gray-500">最低安全线</p><p className="font-mono font-medium mt-1">{formatNumber(s.minStock)} t</p></div>
                    <div><p className="text-xs text-gray-500">预估单价</p><p className="font-mono font-medium mt-1">¥{formatNumber(s.estimatedPrice)}/t</p></div>
                    <div><p className="text-xs text-gray-500">建议说明</p><p className="text-sm mt-1 line-clamp-1">{s.reason}</p></div>
                  </div>

                  <div className="flex items-center">
                    {steps.map((st, idx) => {
                      const appr = s.approvals[st.key as keyof typeof s.approvals];
                      const isDone = appr?.approved === true;
                      const isRejected = appr?.approved === false;
                      const isCurrent = !appr && s.status !== 'approved' && s.status !== 'rejected' && (
                        (idx === 0 && s.status === 'warehouse_approval') ||
                        (idx === 1 && s.status === 'finance_approval') ||
                        (idx === 2 && s.status === 'gm_approval')
                      );
                      return (
                        <div key={st.key} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center">
                            <button
                              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                isDone ? 'bg-temp-normal text-white' :
                                isRejected ? 'bg-temp-danger text-white' :
                                isCurrent ? 'bg-wheat text-bg-dark hover:bg-wheat-600 animate-pulse cursor-pointer shadow-lg shadow-wheat/20' :
                                'bg-bg-light text-gray-500 border border-border'
                              }`}
                              onClick={() => isCurrent && setSelectedId(s.id)}
                            >
                              {isDone ? <Check className="w-5 h-5" /> : isRejected ? '✕' : <st.icon className="w-5 h-5" />}
                            </button>
                            <span className={`text-xs mt-2 ${isCurrent ? 'text-wheat font-medium' : 'text-gray-500'}`}>{st.label}</span>
                            {appr && (
                              <div className="mt-2 p-2 rounded-lg bg-bg border border-border max-w-[160px]">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatDateTime(appr.time!)}
                                </p>
                                {appr.comment && <p className="text-xs text-gray-300 mt-1 italic">"{appr.comment}"</p>}
                              </div>
                            )}
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-4 relative ${isDone ? 'bg-temp-normal' : 'bg-border'}`}>
                              {isDone && <ArrowRight className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 text-temp-normal bg-bg-dark rounded-full" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedId(null)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[480px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-5">采购建议审批</h3>
            <div className="space-y-4">
              <div className="p-4 bg-bg rounded-lg space-y-2">
                {(() => {
                  const s = procurementSuggestions.find(x => x.id === selectedId);
                  if (!s) return null;
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-gray-400">品种</span><span className="font-medium">{VARIETY_LABELS[s.variety]}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">采购量</span><span className="font-mono font-medium">{formatNumber(s.quantity)} 吨</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">预估金额</span><span className="font-mono font-medium text-wheat">¥{formatCurrency(s.estimatedCost)}</span></div>
                    </>
                  );
                })()}
              </div>
              <div>
                <label className="label"><MessageSquare className="w-4 h-4 inline mr-1.5" />审批意见</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="请输入审批意见..." value={comment} onChange={e => setComment(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
              <button className="btn-outline" onClick={() => setSelectedId(null)}>取消</button>
              <button className="btn-danger" onClick={() => handleApprove(selectedId, false)}>驳回</button>
              <button className="btn-wheat" onClick={() => handleApprove(selectedId, true)}>批准通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
