import React, { useState } from 'react';
import { studentLogin, adminLogin } from '../api/votingAPI';
import  Footer  from '../components/Footer';

const LoginPage = ({ userType, onLoginSuccess, onBack }) => {
    const [credentials, setCredentials] = useState({ regNumber: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let data;

            if (userType === 'admin') {
                data = await adminLogin(credentials.regNumber, credentials.password);
                onLoginSuccess({ admin_id: credentials.regNumber, name: 'Admin User', token: data });

            } else {
                data = await studentLogin(credentials.regNumber, credentials.password);
                onLoginSuccess(data);  
            }
            if (data.hasVoted) {
                setError('You have already voted and cannot vote again.');
                return;
            }

        } catch (networkError) {
            console.error('Login error:', networkError);

            // DEMO MODE (when backend is offline) 
            if (credentials.regNumber === 'SCT111-0111/1900' && credentials.password === 'password4321') {
                onLoginSuccess({
                    student_id: credentials.regNumber,
                    name: 'Marion Tamnai',
                    voting_status: 'NOT_VOTED'
                });
            } else if (credentials.regNumber === 'ADM001' && credentials.password === 'admin4321') {
                onLoginSuccess({
                    admin_id: credentials.regNumber,
                    name: 'Admin User',
                });
            } else {
                setError(networkError.response?.data?.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voting-system">
            <div className="bg-animation" />

            <div className="container">
                <header className="page-header">
                    <div className="logo-container">
                        <img src={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logo-img" />
                    </div>
                    <h1>JKUAT Voting System</h1>
                    <p>Face Recognition-Based Authentication | JKUSA Elections</p>
                </header>

                <div className="screen-container">
                    <div className="card centered-card">
                        <div className="card-header">
                            <h2>{userType === 'admin' ? 'Admin' : 'Student'} Login</h2>
                        </div>

                        {error && (
                            <div className="alert alert-error">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Registration Number / Admin ID</label>
                                <input
                                    type="text"
                                    value={credentials.regNumber}
                                    onChange={(e) => setCredentials({ ...credentials, regNumber: e.target.value })}
                                    placeholder="e.g., SCT111-0111/1900 or ADM001"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <div className="button-group">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Validating...' : 'Login'}
                                </button>

                                <button type="button" className="btn btn-secondary" onClick={onBack}>
                                    Back to Home
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LoginPage;