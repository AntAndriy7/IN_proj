import '../styles/Main.css';
import logoImage from "../resources/plane-icon.png";
import cabinetImageCab from "../resources/cabinet.png";
import {useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";

function AviaCabinet() {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: '', email: '', phone_number: ''});
    const [isEditing, setIsEditing] = useState(false);
    const [updatedName, setUpdatedName] = useState('');
    const [updatedPhone, setUpdatedPhone] = useState('');
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [error, setError] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    }

    const fetchUser = () => {
        const token = localStorage.getItem('jwtToken');
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        fetch(`http://localhost:8080/api/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setUser({ name: data.name, email: data.email, phone_number: data.phoneNumber });

                setUpdatedName(data.name);
                setUpdatedEmail(data.email);
                setUpdatedPhone(data.phoneNumber);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                setError('Failed to fetch user data');
            });
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!updatedName || !updatedEmail || !updatedPhone) {
            alert('All fields must be filled');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(updatedEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        const phonePattern = /^\+?[0-9]{10,15}$/;
        if (!phonePattern.test(updatedPhone)) {
            alert('Please enter a valid phone number (e.g., +1234567890).');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        fetch(`http://localhost:8080/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: updatedName, email: updatedEmail, phoneNumber: updatedPhone }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('jwtToken', data.token);
                    setIsEditing(false);
                    setUser({
                        name: updatedName,
                        email: updatedEmail,
                        phone_number: updatedPhone,
                    });
                }
            })
            .catch(error => {
                console.error('Error updating user:', error);
                setError('Failed to update user');
            });
    };

    const handleDelete = async () => {
        const confirmed = window.confirm("Are you sure you want delete your account?");
        if (confirmed) {
            try {
                const token = localStorage.getItem('jwtToken');
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                const response = await fetch(`http://localhost:8080/api/user/delete/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
                if (response.ok) {
                    localStorage.removeItem('jwtToken');
                    navigate('/login');
                } else {
                    alert("Failed to delete account.");
                }
            } catch (error) {
                alert("There was an error deletion your account.");
            }
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" onClick={() => navigate('/avia/main')}>
                    <div className="logo">
                        <span>Kyiv</span>
                        <span>International</span>
                        <span>Airport</span>
                    </div>
                    <img src={logoImage} alt="logo" className="logoImage"/>
                </div>
                <div className="header-right">
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                    <button className="cabinet-logo-button" onClick={() => window.location.reload()}><img src={cabinetImageCab} alt="logo" className="cabinetImageCab"/></button>
                </div>
            </header>

            <div className="main-content">
                <div>
                    <div className="plane-card">
                        {error && <p className="error-message">{error}</p>}
                        <div className="plane-info-personal">
                            <div className="info-section">

                                <span className="label">Name</span>
                                {isEditing ? (
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={updatedName}
                                        onChange={(e) => setUpdatedName(e.target.value)}
                                    />
                                ) : (
                                    <span className="value">{user.name}</span>
                                )}
                            </div>
                            <div className="info-section">
                                <span className="label">Email</span>
                                {isEditing ? (
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={updatedEmail}
                                        onChange={(e) => setUpdatedEmail(e.target.value)}
                                    />
                                ) : (
                                    <span className="value">{user.email}</span>
                                )}
                            </div>
                            <div className="info-section">
                                <span className="label">Phone number</span>
                                {isEditing ? (
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={updatedPhone}
                                        onChange={(e) => setUpdatedPhone(e.target.value)}
                                    />
                                ) : (
                                    <span className="value">{user.phone_number}</span>
                                )}
                            </div>
                        </div>
                        <div className="account-actions">
                            {isEditing ? (
                                <button className="order-home-button" onClick={handleSave}>Save</button>
                            ) : (
                                <button className="order-home-button" onClick={handleEdit}>Edit</button>
                            )}
                        </div>
                    </div>
                    <button className="cancel-button" onClick={handleDelete}>Delete account</button>
                </div>
            </div>
        </div>
    );
}

export default AviaCabinet;
