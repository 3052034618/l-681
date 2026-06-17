import { create } from 'zustand';
import type { GrainBatch, Warehouse, Alert, Equipment, MaintenanceOrder, ProcurementSuggestion, OutboundTask, FumigationPlan, GrainVariety, WarehouseRecommendation, NewGrainBatch } from '@/types';
import { mockGrainBatches, mockWarehouses, mockAlerts, mockEquipment, mockMaintenanceOrders, mockProcurementSuggestions, mockOutboundTasks, mockFumigationPlans } from '@/data/mockData';

interface StoreState {
  grainBatches: GrainBatch[];
  warehouses: Warehouse[];
  alerts: Alert[];
  equipment: Equipment[];
  maintenanceOrders: MaintenanceOrder[];
  procurementSuggestions: ProcurementSuggestion[];
  outboundTasks: OutboundTask[];
  fumigationPlans: FumigationPlan[];
  currentTime: Date;

  addGrainBatch: (batch: NewGrainBatch) => string;
  updateSensorData: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  resolveAlert: (alertId: string, handler: string) => void;
  startVentilation: (alertId: string) => void;
  createFumigationFromAlert: (alertId: string) => void;
  startFumigationExecution: (planId: string) => void;
  completeFumigation: (planId: string) => void;
  recommendWarehouse: (variety: GrainVariety, weight: number) => WarehouseRecommendation[];
  createOutboundTask: (variety: GrainVariety, quantity: number) => OutboundTask;
  approveFumigation: (planId: string, role: 'warehouseMinister' | 'qualityInspector', comment: string, approved: boolean) => void;
  approveProcurement: (suggestionId: string, role: 'warehouse' | 'finance' | 'generalManager', comment: string, approved: boolean) => void;
  addMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id' | 'createdAt' | 'escalated'>) => void;
  escalateOrder: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  quarantineBatch: (batchId: string, reason: string) => void;
  advanceOutboundTask: (taskId: string, newStatus: OutboundTask['status']) => void;
}

