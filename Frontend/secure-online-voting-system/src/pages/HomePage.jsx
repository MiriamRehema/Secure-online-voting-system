import React from 'react';
import  Footer  from '../components/Footer';



const HomePage = ({ onSelectUserType }) => {
  return (
    <div className="voting-system">
      <div className="container">

        <div className="page-header">
          <div className="logo-container">
            <img
              src={require('../assets/jkuat-logo.png')}
              alt="JKUAT Logo"
              className="jkuat-logo-img"
            />
          </div>

          <h1>JKUAT Secure Voting System</h1>

          <p className="subtitle">
            Face Recognition-Based Authentication | JKUSA Elections
          </p>

          <div className="security-badge">
             <span>AES-256 Encrypted</span>
             <span>Biometric Verified</span>
             <span>One Person, One Vote</span>
          </div>
        </div>

        <div className="screen-container">
          <div className="card centered-card">

            <h2 className="card-title">
              Welcome to JKUSA Student Leaders Election
            </h2>

            <p className="card-description">
                A secure biometric-based online voting platform for JKUSA student elections. Identity verification is performed using facial recognition and AES-256 encryption before vote submission.
            </p>

            <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={() => onSelectUserType('student')}
            >
              Student Login
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onSelectUserType('admin')}
            >
               Admin Login
            </button>
            </div>

          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
