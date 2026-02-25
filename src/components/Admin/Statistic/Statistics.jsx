import React, { useState, useEffect } from "react";
import { MdHome, MdGroups, MdSupervisorAccount, MdAdminPanelSettings } from "react-icons/md";
import { FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import "./Statistics.css";

const Statistics = () => {
  const API_ADMIN = import.meta.env.VITE_APP_API_ADMIN_URL;
  const API_EMPLOYEE = import.meta.env.VITE_APP_API_EMPLOYEE_URL;

  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSupervisors: 0,
    totalResponsables: 0,
    presentToday: 0,
    absentToday: 0,
    enAttente: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_ADMIN}/gestionnaires`);
        const rawData = response.ok ? await response.json() : [];
        const gestData = rawData.map(({ password, ...rest }) => rest);

        const empResponse = await fetch(`${API_EMPLOYEE}/employees`);
        const empData = empResponse.ok ? await empResponse.json() : [];

        const supervisors = gestData.filter(g => g.role?.toLowerCase() === "superviseur").length;
        const responsables = gestData.filter(g => g.role?.toLowerCase() === "responsable").length;

        const employees = empData.filter(e => e.role === "employé" || !e.role);
        const totalEmployees = employees.length;
        const present = employees.filter(e => e.status === "Présent" || e.status === "Sortie").length;
        const absent = employees.filter(e => e.status === "Absent").length;
        const enAttente = employees.filter(e => e.status === "En attente" || !e.status).length;

        setStats({
          totalEmployees,
          totalSupervisors: supervisors,
          totalResponsables: responsables,
          presentToday: present,
          absentToday: absent,
          enAttente,
          loading: false
        });
      } catch (error) {
        console.error(error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [API_ADMIN, API_EMPLOYEE]);

  if (stats.loading) {
    return <div className="stats-loading">Loading statistics...</div>;
  }

  const cards = [
    { title: "Home", value: "Overview", icon: <MdHome />, subtle: true },
    { title: "Total Employees", value: stats.totalEmployees, icon: <MdGroups /> },
    { title: "Supervisors", value: stats.totalSupervisors, icon: <MdSupervisorAccount /> },
    { title: "Responsables", value: stats.totalResponsables, icon: <MdAdminPanelSettings /> },
    { title: "Present Today", value: stats.presentToday, icon: <FiCheckCircle />, success: true },
    { title: "Absent Today", value: stats.absentToday, icon: <FiXCircle />, danger: true },
    { title: "Pending", value: stats.enAttente, icon: <FiClock />, warning: true }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of employee statistics</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card, index) => (
          <div key={index} className="dashboard-card">
            <div className="card-top">
              <div className="card-icon">{card.icon}</div>
              <span className="card-title">{card.title}</span>
            </div>
            <div className="card-value">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Statistics;