import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Warehousing from "@/pages/Warehousing";
import Monitoring from "@/pages/Monitoring";
import Outbound from "@/pages/Outbound";
import Rotation from "@/pages/Rotation";
import Equipment from "@/pages/Equipment";
import { useGrainStore } from "@/store/grainStore";

function AppContent() {
  const updateSensorData = useGrainStore(s => s.updateSensorData);

  useEffect(() => {
    const interval = setInterval(() => {
      updateSensorData();
    }, 5000);
    return () => clearInterval(interval);
  }, [updateSensorData]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/warehousing" element={<Warehousing />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/outbound" element={<Outbound />} />
          <Route path="/rotation" element={<Rotation />} />
          <Route path="/equipment" element={<Equipment />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
