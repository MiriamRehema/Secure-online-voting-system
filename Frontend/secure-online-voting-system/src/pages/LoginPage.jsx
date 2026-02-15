import react, { useState } from 'react';

const LoginPage = ({ userType, onLoginSuccess, onBack }) => {
    const [credentials, setCredentials] = useState({ regNumber: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reg_number: credentials.regNumber,
                    password: credentials.password,
                    user_type: userType
                })
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data.user);
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (networkError) {
            console.error('Login error:', networkError);
            
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
                setError('Invalid credentials');
            }
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
                        <div className="jkuat-logo">JK</div>

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
                            <div className="alert alert-error"> {error} </div>
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

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Validating...' : 'Login'}
                            </button>

                            <button type="button" className="btn btn-secondary" onClick={onBack}>
                                Back to Home
                            </button>
                        </form>

                        <div className="demo-box">
                            <h4>Demo Credentials</h4>
                            <p><strong>Student:</strong> <code>SCT111-0111/1900 | password4321</code></p>
                            <p><strong>Admin:</strong> <code>ADM001 | admin4321</code></p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;