import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import styles from './styles/LoginForm.module.css';
import logoImage from './resources/plane-icon.png';
import {jwtDecode} from "jwt-decode";

function SignUpAviaForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [fillError, setFillError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passError, setPassError] = useState('');
    const [cpassError, setCpassError] = useState('');
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

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value
            .replace(/\s/g, '')
            .replace(/[^\x00-\x7F]/g, '')
            .slice(0, 100);
        setConfirmPassword(value);
    };

    const handleNameChange = (e) => {
        let value = e.target.value
            .replace(/\s+/g, '')
            .replace(/[^\x00-\x7F]/g, '')
            .slice(0, 100);

        if (value.startsWith(' ')) {
            value = value.trimStart();
        }
        setName(value);
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value
            .replace(/[^\d+]/g, '')
            .slice(0, 15);
        setPhone(value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFillError('');
        setEmailError('');
        setPhoneError('');
        setPassError('');
        setCpassError('');

        if (name === '' || email === '' || phone === '' || password === '' || confirmPassword === '') {
            setFillError('Please fill in all fields.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        const phonePattern = /^\+?[0-9]{10,15}$/;
        if (!phonePattern.test(phone)) {
            setPhoneError('Please enter a valid phone number (e.g., +1234567890).');
            return;
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
        if (!passwordPattern.test(password)) {
            setPassError('Password must be at least 6 characters long, containing at least one uppercase and one lowercase letter.');
            return;
        }

        if (password !== confirmPassword) {
            setCpassError("Passwords don't match!");
            return;
        }

        const userData = {email, password, name, phoneNumber: phone, role: 'AVIA-temp'};

        try {
            const response = await fetch('http://localhost:8080/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 409 || errorText.includes("exists")) {
                    setEmailError("Account with this email already exists.");
                } else {
                    throw new Error(errorText || "Failed to create account");
                }
                return;
            }

            const userLoginData = {email: userData.email, password: userData.password};
            const loginResponse = await fetch('http://localhost:8080/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userLoginData)
            });

            const data = await loginResponse.json();
            if (data.token) {
                localStorage.setItem('jwtToken', data.token);
                navigateBasedOnRole(data.token);
            } else {
                console.error('Login failed:', data.error);
            }

        } catch (error) {
            console.error('Error:', error);
        }
    };

    const navigateBasedOnRole = (token) => {
        const decodedToken = jwtDecode(token);
        const { role } = decodedToken;

        switch (role) {
            case 'AVIA-temp':
                navigate('/avia/main');
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
                <h2 className={styles.title}>Sign Up</h2>
                <div className={styles.inputGroup}>
                    <label>Name</label>
                    <input
                        type="name"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                </div>
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
                    <label>Phone number</label>
                    <input
                        type="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                    />
                    {phoneError && <p className={styles.error}>{phoneError}</p>}
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
                <div className={styles.inputGroup}>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required

                    />
                    {cpassError && <p className={styles.error}>{cpassError}</p>}
                </div>
                {fillError && <p className={styles.error}>{fillError}</p>}
                <button type="submit" className={styles.button} onClick={handleSubmit}>Sign Up</button>
                <p className={styles.signUpPrompt}>
                    Sign Up as <Link to="/signup">Client</Link>
                </p>
                <p className={styles.signUpPrompt}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default SignUpAviaForm;
