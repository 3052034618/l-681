import { useState } from 'react';
import { Plus, MapPin, Droplets, Weight, Tag, QrCode, Check, Sparkles, Search, Filter } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS, GRADE_LABELS, GrainVariety, GrainGrade, WarehouseRecommendation } from '@/types';
import { formatDateTime, formatNumber } from '@/utils/helpers';

const varietyOptions: { value: GrainVariety; label: string }[] = Object.entries(VARIETY_LABELS).map(([v, l]) => ({ value: v as GrainVariety, label: l }));
const gradeOptions: { value: GrainGrade; label: string }[] = Object.entries(GRADE_LABELS).map(([v, l]) => ({ value: v as GrainGrade, label: l }));

const origins = ['河南周口', '山东济宁', '吉林长春', '黑龙江哈尔滨', '江苏徐州', '安徽阜阳', '湖南长沙', '辽宁沈阳', '内蒙古呼和浩特'];

export default function Warehousing() {
  const { grainBatches, warehouses, recommendWarehouse, addGrainBatch } = useGrainStore();
  const [step, setStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [recommendations, setRecommendations] = useState<WarehouseRecommendation[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    origin: '',
    variety: 'wheat' as GrainVariety,
    grade: 'grade1' as GrainGrade,
    moisture: 12.5,
    weight: 1000,
  });
  const [filter, setFilter] = useState({ variety: '', keyword: '' });
  const [generatedTag, setGeneratedTag] = useState<{ id: string; qr: string } | null>(null);

  const handleRecommend = () => {
    const recs = recommendWarehouse(formData.variety, formData.weight);
    setRecommendations(recs);
    setStep(2);
  };

  const handleConfirmWarehouse = () => {
    if (!selectedWarehouse) return;
    const selected = recommendations.find(r => r.warehouse.id === selectedWarehouse);
    if (selected) {
      addGrainBatch({
        ...formData,
        warehouseId: selected.warehouse.id,
        inboundDate: new Date().toISOString(),
      });
      const tagId = `ET-${String(Date.now()).slice(-4)}`;
      setGeneratedTag({ id: tagId, qr: `GRAIN-${tagId}-${formData.variety}` });
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(1);
    setShowForm(false);
    setSelectedWarehouse(null);
    setRecommendations([]);
    setGeneratedTag(null);
    setFormData({ origin: '', variety: 'wheat', grade: 'grade1', moisture: 12.5, weight: 1000 });
  };

  const filteredBatches = grainBatches.filter(b => {
    if (filter.variety && b.variety !== filter.variety) return false;
    if (filter.keyword && !b.origin.includes(filter.keyword) && !b.id.toLowerCase().includes(filter.keyword.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime());

  const steps = [
    { num: 1, label: '信息登记' },
    { num: 2, label: '智能推荐' },
    { num: 3, label: '生成标签' },
  ];

  return (
    <div className="min-h-screen">
      <Header title="入库管理" subtitle="粮食产地、等级、水分检测登记与智能仓廒分配" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-9 w-64"
                placeholder="搜索批次号/产地"
                value={filter.keyword}
                onChange={(e) => setFilter(f => ({ ...f, keyword: e.target.value }))}
              />
            </div>
            <select
              className="input w-36"
              value={filter.variety}
              onChange={(e) => setFilter(f => ({ ...f, variety: e.target.value }))}
            >
              <option value="">全部品种</option>
              {varietyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="btn-wheat" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            新增入库登记
          </button>
        </div>

        {showForm && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg">新粮入库登记</h3>
              <div className="flex items-center gap-6">
                {steps.map((s, i) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step > s.num ? 'bg-temp-normal text-white' :
                      step === s.num ? 'bg-wheat text-bg-dark' :
                      'bg-bg-light text-gray-500 border border-border'
                    }`}>
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className={`text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
                    {i < steps.length - 1 && <div className={`w-16 h-0.5 ${step > s.num ? 'bg-temp-normal' : 'bg-border'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="label"><MapPin className="w-4 h-4 inline mr-1.5" />产地</label>
                  <select className="input" value={formData.origin} onChange={e => setFormData(f => ({ ...f, origin: e.target.value }))}>
                    <option value="">请选择产地</option>
                    {origins.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">粮食品种</label>
                  <select className="input" value={formData.variety} onChange={e => setFormData(f => ({ ...f, variety: e.target.value as GrainVariety }))}>
                    {varietyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">质量等级</label>
                  <select className="input" value={formData.grade} onChange={e => setFormData(f => ({ ...f, grade: e.target.value as GrainGrade }))}>
                    {gradeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label"><Droplets className="w-4 h-4 inline mr-1.5" />水分含量 (%)</label>
                  <input type="number" step="0.1" className="input" value={formData.moisture} onChange={e => setFormData(f => ({ ...f, moisture: Number(e.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <label className="label"><Weight className="w-4 h-4 inline mr-1.5" />入库重量 (吨)</label>
                  <input type="number" className="input" value={formData.weight} onChange={e => setFormData(f => ({ ...f, weight: Number(e.target.value) }))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-wheat mb-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">根据品种 {VARIETY_LABELS[formData.variety]}、重量 {formData.weight}吨 和历史数据，为您智能推荐以下仓廒：</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {recommendations.map(rec => (
                    <div
                      key={rec.warehouse.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedWarehouse === rec.warehouse.id
                          ? 'border-wheat bg-wheat/5'
                          : 'border-border bg-bg-dark hover:border-border-light'
                      }`}
                      onClick={() => setSelectedWarehouse(rec.warehouse.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-display font-semibold text-lg">{rec.warehouse.name}</span>
                        <span className="badge bg-wheat/15 text-wheat font-bold">{rec.matchScore}% 匹配</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">剩余容量</span>
                          <span className="font-mono">{formatNumber(rec.remainingCapacity)} / {formatNumber(rec.warehouse.capacity)} 吨</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">当前温度</span>
                          <span className="font-mono">{rec.warehouse.avgTemp}℃</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">同品种历史</span>
                          <span className="font-mono">{rec.historicalSuccess}% 成功率</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">存储品种</span>
                          <span>{rec.warehouse.variety ? VARIETY_LABELS[rec.warehouse.variety] : '空置'}</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-400 to-wheat" style={{ width: `${rec.matchScore}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && generatedTag && (
              <div className="mb-6 flex items-center justify-center gap-10">
                <div className="p-6 bg-white rounded-2xl">
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 rounded-lg flex flex-col items-center justify-center p-4 gap-2">
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 49 }).map((_, i) => (
                        <div key={i} className={`w-3.5 h-3.5 ${Math.random() > 0.4 ? 'bg-white' : 'bg-transparent'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-300 font-mono mt-2">{generatedTag.qr}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-wheat" />
                    <span className="font-display font-semibold text-xl">电子标签已生成</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-3"><span className="text-gray-400 w-20">标签编号</span><span className="font-mono">{generatedTag.id}</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-20">粮食品种</span><span>{VARIETY_LABELS[formData.variety]}</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-20">质量等级</span><span>{GRADE_LABELS[formData.grade]}</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-20">入库重量</span><span>{formatNumber(formData.weight)} 吨</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-20">存放仓廒</span><span>{warehouses.find(w => w.id === selectedWarehouse)?.name}</span></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">请打印并粘贴标签至粮堆指定位置</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              {step > 1 && step < 3 && <button className="btn-outline" onClick={() => setStep(s => s - 1)}>上一步</button>}
              {step < 3 && (
                <button
                  className="btn-wheat"
                  onClick={() => step === 1 ? handleRecommend() : handleConfirmWarehouse()}
                  disabled={step === 2 && !selectedWarehouse}
                >
                  {step === 1 ? <> <Sparkles className="w-4 h-4" /> 智能推荐仓廒 </> : '确认并生成标签'}
                </button>
              )}
              {step === 3 && <button className="btn-wheat" onClick={handleReset}>完成登记</button>}
              <button className="btn-outline" onClick={handleReset}>取消</button>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-lg">入库记录</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-dark">
                <tr>
                  <th className="table-th">批次号</th>
                  <th className="table-th">产地</th>
                  <th className="table-th">品种</th>
                  <th className="table-th">等级</th>
                  <th className="table-th">水分</th>
                  <th className="table-th">重量</th>
                  <th className="table-th">存放仓廒</th>
                  <th className="table-th">电子标签</th>
                  <th className="table-th">入库时间</th>
                  <th className="table-th">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <tr key={b.id} className="hover:bg-bg-light/30">
                    <td className="table-td font-mono text-wheat">{b.id}</td>
                    <td className="table-td">{b.origin}</td>
                    <td className="table-td">{VARIETY_LABELS[b.variety]}</td>
                    <td className="table-td"><span className="badge bg-primary-500/20 text-primary-300">{GRADE_LABELS[b.grade]}</span></td>
                    <td className="table-td font-mono">{b.moisture}%</td>
                    <td className="table-td font-mono">{formatNumber(b.weight)}t</td>
                    <td className="table-td">{warehouses.find(w => w.id === b.warehouseId)?.name}</td>
                    <td className="table-td">
                      <span className="inline-flex items-center gap-1 text-wheat text-sm">
                        <QrCode className="w-4 h-4" />{b.eTagId}
                      </span>
                    </td>
                    <td className="table-td text-gray-400">{formatDateTime(b.inboundDate)}</td>
                    <td className="table-td">
                      <span className={`badge ${
                        b.status === 'normal' ? 'bg-temp-normal/20 text-temp-normal' :
                        b.status === 'warning' ? 'bg-temp-warm/20 text-temp-warm' :
                        b.status === 'quarantined' ? 'bg-temp-danger/20 text-temp-danger' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {b.status === 'normal' ? '正常' : b.status === 'warning' ? '预警' : b.status === 'quarantined' ? '隔离' : '已出库'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
