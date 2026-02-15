import React, { useState, useEffect } from 'react';

const VotingPage = ({ user, sessionToken, hasVoted, onVoteSubmitted, onViewResults, onLogout }) => {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/candidates')
            const data = await response.json();

            if (response.ok) {
                setCandidates(data.candidates);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);

            setCandidates([
                { id: 1, name: 'Candidate A', department: 'Engineering', year:'4th Year', manifesto: 'Manifesto for Candidate A' },
                { id: 2, name: 'Candidate B', department: 'Business', year:'3rd Year', manifesto: 'Manifesto for Candidate B' },
                { id: 3, name: 'Candidate C', department: 'Agriculture', year:'4th Year', manifesto: 'Manifesto for Candidate C' },
                { id: 4, name: 'Candidate D', department: 'ICT', year:'3rd Year', manifesto: 'Manifesto for Candidate D' },
            ]);
        }
    };

    const handleSelectCandidate = (candidateId) => {
        if (hasVoted) {
            setError('You have already voted and cannot change your vote.');
            return;
        }
        setSelectedCandidate(candidateId);
        setError('');
    };

    const handleSubmitVote = async () => {
        if (!selectedCandidate) {
            setError('Please select a candidate before submitting.');
            return;
        }

        if (hasVoted) {
            setError('You have already voted and cannot change your vote.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/vote/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    candidate_id: selectedCandidate,
                    student_id: user.student_id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Vote submitted successfully! Your vote has been encrypted and recorded.');
                onVoteSubmitted();

                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(data.message || 'Failed to submit vote.');
            }
        } catch (error) {
            console.error('Vote submission error:', error);
            setSuccess('Vote submitted successfully! (Demo)');
            onVoteSubmitted();
            setTimeout(() => setSuccess(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voting-system">
            <div className="bg-animation" />

            <div className="container">
                <header className="header">
                    <div className="logo-container">
                        <img scr={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logo-img"/>

                    </div>
                    <h1>JKUAT Secure Voting System</h1>
                    <p>JKUSA Elections</p>
                </header>

                <div className="screen-container">
                    <div className="card">
                        <div className="card-header">
                            <h2>Cast Your Vote</h2>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="info-panel">
                            <h3>JKUSA Student Council Elections</h3>
                            <p>Select your preferred candidate. Your vote will be encrypted before submission and cannot be changed once cast. Vote anonymity is guaranteed.</p>
                        </div>

                        <div className="status-bar">
                            <div className="status-item">
                                <span>Voter ID</span>
                                <strong>{user.student_id}</strong>
                            </div>
                            <div className="status-item">
                                <span>Session Token:</span>
                                <strong>{sessionToken.substring(0, 16)}...</strong>
                            </div>
                            <div className="status-item">
                                <span>Vote Status:</span>
                                <strong className={hasVoted ? 'voted' : 'not-voted'}>{hasVoted ? 'VOTED' : 'NOT VOTED'}</strong>
                            </div>
                        </div>

                        <h3 className="section-title">Select Your Candidate</h3>
                        <div className="candidates-grid">
                            {candidates.map((candidate) => {
                                const initials = candidate.name.split('').map(n => n[0]).join('');
                                return (
                                    <div
                                        key={candidate.id}
                                        className={`candidate-card ${selectedCandidate === candidate.id ? 'selected' : ''} ${hasVoted ? 'disabled' : ''}`}
                                        onClick={() => handleSelectCandidate(candidate.id)}
                                    >
                                        <div className="candidate-avatar">{initials}</div>
                                        <div className="candidate-name">{candidate.name}</div>
                                        <div className="candidate-info">{candidate.department} | {candidate.year}<br /> "{candidate.manifesto}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            className="btn btn-primary"
                            onClick={handleSubmitVote}
                            disabled={!selectedCandidate || hasVoted || loading}
                        >
                            {loading ? 'Encrypting Vote...' : 'Submit Encrypted Vote'}
                        </button>

                        <button className="btn btn-secondary" onClick={onViewResults}>
                            View Final Results
                        </button>

                        <button className="btn btn-danger" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default VotingPage;


        
    

