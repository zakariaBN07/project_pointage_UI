import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  MdCheckCircle, MdCancel, MdPauseCircleFilled, MdTrendingUp,
  MdEventBusy, MdWbSunny, MdBeachAccess, MdConstruction,
  MdGroups, MdSupervisorAccount, MdAdminPanelSettings,
  MdPeople, MdTimeline, MdRefresh, MdCalendarToday,
  MdArrowUpward, MdArrowDownward, MdMoreVert, MdDownload,
  MdPerson, MdWork, MdAssignment, MdAttachMoney
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

  const [timeRange, setTimeRange] = useState('week');
  const [selectedView, setSelectedView] = useState('overview');

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

  // Generate mock timeline data for charts
  const generateTimelineData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map(day => ({
      name: day,
      présents: Math.floor(Math.random() * 30) + 20,
      absents: Math.floor(Math.random() * 10) + 5,
      retards: Math.floor(Math.random() * 8) + 2
    }));
  };

  // --- Computed Stats ---
  const stats = useMemo(() => {
    const employees = data.employees;
    const managers = data.gestionnaires;

    const present = employees.filter(e => e.status === "Présent" || e.status === "Sortie").length;
    const absent = employees.filter(e => e.status === "Absent").length;
    const pending = employees.filter(e => e.status === "En attente" || !e.status).length;
    const late = employees.filter(e => e.status === "En retard").length;

    // Status Data for Pie Chart
    const statusData = [
      { name: 'Présents', value: present, color: '#10b981', icon: '✅' },
      { name: 'Absents', value: absent, color: '#ef4444', icon: '❌' },
      { name: 'En attente', value: pending, color: '#f59e0b', icon: '⏳' },
      { name: 'En retard', value: late, color: '#f97316', icon: '⚠️' },
    ];

    // Supervisor distribution for Bar Chart
    const supervisors = managers.filter(m => m.role === 'superviseur');
    const supervisorDist = supervisors.map(sup => {
      const count = employees.filter(e => String(e.supervisorId) === String(sup.id)).length;
      return { name: sup.name, count, productivity: Math.floor(Math.random() * 30) + 70 };
    }).sort((a, b) => b.count - a.count).slice(0, 6);

    // Department distribution
    const departments = [...new Set(employees.map(e => e.department || 'Non assigné'))];
    const deptData = departments.map(dept => ({
      name: dept,
      value: employees.filter(e => (e.department || 'Non assigné') === dept).length
    }));

    // Monthly trends (mock data)
    const monthlyTrends = [
      { month: 'Jan', employés: 45, présences: 38, absences: 7 },
      { month: 'Fév', employés: 48, présences: 42, absences: 6 },
      { month: 'Mar', employés: 52, présences: 45, absences: 7 },
      { month: 'Avr', employés: 55, présences: 48, absences: 7 },
      { month: 'Mai', employés: 58, présences: 50, absences: 8 },
      { month: 'Juin', employés: 60, présences: 52, absences: 8 },
    ];

    // Calculate performance metrics
    const attendanceRate = employees.length > 0 
      ? Math.round((present / employees.length) * 100) 
      : 0;
    
    const previousAttendanceRate = attendanceRate - Math.floor(Math.random() * 8) + 2;
    const attendanceTrend = attendanceRate - previousAttendanceRate;

    return {
      totalEmployees: employees.length,
      supervisorsCount: supervisors.length,
      responsablesCount: managers.filter(m => m.role === 'Responsable').length,
      present,
      absent,
      pending,
      late,
      supervisorDist,
      deptData,
      monthlyTrends,
      timelineData: generateTimelineData(),
      totalAbsences: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsAbsence) || 0), 0)),
      totalSundays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.totHrsDimanche) || 0), 0)),
      totalHolidays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsFeries) || 0), 0)),
      totalWorkedDays: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsTravaillees) || 0), 0)),
      totalPaniers: Math.round(employees.reduce((acc, e) => acc + (parseFloat(e.nbrJrsPaniers) || 0), 0)),
      statusData,
      attendanceRate,
      attendanceTrend,
      averageProductivity: Math.floor(Math.random() * 15) + 75,
    };
  }, [data]);

  if (data.loading) {
    return (
      <div className="modern-loading-container">
        <div className="modern-loader">
          <div className="loader-spinner"></div>
          <div className="loader-spinner secondary"></div>
          <div className="loader-spinner tertiary"></div>
        </div>
        <div className="loading-text">
          Chargement des données analytiques
          <span>.</span><span>.</span><span>.</span>
        </div>
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
          <span>Préparation du tableau de bord...</span>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#f97316'];

  return (
    <div className="modern-dashboard">
      {/* Enhanced Header with Glassmorphism */}
      <div className="dashboard-header glass-effect">
        <div className="header-left">
          <div className="header-title">
            <h1>
              <span className="gradient-text">Analytics Dashboard</span>
            </h1>
            <p>Aperçu complet des performances et des effectifs</p>
          </div>
          <div className="header-badges">
            <span className="badge live">
              <span className="live-dot"></span>
              Live
            </span>
            <span className="badge">
              Mis à jour à l'instant
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="date-range-selector">
            <button 
              className={`range-btn ${timeRange === 'day' ? 'active' : ''}`}
              onClick={() => setTimeRange('day')}
            >
              Jour
            </button>
            <button 
              className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Semaine
            </button>
            <button 
              className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Mois
            </button>
            <button 
              className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Année
            </button>
          </div>
          
          <div className="header-actions">
            <div className="date-display">
              <MdCalendarToday className="icon" />
              <span>{new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            <button className="action-button refresh">
              <MdRefresh className="icon" />
            </button>
            
            <button className="action-button download">
              <MdDownload className="icon" />
            </button>
            
            <button className="action-button menu">
              <MdMoreVert className="icon" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards with Modern Design */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <MdGroups className="card-icon" />
            </div>
            <div className="card-trend positive">
              <MdArrowUpward className="trend-icon" />
              <span>+12%</span>
            </div>
          </div>
          <div className="card-content">
            <h3 className="card-value">{stats.totalEmployees}</h3>
            <p className="card-label">Employés Actifs</p>
          </div>
          <div className="card-footer">
            <span className="footer-text">vs mois dernier</span>
            <div className="progress-indicator">
              <div className="progress-bar" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <MdCheckCircle className="card-icon" />
            </div>
            <div className="card-trend positive">
              <MdArrowUpward className="trend-icon" />
              <span>+5%</span>
            </div>
          </div>
          <div className="card-content">
            <h3 className="card-value">{stats.attendanceRate}%</h3>
            <p className="card-label">Taux de Présence</p>
          </div>
          <div className="card-footer">
            <span className="footer-text">{stats.present} employés présents</span>
            <div className="mini-chart">
              <span className="dot present"></span>
              <span className="dot absent"></span>
              <span className="dot late"></span>
            </div>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <MdSupervisorAccount className="card-icon" />
            </div>
            <div className="card-trend negative">
              <MdArrowDownward className="trend-icon" />
              <span>-2%</span>
            </div>
          </div>
          <div className="card-content">
            <h3 className="card-value">{stats.supervisorsCount}</h3>
            <p className="card-label">Superviseurs</p>
          </div>
          <div className="card-footer">
            <span className="footer-text">Ratio 1:15</span>
            <div className="badge">Optimal</div>
          </div>
        </div>

        <div className="kpi-card info">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <MdTimeline className="card-icon" />
            </div>
            <div className="card-trend positive">
              <MdArrowUpward className="trend-icon" />
              <span>+8%</span>
            </div>
          </div>
          <div className="card-content">
            <h3 className="card-value">{stats.averageProductivity}%</h3>
            <p className="card-label">Productivité</p>
          </div>
          <div className="card-footer">
            <span className="footer-text">Objectif: 85%</span>
            <div className="progress-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${stats.averageProductivity}, 100`}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Main Chart - Attendance Trend */}
        <div className="chart-card main-chart">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Tendance de Présence</h3>
              <p>Évolution sur les 7 derniers jours</p>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color present"></span>
                <span>Présents</span>
              </div>
              <div className="legend-item">
                <span className="legend-color absent"></span>
                <span>Absents</span>
              </div>
              <div className="legend-item">
                <span className="legend-color late"></span>
                <span>Retards</span>
              </div>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="présents" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="absents" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorAbsent)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="retards" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorLate)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="chart-card pie-chart">
          <div className="chart-header">
            <h3>Distribution des Statuts</h3>
            <p>État actuel des effectifs</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="status-summary">
              {stats.statusData.map((item, index) => (
                <div key={index} className="status-item">
                  <div className="status-info">
                    <span className="status-dot" style={{ backgroundColor: item.color }}></span>
                    <span className="status-name">{item.name}</span>
                  </div>
                  <span className="status-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supervisor Distribution */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Répartition par Superviseur</h3>
              <p>Nombre d'employés par équipe</p>
            </div>
            <div className="chart-actions">
              <button className="chart-action active">Effectifs</button>
              <button className="chart-action">Performance</button>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.supervisorDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Summary Grid */}
      <div className="activity-grid">
        <div className="activity-section">
          <div className="section-header">
            <h3>Résumé d'Activité</h3>
            <p>Indicateurs cumulés sur tous les chantiers</p>
          </div>
          
          <div className="activity-cards">
            <div className="activity-card">
              <div className="activity-icon absent">
                <MdEventBusy />
              </div>
              <div className="activity-details">
                <span className="activity-value">{stats.totalAbsences}</span>
                <span className="activity-label">Jours d'absence</span>
              </div>
              <div className="activity-trend negative">+3%</div>
            </div>

            <div className="activity-card">
              <div className="activity-icon sunday">
                <MdWbSunny />
              </div>
              <div className="activity-details">
                <span className="activity-value">{stats.totalSundays}</span>
                <span className="activity-label">Heures dimanche</span>
              </div>
              <div className="activity-trend positive">+8%</div>
            </div>

            <div className="activity-card">
              <div className="activity-icon holiday">
                <MdBeachAccess />
              </div>
              <div className="activity-details">
                <span className="activity-value">{stats.totalHolidays}</span>
                <span className="activity-label">Jours fériés</span>
              </div>
              <div className="activity-trend neutral">=</div>
            </div>

            <div className="activity-card">
              <div className="activity-icon worked">
                <MdConstruction />
              </div>
              <div className="activity-details">
                <span className="activity-value">{stats.totalWorkedDays}</span>
                <span className="activity-label">Jours travaillés</span>
              </div>
              <div className="activity-trend positive">+12%</div>
            </div>

            <div className="activity-card">
              <div className="activity-icon panier">
                <MdAttachMoney />
              </div>
              <div className="activity-details">
                <span className="activity-value">{stats.totalPaniers}</span>
                <span className="activity-label">Paniers repas</span>
              </div>
              <div className="activity-trend positive">+5%</div>
            </div>

            <div className="activity-card">
              <div className="activity-icon assignment">
                <MdAssignment />
              </div>
              <div className="activity-details">
                <span className="activity-value">24</span>
                <span className="activity-label">Assignations</span>
              </div>
              <div className="activity-trend positive">+15%</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="quick-stats-panel">
          <div className="panel-header">
            <h4>Statistiques Rapides</h4>
            <MdMoreVert className="panel-menu" />
          </div>
          
          <div className="stats-list">
            <div className="stat-row">
              <span className="stat-name">Taux d'absentéisme</span>
              <div className="stat-bar-container">
                <div className="stat-bar" style={{ width: '12%' }}></div>
              </div>
              <span className="stat-percentage">12%</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-name">Productivité moyenne</span>
              <div className="stat-bar-container">
                <div className="stat-bar" style={{ width: '78%' }}></div>
              </div>
              <span className="stat-percentage">78%</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-name">Rotation du personnel</span>
              <div className="stat-bar-container">
                <div className="stat-bar" style={{ width: '8%' }}></div>
              </div>
              <span className="stat-percentage">8%</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-name">Satisfaction</span>
              <div className="stat-bar-container">
                <div className="stat-bar" style={{ width: '92%' }}></div>
              </div>
              <span className="stat-percentage">92%</span>
            </div>
          </div>
          
          <div className="panel-footer">
            <div className="metric">
              <span className="metric-label">Objectif mensuel</span>
              <span className="metric-value">85% atteint</span>
            </div>
            <div className="metric-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;