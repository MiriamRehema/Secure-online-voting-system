import React from 'react';

const HomePage = ({ onSelectUserType }) => {
    return (
        <div className="voting-system">
            <div className="bg-animation" />

            <div className='container'>
                <header>
                    <div className="logo-container">
                        <img src={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logo-img"/>
                    </div>
                    <h1>JKUAT Secure Voting System</h1>
                    <p className="subtitle">Face Recognition-Based Authentication | JKUSA Elections</p>
                </header>

                <div className="screen-container">
                    <div className="card centered-card">
                        <div className="card-header">
                            <h2>Welcome to JKUAT Secure Voting System</h2>

                        </div>

                        <div className="info-panel">
                            <h3>JKUSA Student Leaders Election</h3>
                            <p>This is a secure, face recognition-based online voting system for JKUSA elections. Your identity will be verified using biometric authentication before you can cast your vote</p>

                        </div>
                        <button className="btn btn-primary" onClick={() => onSelectUserType('student')}>
                            Student Login
                        </button>

                        <button className="btn btn-secondary" onClick={() => onSelectUserType('admin')}>
                            Admin Login
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default HomePage;