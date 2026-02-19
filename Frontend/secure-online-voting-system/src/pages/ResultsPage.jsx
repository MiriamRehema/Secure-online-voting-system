import { useState, useEffect } from 'react';
import jkuatLogo from '../assets/jkuat-logo.png';
import  Footer  from '../components/Footer';

const ResultsPage = ({ onBack, onLogout }) => {
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({ 
        totalVotes: 0, 
        turnout: 0, 
        eligible: 500 
    });
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchResults();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchResults = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('http://localhost:5000/api/results');
            const data = await response.json();
            if (response.ok) {
                const sorted = data.results.sort((a, b) => b.votes - a.votes);
                setResults(sorted);
                setStats({
                    totalVotes: data.total_votes,
                    turnout: data.turnout,
                    eligible: data.eligible_voters
                });
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.log('Using demo results');
            const demoResults = [
                { candidate_id: 1, name: 'Alice Wanjiku', votes: 52 },
                { candidate_id: 2, name: 'Brian Otieno', votes: 48 },
                { candidate_id: 3, name: 'Catherine Nyambura', votes: 61 },
                { candidate_id: 4, name: 'David Kipchoge', votes: 39 },
            ];
            const totalVotes = demoResults.reduce((sum, r) => sum + r.votes, 0);
            const resultsWithPercentage = demoResults
                .map(r => ({
                    ...r,
                    percentage: ((r.votes / totalVotes) * 100).toFixed(1)
                }))
                .sort((a, b) => b.votes - a.votes);

            setResults(resultsWithPercentage);
            setStats({ 
                totalVotes, 
                turnout: ((totalVotes / 500) * 100).toFixed(1), 
                eligible: 500 
            });
            setLastUpdated(new Date());
        }
        setIsRefreshing(false);
    };

    const winner = results.length > 0 ? results[0] : null;

    return (
        <div className="voting-system">
            <div className="container">
                
                
                <div className="page-header">
                    <img 
                        src={jkuatLogo} 
                        alt="JKUAT Logo" 
                        className="jkuat-logo-img"
                    />
                    <h1>JKUAT Secure Voting System</h1>
                    <p className="subtitle">Live Election Results</p>
                </div>

                <div className="card wide-card">
                    
                    <div className="card-header">
                        
                        <div>
                            <h2>Live Election Results</h2>
                            <div className="live-indicator">
                                <span className="live-text">
                                    LIVE - Auto-updating every 5 seconds
                                </span>
                                {isRefreshing && (
                                    <span className="refreshing-text">
                                        Refreshing...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    
                    {winner && (
                        <div className="winner-banner">
                            
                            <div className="winner-label">CURRENT LEADER</div>
                            <div className="winner-name">{winner.name}</div>
                            <div className="winner-votes">
                                {winner.votes} votes ({winner.percentage}%)
                            </div>
                        </div>
                    )}

                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalVotes}</div>
                            <div className="stat-label">Total Votes</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.turnout}%</div>
                            <div className="stat-label">Voter Turnout</div>
                            <div className="stat-sublabel">of {stats.eligible} eligible</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.eligible}</div>
                            <div className="stat-label">Eligible Voters</div>
                        </div>
                    </div>

                    <h3 className="section-title">Vote Distribution</h3>

                    
                    <div className="results-container">
                        {results.map((result, index) => (
                            <div 
                                key={result.candidate_id} 
                                className={`result-item ${index === 0 ? 'result-winner' : ''}`}
                            >
                                <div className="result-header">
                                    <div className="result-candidate">
                                        <div className={`result-position ${index === 0 ? 'position-winner' : ''}`}>
                                            {index === 0 ? '1' : index + 1}
                                        </div>
                                        <span className="result-name">{result.name}</span>
                                    </div>
                                    <div className="result-vote-count">
                                        <div className="result-votes">{result.votes}</div>
                                        <div className="result-votes-label">votes</div>
                                    </div>
                                </div>

                                <div className="progress-bar">
                                    <div 
                                        className={`progress-fill ${index === 0 ? 'progress-winner' : 'progress-runner'}`}
                                        style={{ width: `${result.percentage}%` }}
                                    >
                                        {result.percentage}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    
                    <div className="status-bar">
                        <div className="status-item">
                            <span>Last Updated:</span>
                            <strong>{lastUpdated.toLocaleTimeString()}</strong>
                        </div>
                        <div className="status-item">
                            <span>Next Refresh:</span>
                            <strong>In 5 seconds</strong>
                        </div>
                        <div className="status-item">
                            <span>Status:</span>
                            <strong className="active">Live</strong>
                        </div>
                    </div>
                    
                    <div className="button-group">
                    <button className="btn btn-secondary" onClick={onBack}>
                         Back to Voting
                    </button>
                    <button className="btn btn-danger" onClick={onLogout}>
                         Logout
                    </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResultsPage;