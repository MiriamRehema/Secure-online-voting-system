import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FaceRecognitionPage from './pages/FaceRecognitionPage';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import './styles/VotingSystem.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const goToLogin = (type) => {
    setUserType(type);
    setCurrentPage('login');
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);

    if (userType === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('faceRecognition');
    }
  };

  const handleLoginError = () => {

  }

  const handleFaceVerified = (token) => {
    setSessionToken(token);
    setCurrentPage('voting');
  };

  const handleFaceVerificationFailed = () => {
    setCurrentPage('home');
  };

  const goToResults = () => {
    setCurrentPage('results');
  };

  const handleVoteSubmitted = () => {
    setHasVoted(true);
  };

  const backToVoting = () => {
    setCurrentPage('voting');
  };

  const logout = () => {
    setCurrentPage('home');
    setUserType(null);
    setCurrentUser(null);
    setSessionToken(null);
    setHasVoted(false);
  };

  return (
    <div className='App'>
      {currentPage === 'home' && (
        <HomePage onSelectUserType={goToLogin} />
      )}

      {currentPage === 'login' && (
        <LoginPage
          userType={userType}
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
          onBack={logout}
        />
      )}

      {currentPage === 'faceRecognition' && (
        <FaceRecognitionPage
          user={currentUser}
          onVerificationSuccess={handleLoginSuccess}
          onVerificationFailed={handleFaceVerificationFailed}
          onCancel={logout}
        />
      )}

      {currentPage === 'voting' && (
        <VotingPage
          user={currentUser}
          sessionToken={sessionToken}
          hasVoted={hasVoted}
          onVoteSubmitted={handleVoteSubmitted}
          onViewResults={goToResults}
          onLogout={logout}
        />
      )}

      {currentPage === 'results' && (
        <ResultsPage
          onBack={backToVoting}
          onLogout={logout}
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboard
          user={currentUser}
          onLogout={logout}
        />
      )}

    </div>
  );
}

export default App;
