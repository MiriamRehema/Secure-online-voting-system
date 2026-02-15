import React, { useState, useRef, useEffect } from 'react';

const FaceRecognitionPage = ({ user, onVerificationSuccess, onVerificationFailed, onCancel }) => {
    const [attemptCount, setAttemptCount] = useState(0);
    const [faceStatus, setFaceStatus] = useState('Initializing...');
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState('');
    const [retryTimer, setRetryTimer] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        initializeCamera();
        return () => cleanUpCamera();
    }, []);

    const initializeCamera = async () => {
        try {
            setFaceStatus('Accessing camera...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280}, height: { ideal: 720 }, facingMode: 'user' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setCameraReady(true);
                setFaceStatus('Camera ready - Position your face in the oval');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied. Please enable camera permissions.');
            setFaceStatus('Camera error');
        }
    };

    const cleanUpCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const captureFaceImage = () => {
        if (!videoRef.current || !canvasRef.current){
            console.error('Video or canvas ref not available');
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        console.log('Image captured:', canvas.width, 'x', canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) =>{
                console.log('Blob created:', blob ? 'Success' : 'Failed');
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

const handleCaptureAndVerify = async () => {
        console.log('Starting face capture and verification...');

        if (!cameraReady) {
            console.warn('Camera not ready yet')
            setError('Camera not ready. Please wait...');
            return;
        }

        setFaceStatus('Capturing...');
        setError('');

        try {
            console.log('Step 1: Capturing image from video...');
            const imageBlob = await captureFaceImage();

            if (!imageBlob) {
                console.error('Failed to capture image blob')
                setError('Failed to capture image. Please try again');
                return;
            }

            console.log('Image blob captured:', imageBlob.size, 'bytes');
            setFaceStatus('Verifying...');
            
            console.log('Step 2: Attempting to send to backend...')
            const formData = new FormData();
            formData.append('face_image', imageBlob, 'face.jpg');
            formData.append('student_id', user.student_id);

            const response = await fetch('http://localhost:8000/api/auth/verify-face', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Backend response:', data);

            if (response.ok && data.verified) {
                console.log('Backend verification SUCCESS');
                setFaceStatus('Face Verified successfully!');
                setTimeout(() => {
                    cleanUpCamera();
                    onVerificationSuccess(data.token);
                }, 1500);
            } else {
                console.log('Backend verification FAILED');
                handleFailedAttempt();
                return;
            }
        } catch (backendError) {
            
            console.warn('Backend not available, using DEMO MODE:', backendError.message);

            console.log('DEMO MODE: Simulating face verification...');
            try {
                await simulateDemoVerification();
            } catch (error) {
                
                console.error('Capture error:', error);
                setError('An error has occurred. Please try again.');
                setFaceStatus('Error occurred');
            }
        }
    };
   const simulateDemoVerification = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const demoSuccess = Math.random() > 0.2 || attemptCount >= 2;
    console.log(`Demo verification result: ${demoSuccess ? 'SUCCESS' : 'FAIL'} ('attempt ${attemptCount + 1})`);

    if (demoSuccess) {
        console.log('DEMO: Face Verified successfully!');
        setFaceStatus('Face verified successfully! (Demo Mode)')
        const demoToken = 'DEMO-TOKEN-' + Date.now();
        console.log('Generate token:', demoToken);

        console.log('Cleaning up camera...');
        cleanUpCamera();

        setTimeout(() => {
            console.log('Now calling onVerificationSuccess with token:', demoToken);
            console.log('Callback function exists?', typeof onVerificationSuccess);
            
            if (typeof onVerificationSuccess === 'function') {
                onVerificationSuccess(demoToken);
                console.log('Successfully called onVerificationSuccess!');
            } else {
                console.error('onVerificationSuccess is not a function!');
            }
        }, 1500);
    } else {
        console.log('DEMO: Face verification failed');
        handleFailedAttempt();
    }
   };


    const handleFailedAttempt = () => {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        setFaceStatus('Face verification failed');
        setError(`Verification failed. Attempt ${newCount} of 3`);

        console.log(`Failed attempt ${newCount} of 3`);

        if (newCount < 3) {
            setTimeout(() => {
                setFaceStatus('Ready to retry - position your face in the oval');
                setError('');
            }, 2000);
        } else {
            console.log('Maximum attempts reached. Starting 60s timer...')
            setError('Maximum attempts reached. Returning to home in 60 seconds...');
            start60SecondTimer();
        }
    };

    const start60SecondTimer = () => {
        let timeLeft = 60;
        setRetryTimer(timeLeft);

        const interval = setInterval(() => {
            timeLeft--;
            setRetryTimer(timeLeft);
            console.log(`Timer: ${timeLeft}s remaining`)

            if (timeLeft <= 0) {
                clearInterval(interval);
                console.log('Timer expired. Returning to home...')
                cleanUpCamera();
                onVerificationFailed();
            }
        }, 1000);
    };

    return (
        <div className="voting-system">
            <div className="bg-animation" />

            <div className="container">
                <header className="header">
                    <div className="logo-container">
                        <img src={require('../assets/jkuat-logo.png')} alt="JKUAT Logo" className="jkuat-logo-img"/>
                    </div>
                    <h1>JKUAT Secure Voting System</h1>
                    <p className="subtitle">Face Recognition Authentication</p>
                </header>

                <div className="screen-container">
                    <div className="card wide-card">
                        <div className="card-header">
                            <h2>Face Recognition Verification</h2>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="info-panel">
                            <h3>Biometric Verification Required</h3>
                            <p>Please position your face within the oval for verification. You have <strong>3 attempts</strong> to verify your identity.</p>
                        </div>

                        <div className="face-capture-container">
                            <div className="video-container">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="webcam"
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                <div className="face-overlay" />
                                <div className="face-status">{faceStatus}</div>
                            </div>

                            <div className="attempt-counter">
                                Attempts: <span className="count">{attemptCount}</span> / 3
                            </div>

                            {retryTimer !== null && (
                                <div className="retry-timer">
                                    Returning home in {retryTimer}s...
                                </div>
                            )}
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleCaptureAndVerify}
                            disabled={!cameraReady || retryTimer !== null}
                        >
                            {cameraReady ? 'Capture & Verify Face': 'Initialize Camera...'}
                        </button>

                        <button className="btn btn-danger" onClick={() => {
                            cleanUpCamera();
                            onCancel();
                        }}>
                            Cancel & Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FaceRecognitionPage;
