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
  /*const [screen, setScreen] = useState("vote")*/

  const goToLogin = (type) => {
    console.log('Navigating to login:', type);
    setUserType(type);
    setCurrentPage('login');
  }

  const handleLoginSuccess = (user) => {
    console.log('Login success:', user)
    setCurrentUser(user);

    if (userType === 'admin') {
      console.log('Admin user - going to admin dashboard')
      setCurrentPage('admin');
    } else {
      console.log('Student user - going to face recognition')
      setCurrentPage('faceRecognition');
    }
  };

  const handleFaceVerified = (token) => {
    console.log('handleFaceVerified CALLED with token:', token);
    console.log('current page before:', currentPage);
    setSessionToken(token);
    setCurrentPage('voting');
    console.log('Current page should now be: voting');
  };

  const handleFaceVerificationFailed = () => {
    console.log('Face verification failed - returning to home');
    setCurrentPage('home');
    setUserType(null);
    setCurrentUser(null);
  };

  const goToResults = () => {
    console.log('Navigating to results');
    setCurrentPage('results');
  };

  const handleVoteSubmitted = () => {
    console.log('Vote submitted');
    setHasVoted(true);
  };

  /*const handleViewResults = () => {
    setScreen("results");
  }*/

  const backToVoting = () => {
    console.log('Going back to voting')
    setCurrentPage('voting');
  };

  const logout = () => {
    console.log('Logging out - returning to home');
    setCurrentPage('home');
    setUserType(null);
    setCurrentUser(null);
    setSessionToken(null);
    setHasVoted(false);
  };

  console.log('Current Page:', currentPage);
  console.log('Current User:', currentUser);
  console.log('Session Token:', sessionToken);

  return (
    <div className='App'>
      {currentPage === 'home' && (
        <HomePage onSelectUserType={goToLogin} />
      )}
     
     {currentPage === 'login' && (
        <LoginPage
          userType={userType}
          onLoginSuccess={handleLoginSuccess}
          onBack={logout}
        />
      )}

      {currentPage === 'faceRecognition' && (
        <FaceRecognitionPage
          user={currentUser}
          onVerificationSuccess={handleFaceVerified}
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
