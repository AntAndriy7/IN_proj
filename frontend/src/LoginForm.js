import React, {useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles/LoginForm.module.css';
import logoImage from './resources/plane-icon.png';
import { jwtDecode } from "jwt-decode";

function LoginForm() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fillError, setFillError] = useState('');
    const [passError, setPassError] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const handleEmailChange = (e) => {
        const value = e.target.value
            .replace(/\s+/g, '')
            .replace(/[^\x00-\x7F]/g, '')
            .slice(0, 100);
        setEmail(value);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value
            .replace(/\s/g, '')
            .replace(/[^\x00-\x7F]/g, '')
            .slice(0, 100);
        setPassword(value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        setFillError('');
        setEmailError('');
        setPassError('');

        if (email === '' || password === '') {
            setFillError('Please fill in all fields.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
        if (!passwordPattern.test(password)) {
            setPassError('Password must be at least 6 characters long, containing at least one uppercase and one lowercase letter.');
            return;
        }

        const userData = {
            email: email,
            password: password
        };

        fetch('http://localhost:8080/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('jwtToken', data.token);
                    console.log(data.token);
                    navigateBasedOnRole(data.token);
                } else {
                    setFillError("User with such email and/or password doesn't exist.")
                    console.error('Login failed:', data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    const navigateBasedOnRole = (token) => {
        const decodedToken = jwtDecode(token);
        const { role } = decodedToken;

        switch (role) {
            case 'ADMIN':
                navigate('/admin/main');
                break;
            case 'AVIA':
                navigate('/avia/main');
                break;
            case 'AVIA-temp':
                navigate('/avia/main');
                break;
            case 'CLIENT':
                navigate('/main');
                break;
            default:
                navigate('/login');
                break;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.form}>
                <div className={styles.logoContainer} title="Home" onClick={() => navigate('/main')}>
                    <div className={styles.logo}>
                        <span>Kyiv</span>
                        <span>International</span>
                        <span>Airport</span>
                    </div>
                    <img src={logoImage} alt="logo" className={styles.logoImage}/>
                </div>
                <h2 className={styles.title}>Welcome</h2>
                <div className={styles.inputGroup}>
                    <label>Email</label>
                    <input
                        type="text"
                        value={email}
                        onChange={handleEmailChange}
                        required
                    />
                    {emailError && <p className={styles.error}>{emailError}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                    />
                    {passError && <p className={styles.error}>{passError}</p>}
                </div>
                {fillError && <p className={styles.error}>{fillError}</p>}
                <button type="submit" className={styles.button} onClick={handleSubmit}>Login</button>
                <p className={styles.signUpPrompt}>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginForm;
