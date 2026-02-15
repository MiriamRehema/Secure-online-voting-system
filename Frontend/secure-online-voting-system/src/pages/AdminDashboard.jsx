import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ user, onLogout }) => {
    const [votingSessionActive, setVotingSessionActive] =useState(false);
    const [stats, setStats] = useState({
        totalVotes: 0,
        turnout: 0,
        activeSessions: 0,
        verifiedVotes: 0
    });

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats =async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/stats');
            const data = await response.json();
            if (response.ok) setStats(data);
        } catch (error) {
            console.error('Error:', error);
            //Demo data
            setStats({ totalVotes: 200, turnout: 40, activeSessions: 5, verifiedVotes: 200});
        }
    };

    const handleStartSession = async () => {
        try {
            await fetch('http://localhost:8000/api/admin/start-session', {
                method: 'POST'
            });
            setVotingSessionActive(true);
            alert('Voting session started!');
        } catch (error) {
            setVotingSessionActive(true);
            alert('Voting session started (Demo)');
        }
    };

    const handleMonitor = () => {
        fetchAdminStats();
        alert('Monitoring updated');
    };

    const handleEndSession = async () => {
        try {
            await fetch('http://localhost:8000/api/admin/end-session', {
                method: 'POST'
            });
            setVotingSessionActive(false);
            alert('Voting session ended.')
        } catch (error) {
            setVotingSessionActive(false);
            alert('Voting session ended. (Demo');
        }
    };

    const handleRetrieveVotes = async () => {
        await fetchAdminStats();
        alert('All votes retrieved!')
    };

    const handleCountVotes = () => {
        alert('Votes counted and processed!')
    };

    const handleStoreResults = () => {
        alert('Final tally results stored!')
    };

    const handlePublishResults = () => {
        alert('Results published successfully!')
    };

    return (
        <div className="voting-system">
            <div className="bg-animation">

                <div className="container">
                    <header className="header">
                        <div className="logo-container">
                            <div className="jkuat-logo">JK</div>
                        </div>
                        <h1>JKUAT Secure Voting System</h1>
                        <p className="subtitle">Admin Dashboard</p>
                    </header>

                    <div className="screen-container">
                        <div className="card">
                            <div className="card-header">
                                <h2>Admin Dashboard</h2>
                            </div>

                            <div className="info-panel">
                                <h3>Election Management Console</h3>
                                <p>Monitor voting sessions, retrieve votes, process results, and publish final tallies</p>
                            </div>

                            <div className="stats-grid">
                                <div className="stats-card">
                                    <div className="stat-value">{stats.totalVotes}</div>
                                    <div className="stat-label">Votes Recorded</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{stats.turnout}</div>
                                    <div className="stat-label">Turnout Rate</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{stats.activeSessions}</div>
                                    <div className="stat-label">Active Sessions</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{stats.verifiedVotes}</div>
                                    <div className="stat-label">Verified Votes</div>
                                </div>
                            </div>

                            <h3 className="section-title">Admin Actions</h3>

                            <button className="btn btn-primary" onClick={handleStartSession}>
                                Start Voting Session
                            </button>

                            <button className="btn btn-secondary" onClick={handleMonitor}>
                                Monitor Voting Process
                            </button>

                            <button className="btn btn-secondary" onClick={handleEndSession}>
                                End Voting Session
                            </button>

                            <button className="btn btn-secondary" onClick={handleRetrieveVotes}>
                                Retrieve All Votes
                            </button>

                            <button className="btn btn-secondary" onClick={handleCountVotes}>
                                Process / Count Votes
                            </button>

                            <button className="btn btn-secondary" onClick={handleStoreResults}>
                                Store Final Tally Results
                            </button>

                            <button className="btn btn-primary" onClick={handlePublishResults}>
                                Publish Results
                            </button>

                            <button className="btn btn-danger" onClick={onLogout}>
                                Logout
                            </button>

                            {votingSessionActive && (
                                <div className="status-bar">
                                    <div className="status-item">
                                        <span>Voting Status:</span>
                                        <strong className="active">ACTIVE</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;