export const useGrainStore = create<StoreState>((set, get) => ({
  grainBatches: mockGrainBatches,
  warehouses: mockWarehouses,
  alerts: mockAlerts,
  equipment: mockEquipment,
  maintenanceOrders: mockMaintenanceOrders,
  procurementSuggestions: mockProcurementSuggestions,
  outboundTasks: mockOutboundTasks,
  fumigationPlans: mockFumigationPlans,
  currentTime: new Date(),

  addGrainBatch: (batchData) => {
    const state = get();
    const seq = state.grainBatches.length + 1;
    const id = `B${new Date().getFullYear()}${String(seq).padStart(3, '0')}`;
    const eTagId = `ET-${String(seq).padStart(3, '0')}`;
    const newBatch: GrainBatch = {
      ...batchData,
      id,
      eTagId,
      temperature: batchData.temperature || 18,
      pestLevel: batchData.pestLevel || 0,
      status: batchData.status || 'normal',
    };
    set((state) => ({
      grainBatches: [...state.grainBatches, newBatch],
      warehouses: state.warehouses.map((w) =>
        w.id === batchData.warehouseId
          ? { ...w, usedCapacity: w.usedCapacity + batchData.weight, variety: batchData.variety }
          : w
      ),
    }));
    return eTagId;
  },

  updateSensorData: () => {
    set((state) => {
      const newWarehouses = state.warehouses.map((w) => {
        const tempDelta = (Math.random() - 0.5) * 0.8;
        const newTemp = Math.max(12, Math.min(35, w.avgTemp + tempDelta));
        return {
          ...w,
          avgTemp: Number(newTemp.toFixed(1)),
          sensors: w.sensors.map((s) => {
            const newVal = s.type === 'temperature'
              ? Number((newTemp + (Math.random() - 0.5) * 2).toFixed(1))
              : s.type === 'pest'
              ? Math.max(0, Math.min(15, s.value + (Math.random() > 0.7 ? 1 : Math.random() > 0.5 ? -1 : 0)))
              : Number((65 + (Math.random() - 0.5) * 5).toFixed(0));
            const isTempAlarm = s.type === 'temperature' && newVal > s.threshold;
            const isPestAlarm = s.type === 'pest' && newVal > s.threshold;
            const sensorStatus: 'normal' | 'offline' | 'alarm' = (isTempAlarm || isPestAlarm) ? 'alarm' : 'normal';
            return {
              ...s,
              value: newVal,
              status: sensorStatus,
              lastReading: new Date().toISOString(),
            };
          }),
        };
      });

      const newBatches = state.grainBatches.map((b) => {
        const w = newWarehouses.find((wh) => wh.id === b.warehouseId);
        return w ? { ...b, temperature: w.avgTemp } : b;
      });

      const newAlerts: Alert[] = [];
      newWarehouses.forEach((w) => {
        const tempSensor = w.sensors.find((s) => s.type === 'temperature');
        const pestSensor = w.sensors.find((s) => s.type === 'pest');
        if (tempSensor && tempSensor.status === 'alarm' && Math.random() > 0.85) {
          newAlerts.push({
            id: `A${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            warehouseId: w.id,
            type: 'temperature',
            level: tempSensor.value > 28 ? 'critical' : tempSensor.value > 25 ? 'danger' : 'warning',
            message: `${w.name}粮温异常，当前${tempSensor.value}℃`,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
        if (pestSensor && pestSensor.status === 'alarm' && Math.random() > 0.9) {
          newAlerts.push({
            id: `A${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            warehouseId: w.id,
            type: 'pest',
            level: pestSensor.value > 8 ? 'critical' : 'danger',
            message: `${w.name}虫害超标，当前${pestSensor.value}头/kg`,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
      });

      const newOrders = state.maintenanceOrders.map((o) => {
        if (o.status === 'pending' && new Date(o.deadline) < new Date() && !o.escalated) {
          return { ...o, escalated: true, status: 'escalated' as const };
        }
        return o;
      });

      return {
        warehouses: newWarehouses,
        grainBatches: newBatches,
        alerts: newAlerts.length > 0 ? [...newAlerts, ...state.alerts].slice(0, 50) : state.alerts,
        currentTime: new Date(),
        maintenanceOrders: newOrders,
      };
    });
  },

  addAlert: (alertData) => {
    const newAlert: Alert = {
      ...alertData,
      id: `A${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ alerts: [newAlert, ...state.alerts] }));
  },

  resolveAlert: (alertId, handler) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved', handler } : a
      ),
    }));
  },

  startVentilation: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'processing', handler: '通风处置中 · 王保管员' } : a
      ),
    }));
  },

  createFumigationFromAlert: (alertId) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert) return;
    const batch = state.grainBatches.find((b) => b.warehouseId === alert.warehouseId);
    const newPlan: FumigationPlan = {
      id: `FP${Date.now()}`,
      batchId: batch?.id || '',
      warehouseId: alert.warehouseId,
      agent: '磷化铝',
      dosage: 6,
      duration: 168,
      reason: alert.message,
      status: 'pending_approval',
      approvals: {},
      createdAt: new Date().toISOString(),
      createdBy: '王保管员',
    };
    set((state) => ({
      fumigationPlans: [newPlan, ...state.fumigationPlans],
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'processing', handler: '已提交熏蒸方案 · 王保管员' } : a
      ),
    }));
  },

  startFumigationExecution: (planId) => {
    const state = get();
    const plan = state.fumigationPlans.find((p) => p.id === planId);
    if (!plan || plan.status !== 'approved') return;
    const now = new Date();
    const estimatedEnd = new Date(now.getTime() + plan.duration * 3600000);
    set((state) => ({
      fumigationPlans: state.fumigationPlans.map((p) =>
        p.id === planId
          ? { ...p, status: 'executing', startTime: now.toISOString(), estimatedEndTime: estimatedEnd.toISOString() }
          : p
      ),
    }));
  },

  completeFumigation: (planId) => {
    const state = get();
    const plan = state.fumigationPlans.find((p) => p.id === planId);
    if (!plan || plan.status !== 'executing') return;
    const now = new Date();
    set((state) => ({
      fumigationPlans: state.fumigationPlans.map((p) =>
        p.id === planId ? { ...p, status: 'completed', endTime: now.toISOString() } : p
      ),
      grainBatches: state.grainBatches.map((b) =>
        b.warehouseId === plan.warehouseId ? { ...b, pestLevel: 0, status: 'normal' as const } : b
      ),
      warehouses: state.warehouses.map((w) =>
        w.id === plan.warehouseId
          ? {
              ...w,
              sensors: w.sensors.map((s) =>
                s.type === 'pest' ? { ...s, value: 0, status: 'normal' as const } : s
              ),
            }
          : w
      ),
      alerts: state.alerts.map((a) =>
        a.warehouseId === plan.warehouseId && a.type === 'pest' && a.status !== 'resolved'
          ? { ...a, status: 'resolved', handler: '熏蒸处置完成 · 王保管员' }
          : a
      ),
    }));
  },

  recommendWarehouse: (variety, weight) => {
    const state = get();
    const recommendations: WarehouseRecommendation[] = state.warehouses
      .filter((w) => w.capacity - w.usedCapacity >= weight)
      .map((w) => {
        let score = 0;
        if (!w.variety || w.variety === variety) score += 40;
        const capacityRatio = (w.capacity - w.usedCapacity) / w.capacity;
        score += capacityRatio * 30;
        if (w.avgTemp >= 15 && w.avgTemp <= 22) score += 20;
        else if (w.avgTemp < 25) score += 10;
        score += Math.random() * 10;
        return {
          warehouse: w,
          matchScore: Math.min(100, Math.round(score)),
          remainingCapacity: w.capacity - w.usedCapacity,
          historicalSuccess: 85 + Math.round(Math.random() * 15),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    return recommendations;
  },

  createOutboundTask: (variety, quantity) => {
    const state = get();
    const suitableBatches = state.grainBatches
      .filter((b) => b.variety === variety && b.status !== 'quarantined' && b.status !== 'outbound' && b.status !== 'warning')
      .sort((a, b) => new Date(a.inboundDate).getTime() - new Date(b.inboundDate).getTime());

    let remaining = quantity;
    const items: OutboundTask['items'] = [];
    for (const batch of suitableBatches) {
      if (remaining <= 0) break;
      const takeQty = Math.min(batch.weight, remaining);
      items.push({
        batchId: batch.id,
        quantity: takeQty,
        grade: batch.grade,
        variety: batch.variety,
        origin: batch.origin,
        warehouseId: batch.warehouseId,
        position: batch.position || '未指定',
      });
      remaining -= takeQty;
    }

    const task: OutboundTask = {
      id: `OT${Date.now()}`,
      code: `CK-${new Date().getFullYear()}-${String(state.outboundTasks.length + 1).padStart(3, '0')}`,
      items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ outboundTasks: [task, ...state.outboundTasks] }));
    return task;
  },

  approveFumigation: (planId, role, comment, approved) => {
    set((state) => ({
      fumigationPlans: state.fumigationPlans.map((p) => {
        if (p.id !== planId) return p;
        const newApprovals = {
          ...p.approvals,
          [role]: { approved, comment, time: new Date().toISOString() },
        };
        if (!approved) {
          return { ...p, approvals: newApprovals, status: 'rejected' as const };
        }
        const allApproved = newApprovals.warehouseMinister?.approved && newApprovals.qualityInspector?.approved;
        return {
          ...p,
          approvals: newApprovals,
          status: allApproved ? 'approved' : p.status,
        };
      }),
    }));
  },

  approveProcurement: (suggestionId, role, comment, approved) => {
    set((state) => ({
      procurementSuggestions: state.procurementSuggestions.map((s) => {
        if (s.id !== suggestionId) return s;
        const newApprovals = {
          ...s.approvals,
          [role]: { approved, comment, time: new Date().toISOString() },
        };
        if (!approved) return { ...s, approvals: newApprovals, status: 'rejected' };
        const statusMap: Record<string, ProcurementSuggestion['status']> = {
          warehouse: 'finance_approval',
          finance: 'gm_approval',
          generalManager: 'approved',
        };
        return { ...s, approvals: newApprovals, status: statusMap[role] || s.status };
      }),
    }));
  },

  addMaintenanceOrder: (orderData) => {
    const newOrder: MaintenanceOrder = {
      ...orderData,
      id: `MO${Date.now()}`,
      createdAt: new Date().toISOString(),
      escalated: false,
    };
    set((state) => ({ maintenanceOrders: [newOrder, ...state.maintenanceOrders] }));
  },

  escalateOrder: (orderId) => {
    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((o) =>
        o.id === orderId ? { ...o, escalated: true, status: 'escalated' } : o
      ),
    }));
  },

  completeOrder: (orderId) => {
    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'completed' } : o
      ),
    }));
  },

  quarantineBatch: (batchId, reason) => {
    set((state) => ({
      grainBatches: state.grainBatches.map((b) =>
        b.id === batchId ? { ...b, status: 'quarantined' } : b
      ),
      outboundTasks: state.outboundTasks.map((t) =>
        t.items.some((i) => i.batchId === batchId)
          ? { ...t, status: 'exception', exceptionReason: reason }
          : t
      ),
    }));
  },

  advanceOutboundTask: (taskId, newStatus) => {
    const state = get();
    const task = state.outboundTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (newStatus === 'completed' && task.status !== 'completed') {
      const batchUpdates = new Map<string, number>();
      task.items.forEach((item) => {
        const current = batchUpdates.get(item.batchId) || 0;
        batchUpdates.set(item.batchId, current + item.quantity);
      });

      const warehouseUpdates = new Map<string, number>();
      task.items.forEach((item) => {
        const current = warehouseUpdates.get(item.warehouseId) || 0;
        warehouseUpdates.set(item.warehouseId, current + item.quantity);
      });

      set((state) => ({
        outboundTasks: state.outboundTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
        grainBatches: state.grainBatches.map((b) => {
          const deduct = batchUpdates.get(b.id) || 0;
          if (deduct > 0) {
            const newWeight = Math.max(0, b.weight - deduct);
            return {
              ...b,
              weight: newWeight,
              status: newWeight <= 0 ? 'outbound' as const : b.status,
            };
          }
          return b;
        }),
        warehouses: state.warehouses.map((w) => {
          const deduct = warehouseUpdates.get(w.id) || 0;
          if (deduct > 0) {
            return { ...w, usedCapacity: Math.max(0, w.usedCapacity - deduct) };
          }
          return w;
        }),
      }));
    } else {
      set((state) => ({
        outboundTasks: state.outboundTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      }));
    }
  },
}));
