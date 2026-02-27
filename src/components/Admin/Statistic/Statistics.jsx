import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

import {
  MdCheckCircle,
  MdCancel,
  MdPauseCircleFilled,
  MdTrendingUp,
  MdEventBusy,
  MdWbSunny,
  MdBeachAccess,
  MdConstruction,
  MdGroups,
  MdSupervisorAccount,
  MdAdminPanelSettings
} from "react-icons/md";
import "./Statistics.css";

const Statistics = () => {
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;

  const [data, setData] = useState({
    gestionnaires: [],
    employees: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gestRes, empRes] = await Promise.all([
          fetch(`${API_ADMIN}/gestionnaires`),
          fetch(`${API_EMPLOYEE}/employees`)
        ]);

        const gestData = gestRes.ok ? await gestRes.json() : [];
        const empData = empRes.ok ? await empRes.json() : [];

        setData({
          gestionnaires: gestData,
          employees: empData.filter(e => e.role === "employé" || !e.role),
          loading: false
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [API_ADMIN, API_EMPLOYEE]);

  // --- Computed Stats ---
  const stats = useMemo(() => {
    const employees = data.employees;
    const managers = data.gestionnaires;

    const present = employees.filter(e => e.status === "Présent" || e.status === "Sortie").length;
    const absent = employees.filter(e => e.status === "Absent").length;
    const pending = employees.filter(e => e.status === "En attente" || !e.status).length;

    // Status Data for Pie Chart
    const statusData = [
      { name: 'Présents', value: present, color: '#10b981' },
      { name: 'Absents', value: absent, color: '#ef4444' },
      { name: 'En attente', value: pending, color: '#f59e0b' },
    ];

    // Supervisor distribution for Bar Chart
    const supervisors = managers.filter(m => m.role === 'superviseur');
    const supervisorDist = supervisors.map(sup => {
      const count = employees.filter(e => String(e.supervisorId) === String(sup.id)).length;
      return { name: sup.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 6);

    return {
  totalEmployees: employees.length,
  supervisorsCount: supervisors.length,
  responsablesCount: managers.filter(m => m.role === 'Responsable').length,
  present,
  absent,
  pending,
  supervisorDist,
  totalAbsences: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsAbsence) || 0), 0)),
  totalSundays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.totHrsDimanche) || 0), 0)),
  totalHolidays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsFeries) || 0), 0)),
  totalWorkedDays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsTravaillees) || 0), 0)),
  totalPaniers: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsPaniers) || 0), 0)),
  statusData // ✅ add this line
};
  }, [data]);

  if (data.loading) {
    return (
      <div className="stats-loading-wrapper">
        <div className="loader-ring"></div>
        <span>Chargement des analyses...</span>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="stats-dashboard">
      <div className="stats-header">
        <div>
          <h1>Tableau de Bord Analytique</h1>
          <p>Vue d'ensemble de la performance et des effectifs</p>
        </div>
        <div className="header-date">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- Top Row: Dynamic Cards --- */}
      <div className="stats-grid-top">
        <div className="stat-fancy-card primary">
          <div className="card-inner">
            <div className="card-info">
              <span className="label">Total Employés</span>
              <span className="number">{stats.totalEmployees}</span>
            </div>
            <div className="card-icon-blob"><MdGroups /></div>
          </div>
          <div className="card-footer">
            <MdTrendingUp /> <span>+2% vs mois dernier</span>
          </div>
        </div>

        <div className="stat-fancy-card purple">
          <div className="card-inner">
            <div className="card-info">
              <span className="label">Superviseurs</span>
              <span className="number">{stats.supervisorsCount}</span>
            </div>
            <div className="card-icon-blob"><MdSupervisorAccount /></div>
          </div>
          <div className="card-footer">Équipe d'encadrement</div>
        </div>

        <div className="stat-fancy-card blue">
          <div className="card-inner">
            <div className="card-info">
              <span className="label">Responsables</span>
              <span className="number">{stats.responsablesCount}</span>
            </div>
            <div className="card-icon-blob"><MdAdminPanelSettings /></div>
          </div>
          <div className="card-footer">Coordination de siège</div>
        </div>

        <div className="stat-fancy-card green">
          <div className="card-inner">
            <div className="card-info">
              <span className="label">Taux Présence</span>
              <span className="number">
                {stats.totalEmployees > 0
                  ? `${Math.round((stats.present / stats.totalEmployees) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="card-icon-blob"><MdCheckCircle /></div>
          </div>
          <div className="card-footer">Performance du jour</div>
        </div>
      </div>

      {/* --- Middle Row: Charts --- */}
      <div className="stats-charts-row">
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Répartition des Employés par Superviseur</h3>
            <p>Top 6 superviseurs par nombre d'effectifs</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.supervisorDist} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#colorBar)"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container small">
          <div className="chart-header">
            <h3>Statut de Pointage</h3>
            <p>Vue globale aujourd'hui</p>
          </div>
          <div className="chart-body center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={200}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Bottom Row: Secondary Stats --- */}
      {/* --- New Row: Detailed Activity Accumulators --- */}
      <div className="activity-summary-section">
        <div className="section-header">
          <h3>Résumé de l'Activité Globale</h3>
          <p>Cumul des indicateurs sur l'ensemble des chantiers</p>
        </div>
        <div className="activity-stats-grid">
          <div className="activity-stat-card">
            <div className="stat-icon red"><MdEventBusy /></div>
            <div className="stat-details">
              <h4>{stats.totalAbsences} Jrs</h4>
              <span>Absences Totales</span>
            </div>
          </div>
          <div className="activity-stat-card">
            <div className="stat-icon orange"><MdWbSunny /></div>
            <div className="stat-details">
              <h4>{stats.totalSundays} Hrs</h4>
              <span>Heures Dimanche</span>
            </div>
          </div>
          <div className="activity-stat-card">
            <div className="stat-icon cyan"><MdBeachAccess /></div>
            <div className="stat-details">
              <h4>{stats.totalHolidays} Jrs</h4>
              <span>Jours Fériés</span>
            </div>
          </div>
          <div className="activity-stat-card">
            <div className="stat-icon indigo"><MdConstruction /></div>
            <div className="stat-details">
              <h4>{stats.totalWorkedDays} Jrs</h4>
              <span>Points Travaillés</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;