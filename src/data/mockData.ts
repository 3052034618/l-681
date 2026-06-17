import type { Warehouse, GrainBatch, Alert, Equipment, MaintenanceOrder, ProcurementSuggestion, OutboundTask, FumigationPlan, Sensor } from '@/types';

const now = Date.now();
const hours = (h: number) => new Date(now - h * 3600000).toISOString();
const days = (d: number) => new Date(now - d * 86400000).toISOString();

function createSensors(warehouseId: string, baseTemp: number): Sensor[] {
  return [
    { id: `S-${warehouseId}-T1`, warehouseId, type: 'temperature', name: '粮温上层', value: baseTemp, threshold: 25, status: 'normal', lastReading: hours(0.1) },
    { id: `S-${warehouseId}-T2`, warehouseId, type: 'temperature', name: '粮温中层', value: baseTemp - 0.5, threshold: 25, status: 'normal', lastReading: hours(0.1) },
    { id: `S-${warehouseId}-T3`, warehouseId, type: 'temperature', name: '粮温下层', value: baseTemp - 1.2, threshold: 25, status: 'normal', lastReading: hours(0.1) },
    { id: `S-${warehouseId}-P1`, warehouseId, type: 'pest', name: '虫害监测A区', value: 0, threshold: 5, status: 'normal', lastReading: hours(0.2) },
    { id: `S-${warehouseId}-P2`, warehouseId, type: 'pest', name: '虫害监测B区', value: 1, threshold: 5, status: 'normal', lastReading: hours(0.2) },
    { id: `S-${warehouseId}-H1`, warehouseId, type: 'humidity', name: '仓内湿度', value: 65, threshold: 75, status: 'normal', lastReading: hours(0.1) },
  ];
}

export const mockWarehouses: Warehouse[] = [
  { id: 'W01', name: '1号仓', capacity: 5000, usedCapacity: 4200, row: 0, col: 0, avgTemp: 18.5, variety: 'wheat', status: 'normal', sensors: createSensors('W01', 18.5) },
  { id: 'W02', name: '2号仓', capacity: 5000, usedCapacity: 3800, row: 0, col: 1, avgTemp: 19.2, variety: 'corn', status: 'normal', sensors: createSensors('W02', 19.2) },
  { id: 'W03', name: '3号仓', capacity: 5000, usedCapacity: 4850, row: 0, col: 2, avgTemp: 26.8, variety: 'rice', status: 'warning', sensors: createSensors('W03', 26.8).map(s => s.type === 'temperature' ? { ...s, status: 'alarm' as const, value: s.value + 3 } : s) },
  { id: 'W04', name: '4号仓', capacity: 5000, usedCapacity: 2100, row: 0, col: 3, avgTemp: 17.8, variety: 'wheat', status: 'normal', sensors: createSensors('W04', 17.8) },
  { id: 'W05', name: '5号仓', capacity: 8000, usedCapacity: 6500, row: 1, col: 0, avgTemp: 20.1, variety: 'soybean', status: 'normal', sensors: createSensors('W05', 20.1) },
  { id: 'W06', name: '6号仓', capacity: 8000, usedCapacity: 7200, row: 1, col: 1, avgTemp: 22.5, variety: 'corn', status: 'normal', sensors: createSensors('W06', 22.5) },
  { id: 'W07', name: '7号仓', capacity: 8000, usedCapacity: 0, row: 1, col: 2, avgTemp: 16.0, status: 'normal', sensors: createSensors('W07', 16.0) },
  { id: 'W08', name: '8号仓', capacity: 8000, usedCapacity: 5800, row: 1, col: 3, avgTemp: 24.3, variety: 'wheat', status: 'warning', sensors: createSensors('W08', 24.3) },
  { id: 'W09', name: '9号仓', capacity: 10000, usedCapacity: 8900, row: 2, col: 0, avgTemp: 19.8, variety: 'rice', status: 'normal', sensors: createSensors('W09', 19.8) },
  { id: 'W10', name: '10号仓', capacity: 10000, usedCapacity: 9500, row: 2, col: 1, avgTemp: 28.5, variety: 'corn', status: 'warning', sensors: createSensors('W10', 28.5).map(s => s.type === 'temperature' ? { ...s, status: 'alarm' as const, value: s.value + 4 } : s.type === 'pest' ? { ...s, status: 'alarm' as const, value: 8 } : s) },
  { id: 'W11', name: '11号仓', capacity: 10000, usedCapacity: 4200, row: 2, col: 2, avgTemp: 18.2, variety: 'barley', status: 'normal', sensors: createSensors('W11', 18.2) },
  { id: 'W12', name: '12号仓', capacity: 10000, usedCapacity: 6800, row: 2, col: 3, avgTemp: 21.0, variety: 'soybean', status: 'normal', sensors: createSensors('W12', 21.0) },
];

