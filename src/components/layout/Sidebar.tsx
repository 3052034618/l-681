import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, Thermometer, Truck, ArrowLeftRight, Wrench, Warehouse } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页大屏' },
  { to: '/warehousing', icon: PackagePlus, label: '入库管理' },
  { to: '/monitoring', icon: Thermometer, label: '实时监控' },
  { to: '/outbound', icon: Truck, label: '出库管理' },
  { to: '/rotation', icon: ArrowLeftRight, label: '库存轮换' },
  { to: '/equipment', icon: Wrench, label: '设备管理' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-bg-dark border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wheat to-wheat-600 flex items-center justify-center">
            <Warehouse className="w-6 h-6 text-bg-dark" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-gradient">智慧粮仓</h1>
            <p className="text-xs text-gray-500">仓储管理系统</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-wheat/10 text-wheat border border-wheat/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-bg-light'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-sm font-semibold">
            王
          </div>
          <div>
            <p className="text-sm font-medium">王保管员</p>
            <p className="text-xs text-gray-500">一号库区</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
