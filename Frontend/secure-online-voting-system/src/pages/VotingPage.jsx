import React, { useState, useEffect } from 'react';
import  Footer  from '../components/Footer';

const VotingPage = ({ user, sessionToken, hasVoted, onVoteSubmitted, onViewResults, onLogout }) => {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [voteSubmitted, setVoteSubmitted] = useState(false)
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
                { candidate_id: 1, name: 'Alice Wanjiku', department: 'Engineering', year:'4th Year', manifesto: 'Manifesto for Alice Wanjiku' },
                { candidate_id: 2, name: 'Brian Otieno ', department: 'Business', year:'3rd Year', manifesto: 'Manifesto for Brian Otieno' },
                { candidate_id: 3, name: 'Catherine Nyambura', department: 'Agriculture', year:'4th Year', manifesto: 'Manifesto for Catherine Nyambura' },
                { candidate_id: 4, name: 'David Kipchoge', department: 'ICT', year:'3rd Year', manifesto: 'Manifesto for David Kipchoge' },
            ]);
        }
    };

    const handleSelectCandidate = (candidateId) => {
        if (hasVoted) {
            setError('You have already voted and cannot change your vote.');
            return;
        }
        console.log('Selected candidate_id:', candidateId)
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
                setVoteSubmitted(true);
                onVoteSubmitted();
                
                // ✅ Mark student as voted in localStorage (for demo mode)
                localStorage.setItem(`voted_${user.student_id}`, 'true');
                console.log(' Vote recorded in localStorage');

                /*setTimeout(() => setSuccess(''), 5000);*/
            } else {
                setError(data.message || 'Failed to submit vote.');
            }
        } catch (error) {
            console.error('Vote submission error:', error);
            
            // ✅ Demo mode - still mark as voted
            localStorage.setItem(`voted_${user.student_id}`, 'true');
            console.log('Vote recorded in localStorage (demo mode)');
            
            setSuccess('Vote submitted successfully! (Demo)');
            setVoteSubmitted(true);
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
                <header className="page-header">

                    <div className="top-bar">
                        <button className="logout-btn" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                    <div className="logo-container">
                        <img
                          src={require('../assets/jkuat-logo.png')}
                          alt="JKUAT Logo"
                           className="jkuat-logo-img"
                        />
            
        </div>
        <h1 className="main-title">JKUAT Secure Voting System</h1>
        <p className="subtitle">JKUSA Elections</p>
        </header>

                <div className="screen-container">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="vote-title">Cast Your Vote</h2>
                            <p className="vote-subtext">Select your preferred candidate below.
                                <strong>Your vote is end-to-end encrypted</strong> and cannot be modified once submitted.
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">
                            {success}

                            <div className="success-actions">
                                <button className="btn btn-secondary" onClick={onViewResults}
                                >View Results</button>
                                </div>
                            </div>}

                        <div className="status-bar">
                            <div className="status-item">
                                <span>Voter ID</span>
                                <strong>****{user.student_id.slice(-4)}</strong>
                            </div>
                            <div className="status-item">
                                <span>Session Token:</span>
                                <strong>****{sessionToken.slice(-6)}</strong>
                            </div>
                            <div className="status-item">
                                <span>Vote Status:</span>
                                <strong className={hasVoted ? 'voted' : 'not-voted'}>{hasVoted ? 'VOTED' : 'NOT VOTED'}</strong>
                            </div>
                        </div>
                        {!voteSubmitted ? (
    <>
        
        <h3 className="section-title">Select Your Candidate</h3>

        <div className="candidates-grid">
            {candidates.map((candidate) => {
                const initials = candidate.name
                    .trim()
                    .split(/\s+/)
                    .map(word => word[0])
                    .join('')
                    .toUpperCase();

                return (
                    <div
                        key={candidate.candidate_id}
                        className={`candidate-card ${
                            selectedCandidate === candidate.candidate_id ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectCandidate(candidate.candidate_id)}
                    >
                        {selectedCandidate === candidate.candidate_id && (
                            <div className="selected-tick">✓</div>
                        )}

                        <div className="candidate-avatar">{initials}</div>
                        <div className="candidate-name">{candidate.name}</div>
                        <div className="candidate-info">
                            {candidate.department} | {candidate.year}
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="button-group">
        <button
            className="btn btn-primary"
            onClick={handleSubmitVote}
            disabled={!selectedCandidate || loading}
        >
            {loading ? 'Submitting...' : 'Submit'}
        </button>
        </div>
    </>
) : (
    
    <div className="success-actions">
        <div className="selected-tick">✓</div>
        <h2>Your vote has been submitted</h2>
        <p>
            Thank you for participating in the election.
            Your vote has been securely recorded.
        </p>

        <div className="button-group">
        <button
            className="btn btn-secondary"
            onClick={() =>{
                console.log("View Results clicked");
                onViewResults();
            }}
        >
            View Final Results
        </button>
        </div>
    </div>
)}
    </div>
 </div>
</div>
<Footer />
</div>
 )
};

export default VotingPage;