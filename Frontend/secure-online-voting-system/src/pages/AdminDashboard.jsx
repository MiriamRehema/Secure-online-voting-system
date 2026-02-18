import React, { useState, useEffect } from 'react';
import  Footer  from '../components/Footer';

const STATES = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  COUNTED: 'COUNTED',
  STORED: 'STORED',
  PUBLISHED: 'PUBLISHED'
};

const AdminDashboard = ({ user, onLogout }) => {
  const [phase, setPhase] = useState(STATES.IDLE);
  const [stats, setStats] = useState({
    totalVotes: 0,
    turnout: 0,
    activeSessions: 0,
    verifiedVotes: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
        setPhase(data.phase || STATES.IDLE);
      }
    } catch {
      // demo fallback
      setStats({ totalVotes: 200, turnout: 40, activeSessions: 5, verifiedVotes: 200 });
      setPhase(STATES.ACTIVE);
    }
  };

  const confirm = (msg) => window.confirm(msg);

  const startSession = async () => {
    if (!confirm('Start voting session?')) return;
    try {
     await fetch('http://localhost:8000/api/admin/start-session', { method: 'POST' });
    } finally {
      setPhase(STATES.ACTIVE);
    }
  };

  const endSession = async () => {
    if (!confirm('End voting session? No more votes will be accepted.')) return;
    try {
        await new Promise(r => setTimeout(r, 600))
      /*await fetch('http://localhost:8000/api/admin/end-session', { method: 'POST' });*/
    } finally {
      setPhase(STATES.ENDED);
    }
  };

  const retrieveVotes = async () => {
    await fetchAdminStats();
  };

  const countVotes = () => {
    if (!confirm('Process and count all votes?')) return;
    setPhase(STATES.COUNTED);
  };

  const storeResults = async () => {
    if (!confirm('Store final tally results? This locks the counted votes.')) return;
    try {
      /*await fetch('http://localhost:8000/api/admin/store-results', { method: 'POST' });*/
    } finally {
      setPhase(STATES.STORED);
    }
  };

  const publishResults = async () => {
    if (!confirm('Publish election results? This action is public and irreversible.')) return;
    try {
     /* await fetch('http://localhost:8000/api/admin/publish-results', { method: 'POST' });*/
    } finally {
      setPhase(STATES.PUBLISHED);
    }
  };

  const PhaseBadge = () => (
    <div className={`phase-badge ${phase.toLowerCase()}`}>
      Phase: <strong>{phase}</strong>
    </div>
  );

  return (
    <div className="voting-system">
      <div className="container">
        <div className="top-bar">
            <button className="logout-btn" onClick={onLogout}>
                Logout
            </button>
        </div>
        <header className="page-header">
          <div className="logo-container">
            <img src={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logo-img" />
          </div>
          <h1>JKUAT Secure Voting System</h1>
          <p className="subtitle">Admin Dashboard</p>
        </header>

        <div className="card wide-card">
          <PhaseBadge />

          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalVotes}</div>
              <div className="stat-label">Votes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.turnout}%</div>
              <div className="stat-label">Turnout</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.activeSessions}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.verifiedVotes}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>

          
          <div className="workflow-grid">
            <div className="button-group">
            <section>
              <h3>Voting</h3>
              <button className="btn btn-primary" disabled={phase !== STATES.IDLE} onClick={startSession}>
                Start Session
              </button>
              <button className="btn btn-secondary" disabled={phase !== STATES.ACTIVE} onClick={endSession}>
                End Session
              </button>
            </section>

            <section>
              <h3>Counting</h3>
              <button className="btn btn-secondary" disabled={phase !== STATES.ENDED} onClick={retrieveVotes}>
                Retrieve Votes
              </button>
              <button className="btn btn-secondary" disabled={phase !== STATES.ENDED} onClick={countVotes}>
                Count Votes
              </button>
            </section>

            <section>
              <h3>Finalization</h3>
              <button className="btn btn-secondary" disabled={phase !== STATES.COUNTED} onClick={storeResults}>
                Store Tally
              </button>
              <button className="btn btn-primary" disabled={phase !== STATES.STORED} onClick={publishResults}>
                Publish Results
              </button>
            </section>
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;