export const mockGrainBatches: GrainBatch[] = [
  { id: 'B2025001', origin: '河南周口', variety: 'wheat', grade: 'grade1', moisture: 12.5, weight: 2800, warehouseId: 'W01', inboundDate: days(60), eTagId: 'ET-001', temperature: 18.2, pestLevel: 0, status: 'normal', position: 'A区-01' },
  { id: 'B2025002', origin: '山东济宁', variety: 'wheat', grade: 'grade2', moisture: 13.1, weight: 1400, warehouseId: 'W01', inboundDate: days(45), eTagId: 'ET-002', temperature: 18.8, pestLevel: 1, status: 'normal', position: 'A区-02' },
  { id: 'B2025003', origin: '吉林长春', variety: 'corn', grade: 'grade1', moisture: 13.8, weight: 3800, warehouseId: 'W02', inboundDate: days(90), eTagId: 'ET-003', temperature: 19.2, pestLevel: 0, status: 'normal', position: 'B区-01' },
  { id: 'B2025004', origin: '黑龙江哈尔滨', variety: 'rice', grade: 'grade1', moisture: 14.2, weight: 4850, warehouseId: 'W03', inboundDate: days(30), eTagId: 'ET-004', temperature: 26.8, pestLevel: 2, status: 'warning', position: 'C区-01' },
  { id: 'B2025005', origin: '江苏徐州', variety: 'wheat', grade: 'grade2', moisture: 12.8, weight: 2100, warehouseId: 'W04', inboundDate: days(120), eTagId: 'ET-005', temperature: 17.8, pestLevel: 0, status: 'normal', position: 'D区-01' },
  { id: 'B2025006', origin: '黑龙江齐齐哈尔', variety: 'soybean', grade: 'grade1', moisture: 11.5, weight: 6500, warehouseId: 'W05', inboundDate: days(75), eTagId: 'ET-006', temperature: 20.1, pestLevel: 0, status: 'normal', position: 'E区-01' },
  { id: 'B2025007', origin: '河南新乡', variety: 'corn', grade: 'grade2', moisture: 14.0, weight: 7200, warehouseId: 'W06', inboundDate: days(50), eTagId: 'ET-007', temperature: 22.5, pestLevel: 1, status: 'normal', position: 'F区-01' },
  { id: 'B2025008', origin: '安徽阜阳', variety: 'wheat', grade: 'grade1', moisture: 12.3, weight: 5800, warehouseId: 'W08', inboundDate: days(100), eTagId: 'ET-008', temperature: 24.3, pestLevel: 3, status: 'warning', position: 'H区-01' },
  { id: 'B2025009', origin: '湖南长沙', variety: 'rice', grade: 'grade1', moisture: 13.8, weight: 8900, warehouseId: 'W09', inboundDate: days(20), eTagId: 'ET-009', temperature: 19.8, pestLevel: 0, status: 'normal', position: 'I区-01' },
  { id: 'B2025010', origin: '辽宁沈阳', variety: 'corn', grade: 'grade2', moisture: 14.5, weight: 9500, warehouseId: 'W10', inboundDate: days(15), eTagId: 'ET-010', temperature: 28.5, pestLevel: 8, status: 'warning', position: 'J区-01' },
  { id: 'B2025011', origin: '内蒙古呼和浩特', variety: 'barley', grade: 'grade2', moisture: 12.0, weight: 4200, warehouseId: 'W11', inboundDate: days(110), eTagId: 'ET-011', temperature: 18.2, pestLevel: 0, status: 'normal', position: 'K区-01' },
  { id: 'B2025012', origin: '吉林白城', variety: 'soybean', grade: 'grade1', moisture: 11.2, weight: 6800, warehouseId: 'W12', inboundDate: days(85), eTagId: 'ET-012', temperature: 21.0, pestLevel: 1, status: 'normal', position: 'L区-01' },
];

