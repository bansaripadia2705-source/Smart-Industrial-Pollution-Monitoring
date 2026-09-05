import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import AirQuality from './pages/AirQuality';
import WaterQuality from './pages/WaterQuality';
import Industries from './pages/Industries';
import Sensors from './pages/Sensors';
import Violations from './pages/Violations';
import Alerts from './pages/Alerts';
import HealthRisk from './pages/HealthRisk';
import PollutionMap from './pages/PollutionMap';
import Analytics from './pages/Analytics';
import AIReports from './pages/AIReports';
import AgentMonitoring from './pages/AgentMonitoring';
import Settings from './pages/Settings';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="live"       element={<LiveMonitoring />} />
        <Route path="air"        element={<AirQuality />} />
        <Route path="water"      element={<WaterQuality />} />
        <Route path="industries" element={<Industries />} />
        <Route path="sensors"    element={<Sensors />} />
        <Route path="violations" element={<Violations />} />
        <Route path="alerts"     element={<Alerts />} />
        <Route path="health"     element={<HealthRisk />} />
        <Route path="map"        element={<PollutionMap />} />
        <Route path="analytics"  element={<Analytics />} />
        <Route path="reports"    element={<AIReports />} />
        <Route path="agents"     element={<AgentMonitoring />} />
        <Route path="settings"   element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
