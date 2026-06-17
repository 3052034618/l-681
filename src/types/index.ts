export type GrainVariety = 'wheat' | 'corn' | 'rice' | 'soybean' | 'barley';

export type GrainGrade = 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5';

export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical';

export type SensorType = 'temperature' | 'pest' | 'humidity';

export type EquipmentType = 'conveyor' | 'dryer' | 'ventilator' | 'elevator';

export const VARIETY_LABELS: Record<GrainVariety, string> = {
  wheat: '小麦',
  corn: '玉米',
  rice: '水稻',
  soybean: '大豆',
  barley: '大麦',
};

export const GRADE_LABELS: Record<GrainGrade, string> = {
  grade1: '一等',
  grade2: '二等',
  grade3: '三等',
  grade4: '四等',
  grade5: '五等',
};

export const VARIETY_COLORS: Record<GrainVariety, string> = {
  wheat: '#E8C872',
  corn: '#FFB347',
  rice: '#F5E6A0',
  soybean: '#8FBC8F',
  barley: '#D2B48C',
};

export interface GrainBatch {
  id: string;
  origin: string;
  variety: GrainVariety;
  grade: GrainGrade;
  moisture: number;
  weight: number;
  warehouseId: string;
  inboundDate: string;
  eTagId: string;
  temperature: number;
  pestLevel: number;
  status: 'normal' | 'warning' | 'quarantined' | 'outbound';
  position?: string;
}

export type NewGrainBatch = Omit<GrainBatch, 'id' | 'eTagId' | 'temperature' | 'pestLevel' | 'status'> & {
  temperature?: number;
  pestLevel?: number;
  status?: GrainBatch['status'];
};

export interface Sensor {
  id: string;
  warehouseId: string;
  type: SensorType;
  name: string;
  value: number;
  threshold: number;
  status: 'normal' | 'offline' | 'alarm';
  lastReading: string;
}

export interface Warehouse {
  id: string;
  name: string;
  capacity: number;
  usedCapacity: number;
  row: number;
  col: number;
  avgTemp: number;
  variety?: GrainVariety;
  sensors: Sensor[];
  status: 'normal' | 'warning' | 'maintenance';
}

export interface Alert {
  id: string;
  warehouseId: string;
  batchId?: string;
  type: 'temperature' | 'pest' | 'moisture' | 'equipment';
  level: AlertLevel;
  message: string;
  status: 'pending' | 'processing' | 'resolved';
  createdAt: string;
  handler?: string;
}

export interface FumigationPlan {
  id: string;
  batchId: string;
  warehouseId: string;
  agent: string;
  dosage: number;
  duration: number;
  reason: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'executing' | 'completed' | 'rejected';
  approvals: {
    warehouseMinister?: { approved: boolean; comment?: string; time?: string };
    qualityInspector?: { approved: boolean; comment?: string; time?: string };
  };
  createdAt: string;
  createdBy: string;
  startTime?: string;
  estimatedEndTime?: string;
  endTime?: string;
}

export interface QualityCheckResult {
  grade: { passed: boolean; expected: string; detected: string };
  moisture: { passed: boolean; expected: number; detected: number; threshold: number };
  pest: { passed: boolean; detected: number; threshold: number };
  impurity: { passed: boolean; detected: number; threshold: number };
  overallPassed: boolean;
  failedItem?: string;
}

export interface ProcurementSuggestion {
  id: string;
  variety: GrainVariety;
  quantity: number;
  currentStock: number;
  minStock: number;
  estimatedPrice: number;
  estimatedCost: number;
  reason: string;
  status: 'draft' | 'warehouse_approval' | 'finance_approval' | 'gm_approval' | 'approved' | 'rejected';
  approvals: {
    warehouse?: { approved: boolean; comment?: string; time?: string };
    finance?: { approved: boolean; comment?: string; time?: string };
    generalManager?: { approved: boolean; comment?: string; time?: string };
  };
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  type: EquipmentType;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'normal' | 'fault' | 'maintenance';
  runHours: number;
}

export interface MaintenanceOrder {
  id: string;
  equipmentId: string;
  type: 'inspection' | 'repair';
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'escalated';
  createdAt: string;
  deadline: string;
  assignee?: string;
  escalated: boolean;
}

export interface OutboundTaskItem {
  batchId: string;
  quantity: number;
  grade: GrainGrade;
  variety: GrainVariety;
  origin: string;
  warehouseId: string;
  position: string;
  qualityStatus?: 'unchecked' | 'passed' | 'failed';
  qualityResult?: QualityCheckResult;
}

export interface OutboundTask {
  id: string;
  code: string;
  items: OutboundTaskItem[];
  status: 'pending' | 'picking' | 'verifying' | 'completed' | 'exception';
  createdAt: string;
  exceptionReason?: string;
}

export interface QuarantineRecord {
  id: string;
  batchId: string;
  origin: string;
  variety: GrainVariety;
  grade: GrainGrade;
  warehouseId: string;
  outboundTaskId?: string;
  outboundTaskCode?: string;
  failedItems: string[];
  qualityDetail: QualityCheckResult;
  quarantineTime: string;
  processStatus: 'pending' | 'reinspect' | 'return' | 'disposed';
  processNote?: string;
  eTagId: string;
}

export interface StockCheckResult {
  canFullfill: boolean;
  requested: number;
  available: number;
  shortfall: number;
  matchedBatches: Array<{ batchId: string; quantity: number; origin: string }>;
  alternativeBatches: Array<{ batchId: string; variety: GrainVariety; quantity: number; origin: string; warehouseId: string }>;
}

export interface WarehouseRecommendation {
  warehouse: Warehouse;
  matchScore: number;
  remainingCapacity: number;
  historicalSuccess: number;
}