export const mockAlerts: Alert[] = [
  { id: 'A001', warehouseId: 'W10', batchId: 'B2025010', type: 'temperature', level: 'critical', message: '10号仓粮温异常偏高，达到28.5℃，超过安全阈值', status: 'processing', createdAt: hours(1.5), handler: '张保管' },
  { id: 'A002', warehouseId: 'W10', batchId: 'B2025010', type: 'pest', level: 'danger', message: '10号仓虫害监测值8头/kg，超过预警阈值', status: 'processing', createdAt: hours(2), handler: '张保管' },
  { id: 'A003', warehouseId: 'W03', batchId: 'B2025004', type: 'temperature', level: 'warning', message: '3号仓粮温26.8℃，接近警戒值，建议关注', status: 'pending', createdAt: hours(4) },
  { id: 'A004', warehouseId: 'W08', batchId: 'B2025008', type: 'pest', level: 'warning', message: '8号仓虫害监测值3头/kg，呈上升趋势', status: 'pending', createdAt: hours(6) },
  { id: 'A005', warehouseId: 'W08', batchId: 'B2025008', type: 'temperature', level: 'info', message: '8号仓粮温持续上升中，已达24.3℃', status: 'resolved', createdAt: hours(12), handler: '李保管' },
];

export const mockEquipment: Equipment[] = [
  { id: 'EQ001', name: '1号输送机', code: 'CSS-001', type: 'conveyor', location: '东装卸区', lastMaintenance: days(15), nextMaintenance: days(-15), status: 'normal', runHours: 1250 },
  { id: 'EQ002', name: '2号输送机', code: 'CSS-002', type: 'conveyor', location: '西装卸区', lastMaintenance: days(45), nextMaintenance: days(15), status: 'normal', runHours: 980 },
  { id: 'EQ003', name: '1号烘干机', code: 'GHJ-001', type: 'dryer', location: '烘干车间', lastMaintenance: days(30), nextMaintenance: days(-60), status: 'normal', runHours: 560 },
  { id: 'EQ004', name: '1号通风机', code: 'TFJ-001', type: 'ventilator', location: '3号仓', lastMaintenance: days(60), nextMaintenance: days(0), status: 'fault', runHours: 2100 },
  { id: 'EQ005', name: '2号通风机', code: 'TFJ-002', type: 'ventilator', location: '10号仓', lastMaintenance: days(20), nextMaintenance: days(40), status: 'normal', runHours: 1850 },
  { id: 'EQ006', name: '1号提升机', code: 'TSJ-001', type: 'elevator', location: '主输送线', lastMaintenance: days(10), nextMaintenance: days(50), status: 'normal', runHours: 780 },
];

export const mockMaintenanceOrders: MaintenanceOrder[] = [
  { id: 'MO001', equipmentId: 'EQ004', type: 'repair', title: '1号通风机异响故障', description: '运行时电机部位有异常响声，伴随震动', status: 'escalated', createdAt: hours(3), deadline: hours(-1), escalated: true },
  { id: 'MO002', equipmentId: 'EQ001', type: 'inspection', title: '1号输送机月度巡检', description: '皮带磨损检查、滚筒润滑、电气部件检测', status: 'pending', createdAt: hours(0.5), deadline: hours(48), escalated: false },
  { id: 'MO003', equipmentId: 'EQ003', type: 'inspection', title: '1号烘干机季度保养', description: '加热管清理、温控校准、风机检查', status: 'processing', createdAt: hours(8), deadline: hours(72), assignee: '王工', escalated: false },
  { id: 'MO004', equipmentId: 'EQ002', type: 'repair', title: '2号输送机皮带跑偏', description: '运行时皮带向左侧偏移约2cm', status: 'completed', createdAt: days(1), deadline: hours(24), assignee: '赵工', escalated: false },
];

