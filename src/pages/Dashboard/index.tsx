import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, AlertTriangle, Package, Warehouse as WarehouseIcon, RotateCcw, Bug } from 'lucide-react';
import { useGrainStore } from '@/store/grainStore';
import { VARIETY_LABELS, VARIETY_COLORS } from '@/types';
import { getTempColor, getAlertLevelColor, getAlertLevelLabel, formatNumber } from '@/utils/helpers';
import { pestTrendData, temperatureTrendData } from '@/data/mockData';
import Header from '@/components/layout/Header';

export default function Dashboard() {
  const { warehouses, grainBatches, alerts, procurementSuggestions } = useGrainStore();

  const totalStock = useMemo(() => grainBatches.reduce((sum, b) => sum + b.weight, 0), [grainBatches]);
  const totalCapacity = useMemo(() => warehouses.reduce((sum, w) => sum + w.capacity, 0), [warehouses]);
  const warningCount = useMemo(() => grainBatches.filter((b) => b.status === 'warning').length, [grainBatches]);
  const lowStockCount = useMemo(() => procurementSuggestions.filter((p) => p.status !== 'approved' && p.status !== 'rejected').length, [procurementSuggestions]);
  const turnoverRate = 0.68;

  const varietyStats = useMemo(() => {
    const map: Record<string, number> = {};
    grainBatches.forEach((b) => {
      map[b.variety] = (map[b.variety] || 0) + b.weight;
    });
    return Object.entries(map).map(([key, value]) => ({ name: VARIETY_LABELS[key as keyof typeof VARIETY_LABELS] || key, value }));
  }, [grainBatches]);

  const pendingAlerts = alerts.filter((a) => a.status === 'pending' || a.status === 'processing').slice(0, 6);

  const heatmapOption = useMemo(() => {
    const rows = Math.max(...warehouses.map((w) => w.row)) + 1;
    const cols = Math.max(...warehouses.map((w) => w.col)) + 1;
    const data: (string | number)[][] = [];
    const names: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
    const temps: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    warehouses.forEach((w) => {
      names[w.row][w.col] = w.name;
      temps[w.row][w.col] = w.avgTemp;
      data.push([w.col, w.row, w.avgTemp]);
    });

    return {
      grid: { top: 10, right: 10, bottom: 40, left: 50 },
      tooltip: {
        formatter: (params: any) => {
          const w = warehouses.find((wh) => wh.col === params.data[0] && wh.row === params.data[1]);
          if (!w) return '';
          const used = ((w.usedCapacity / w.capacity) * 100).toFixed(1);
          return `<div class="font-semibold">${w.name}</div>
            <div>平均粮温: <span style="color:${getTempColor(w.avgTemp)};font-weight:bold">${w.avgTemp}℃</span></div>
            <div>库存: ${w.usedCapacity}/${w.capacity}吨 (${used}%)</div>
            <div>品种: ${w.variety ? VARIETY_LABELS[w.variety] : '空置'}</div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: cols }, (_, i) => `${i + 1}列`),
        axisLine: { lineStyle: { color: '#2A3756' } },
        axisLabel: { color: '#9CA3AF' },
        splitArea: { show: true, areaStyle: { color: ['rgba(22,33,62,0.5)', 'rgba(26,26,46,0.5)'] } },
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: rows }, (_, i) => `${i + 1}排`),
        axisLine: { lineStyle: { color: '#2A3756' } },
        axisLabel: { color: '#9CA3AF' },
      },
      visualMap: {
        min: 12,
        max: 32,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: '#9CA3AF' },
        inRange: {
          color: ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444'],
        },
      },
      series: [
        {
          name: '粮温',
          type: 'heatmap',
          data,
          label: {
            show: true,
            formatter: (params: any) => {
              const name = names[params.data[1]][params.data[0]];
              const temp = temps[params.data[1]][params.data[0]];
              return `${name}\n${temp}℃`;
            },
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            lineHeight: 18,
          },
          itemStyle: { borderColor: '#1A1A2E', borderWidth: 3, borderRadius: 6 },
          emphasis: { itemStyle: { shadowBlur: 15, shadowColor: 'rgba(212,168,67,0.5)' } },
        },
      ],
    };
  }, [warehouses]);

  const pestOption = {
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: pestTrendData.map((d) => d.date),
      axisLine: { lineStyle: { color: '#2A3756' } },
      axisLabel: { color: '#9CA3AF' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2A3756' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#2A3756', type: 'dashed' } },
    },
    series: [
      {
        data: pestTrendData.map((d) => d.value),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#D4A843', width: 3 },
        itemStyle: { color: '#D4A843' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212,168,67,0.4)' },
              { offset: 1, color: 'rgba(212,168,67,0.02)' },
            ],
          },
        },
      },
    ],
  };

  const tempTrendOption = {
    grid: { top: 30, right: 20, bottom: 30, left: 40 },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['1号仓', '3号仓', '10号仓'],
      textStyle: { color: '#9CA3AF' },
      top: 0,
    },
    xAxis: {
      type: 'category',
      data: temperatureTrendData.map((d) => d.time),
      axisLine: { lineStyle: { color: '#2A3756' } },
      axisLabel: { color: '#9CA3AF' },
    },
    yAxis: {
      type: 'value',
      name: '℃',
      nameTextStyle: { color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#2A3756' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#2A3756', type: 'dashed' } },
    },
    series: [
      { name: '1号仓', data: temperatureTrendData.map((d) => d.W01.toFixed(1)), type: 'line', smooth: true, lineStyle: { color: '#22C55E' }, itemStyle: { color: '#22C55E' }, showSymbol: false },
      { name: '3号仓', data: temperatureTrendData.map((d) => d.W03.toFixed(1)), type: 'line', smooth: true, lineStyle: { color: '#F97316' }, itemStyle: { color: '#F97316' }, showSymbol: false },
      { name: '10号仓', data: temperatureTrendData.map((d) => d.W10.toFixed(1)), type: 'line', smooth: true, lineStyle: { color: '#EF4444' }, itemStyle: { color: '#EF4444' }, showSymbol: false },
    ],
  };

  const varietyOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}吨 ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#16213E', borderWidth: 3 },
        label: { show: true, color: '#9CA3AF', formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: '#2A3756' } },
        data: varietyStats.map((v, i) => ({
          name: v.name,
          value: v.value,
          itemStyle: { color: Object.values(VARIETY_COLORS)[i] },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <Header title="储粮监控指挥中心" subtitle="实时数据每5秒自动刷新" showExport />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="card-glow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">总库存量</p>
                <p className="stat-value text-gradient mt-2 animate-number">{formatNumber(totalStock)}<span className="text-sm text-gray-400 ml-1">吨</span></p>
                <p className="text-xs text-gray-500 mt-1">仓容利用率 {((totalStock / totalCapacity) * 100).toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-wheat/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-wheat" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">仓廒总数</p>
                <p className="stat-value text-white mt-2 animate-number">{warehouses.length}<span className="text-sm text-gray-400 ml-1">座</span></p>
                <p className="text-xs text-temp-normal mt-1">正常 {warehouses.filter(w => w.status === 'normal').length} 座</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <WarehouseIcon className="w-5 h-5 text-primary-300" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">库存周转率</p>
                <p className="stat-value text-white mt-2 animate-number">{(turnoverRate * 100).toFixed(0)}<span className="text-sm text-gray-400 ml-1">%</span></p>
                <p className="text-xs text-temp-normal mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />较上月 +5.2%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-temp-normal/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-temp-normal" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">预警批次</p>
                <p className="stat-value text-temp-warm mt-2 animate-number">{warningCount}<span className="text-sm text-gray-400 ml-1">批</span></p>
                <p className="text-xs text-temp-warm mt-1">需关注粮温/虫害</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-temp-warm/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-temp-warm" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">轮换待采购</p>
                <p className="stat-value text-temp-hot mt-2 animate-number">{lowStockCount}<span className="text-sm text-gray-400 ml-1">项</span></p>
                <p className="text-xs text-temp-hot mt-1">低于安全库存线</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-temp-hot/10 flex items-center justify-center">
                <Bug className="w-5 h-5 text-temp-hot" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">各仓廒粮温热力图</h3>
              <div className="flex gap-2 text-xs">
                <span className="badge bg-temp-cool/20 text-temp-cool">低温</span>
                <span className="badge bg-temp-normal/20 text-temp-normal">正常</span>
                <span className="badge bg-temp-warm/20 text-temp-warm">偏高</span>
                <span className="badge bg-temp-hot/20 text-temp-hot">过热</span>
                <span className="badge bg-temp-danger/20 text-temp-danger">危险</span>
              </div>
            </div>
            <ReactECharts option={heatmapOption} style={{ height: 360 }} theme="dark" />
          </div>
          <div className="card">
            <h3 className="font-display font-semibold text-lg mb-4">实时报警中心</h3>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {pendingAlerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg bg-bg-dark border border-border hover:border-border-light transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 animate-pulse"
                      style={{ backgroundColor: getAlertLevelColor(alert.level), boxShadow: `0 0 8px ${getAlertLevelColor(alert.level)}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge" style={{ backgroundColor: `${getAlertLevelColor(alert.level)}20`, color: getAlertLevelColor(alert.level) }}>
                          {getAlertLevelLabel(alert.level)}
                        </span>
                        <span className="text-xs text-gray-500">{warehouses.find(w => w.id === alert.warehouseId)?.name}</span>
                      </div>
                      <p className="text-sm text-gray-200 mt-1.5 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.status === 'processing' ? `处理中 · ${alert.handler}` : '待处理'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {pendingAlerts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无待处理警报</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-display font-semibold text-lg mb-4">品种库存占比</h3>
            <ReactECharts option={varietyOption} style={{ height: 260 }} theme="dark" />
          </div>
          <div className="card">
            <h3 className="font-display font-semibold text-lg mb-4">近7日虫害警报趋势</h3>
            <ReactECharts option={pestOption} style={{ height: 260 }} theme="dark" />
          </div>
          <div className="card">
            <h3 className="font-display font-semibold text-lg mb-4">重点仓廒24h粮温曲线</h3>
            <ReactECharts option={tempTrendOption} style={{ height: 260 }} theme="dark" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">轮换采购进度</h3>
            <button className="btn-outline text-sm">查看全部</button>
          </div>
          <div className="space-y-4">
            {procurementSuggestions.map((s) => {
              const steps = [
                { key: 'warehouse', label: '仓储审批' },
                { key: 'finance', label: '财务审核' },
                { key: 'generalManager', label: '总经理审批' },
              ];
              const stepStatus = steps.map((st) => {
                const appr = s.approvals[st.key as keyof typeof s.approvals];
                if (appr?.approved) return 'done';
                if (appr?.approved === false) return 'reject';
                const statusOrder = ['warehouse_approval', 'finance_approval', 'gm_approval'];
                const currentIdx = statusOrder.indexOf(s.status);
                const stepIdx = steps.indexOf(st);
                if (stepIdx === currentIdx) return 'current';
                if (stepIdx < currentIdx) return 'done';
                return 'pending';
              });
              return (
                <div key={s.id} className="p-4 rounded-lg bg-bg-dark border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="badge bg-wheat/10 text-wheat">{VARIETY_LABELS[s.variety]}</span>
                      <span className="text-sm font-medium">建议采购 {s.quantity} 吨</span>
                      <span className="text-sm text-gray-400">预估金额 ¥{formatNumber(s.estimatedCost)}</span>
                    </div>
                    <span className={`badge ${
                      s.status === 'approved' ? 'bg-temp-normal/20 text-temp-normal' :
                      s.status === 'rejected' ? 'bg-temp-danger/20 text-temp-danger' :
                      'bg-wheat/10 text-wheat'
                    }`}>
                      {s.status === 'approved' ? '已通过' : s.status === 'rejected' ? '已驳回' : '审批中'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {steps.map((st, idx) => (
                      <div key={st.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            stepStatus[idx] === 'done' ? 'bg-temp-normal text-white' :
                            stepStatus[idx] === 'current' ? 'bg-wheat text-bg-dark animate-pulse' :
                            stepStatus[idx] === 'reject' ? 'bg-temp-danger text-white' :
                            'bg-bg-light text-gray-500 border border-border'
                          }`}>
                            {stepStatus[idx] === 'done' ? '✓' : idx + 1}
                          </div>
                          <span className={`text-xs mt-1.5 ${stepStatus[idx] === 'current' ? 'text-wheat' : 'text-gray-500'}`}>{st.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 ${stepStatus[idx] === 'done' ? 'bg-temp-normal' : 'bg-border'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
