import React, { useState, useEffect } from 'react';

const ResultsPage = ({ onBack, onLogout }) => {
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({ totalVotes: 0, turnout: 0, eligible: 500 });

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/results');
            const data = await response.json();

            if (response.ok) {
                setResults(data.results);
                setStats({
                    totalVotes: data.total_votes,
                    turnout: data.turnout,
                    eligible: data.eligible_voters
                });
            }
        } catch (error) {
            console.error('Error fetching results:', error);

            setResults([
                { candidate_id: 1, name: 'Candidate A', votes: 52, percentage: 26 },
                { candidate_id: 2, name: 'Candidate B', votes: 48, percentage: 24 },
                { candidate_id: 3, name: 'Candidate C', votes: 61, percentage: 30.5 },
                { candidate_id: 4, name: 'Candidate D', votes: 39, percentage: 19.5 },
            ]);
            setStats({ totalVotes: 200, turnout: 40, eligible: 500 });
        }
    };

    return (
        <div className="voting-system">
            <div className="bg-animation" />

            <div className="container">
                <header className="header">
                    <div className="logo-container">
                        <img src={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logi-img"/>
                    </div>
                    <h1>JKUAT Secure Voting System</h1>
                    <p className="subtitle">Election Results</p>
                </header>

                <div className="screen-container">
                    <div className="card">
                        <div className="card-header">
                            <h2>Election Results</h2>
                        </div>

                        <div className="info-panel">
                            <h3>Live Results - JKUSA Election</h3>
                            <p>Real-time vote tallying. All votes are encrypted and anonymized.</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalVotes}</div>
                                <div className="stat-label">Total Votes</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.turnout}%</div>
                                <div className="stat-label">Voter Turnout</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.eligible}</div>
                                <div className="stat-label">Eligible Voters</div>
                            </div>
                        </div>

                        <h3 className="section-title">Vote Distribution</h3>

                        <div className="results-container">
                            {results.map((result) => (
                                <div key={result.candidate_id} className="result-item">
                                    <div className="result-header">
                                        <span className="result-name">{result.name}</span>
                                        <span className="result-votes">{result.votes}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${result.percentage}%` }}>
                                            {result.percentage}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="status-bar">
                            <div className="status-item">
                                <span>Last Updated:</span>
                                <strong>{new Date().toLocaleTimeString()}</strong>
                            </div>

                        </div>

                        <button className="btn btn-secondary" onClick={onBack}>
                            Back to Voting
                        </button>

                        <button className="btn btn-danger" onClick={onLogout}>
                            Logout
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ResultsPage;