export const mockProcurementSuggestions: ProcurementSuggestion[] = [
  { id: 'PS001', variety: 'rice', quantity: 3000, currentStock: 8900, minStock: 10000, estimatedPrice: 3200, estimatedCost: 9600000, reason: '3号仓水稻即将出库轮换，库存低于安全线', status: 'warehouse_approval', createdAt: days(1), approvals: {} },
  { id: 'PS002', variety: 'corn', quantity: 5000, currentStock: 20500, minStock: 25000, estimatedPrice: 2600, estimatedCost: 13000000, reason: '玉米库存持续下降，预计2个月后低于警戒线', status: 'finance_approval', createdAt: days(2), approvals: { warehouse: { approved: true, comment: '同意，建议分批次采购', time: days(1) } } },
  { id: 'PS003', variety: 'soybean', quantity: 2000, currentStock: 13300, minStock: 15000, estimatedPrice: 4800, estimatedCost: 9600000, reason: '大豆市场价格处于低位，建议适时补库', status: 'approved', createdAt: days(5), approvals: { warehouse: { approved: true, comment: '同意', time: days(4) }, finance: { approved: true, comment: '预算充足', time: days(3) }, generalManager: { approved: true, comment: '执行', time: days(2) } } },
];

export const mockOutboundTasks: OutboundTask[] = [
  {
    id: 'OT001', code: 'CK-2025-001', status: 'picking', createdAt: hours(5),
    items: [
      { batchId: 'B2025005', quantity: 500, grade: 'grade2', variety: 'wheat', origin: '江苏徐州', warehouseId: 'W04', position: 'D区-01' },
      { batchId: 'B2025001', quantity: 300, grade: 'grade1', variety: 'wheat', origin: '河南周口', warehouseId: 'W01', position: 'A区-01' },
    ],
  },
  {
    id: 'OT002', code: 'CK-2025-002', status: 'verifying', createdAt: hours(10),
    items: [
      { batchId: 'B2025003', quantity: 800, grade: 'grade1', variety: 'corn', origin: '吉林长春', warehouseId: 'W02', position: 'B区-01' },
    ],
  },
  {
    id: 'OT003', code: 'CK-2025-003', status: 'exception', createdAt: days(1),
    items: [
      { batchId: 'B2025011', quantity: 200, grade: 'grade2', variety: 'barley', origin: '内蒙古呼和浩特', warehouseId: 'W11', position: 'K区-01' },
    ],
    exceptionReason: '扫码核验发现等级不符，入库登记为二等，实际检测为三等',
  },
  {
    id: 'OT004', code: 'CK-2025-004', status: 'completed', createdAt: days(2),
    items: [
      { batchId: 'B2025006', quantity: 1000, grade: 'grade1', variety: 'soybean', origin: '黑龙江齐齐哈尔', warehouseId: 'W05', position: 'E区-01' },
    ],
  },
];

export const mockFumigationPlans: FumigationPlan[] = [
  {
    id: 'FP001', warehouseId: 'W10', batchId: 'B2025010', agent: '磷化铝', dosage: 6, duration: 168,
    reason: '虫害密度超标，需立即熏蒸处理',
    status: 'pending_approval', createdAt: hours(1), createdBy: '张保管',
    approvals: {},
  },
  {
    id: 'FP002', warehouseId: 'W08', batchId: 'B2025008', agent: '磷化氢', dosage: 5, duration: 120,
    reason: '虫害呈上升趋势，预防性熏蒸',
    status: 'approved', createdAt: days(1), createdBy: '李保管',
    approvals: {
      warehouseMinister: { approved: true, comment: '同意，注意人员安全', time: hours(20) },
      qualityInspector: { approved: true, comment: '用药量合理，建议延长散气时间', time: hours(18) },
    },
  },
];

export const pestTrendData = [
  { date: '6/11', value: 3 },
  { date: '6/12', value: 5 },
  { date: '6/13', value: 2 },
  { date: '6/14', value: 4 },
  { date: '6/15', value: 6 },
  { date: '6/16', value: 8 },
  { date: '6/17', value: 5 },
];

export const temperatureTrendData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  W01: 17.5 + Math.sin(i / 4) * 1.5,
  W03: 25 + Math.sin(i / 3) * 2,
  W10: 27 + Math.sin(i / 2.5) * 2.5,
}));
