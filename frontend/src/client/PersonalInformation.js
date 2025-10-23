import React, { useEffect, useState } from 'react';
import {jwtDecode} from "jwt-decode";
import '../styles/Home.css';
import {useNavigate} from "react-router-dom";

function PersonalInformation({ user }) {
    const navigate = useNavigate();
    const [updatedName, setUpdatedName] = useState('');
    const [updatedSurname, setUpdatedSurname] = useState('');
    const [updatedPhone, setUpdatedPhone] = useState('');
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [error, setError] = useState(null);

    const handleNameChange = (setter) => (e) => {
        let value = e.target.value
            .replace(/[^a-zA-Z' -]/g, '')
            .replace(/\s{2,}/g, ' ')
            .slice(0, 100)
            .toUpperCase();

        if (value.startsWith(' ')) {
            value = value.trimStart();
        }
        setter(value);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value
            .replace(/\s+/g, '')
            .replace(/[^\x00-\x7F]/g, '')
            .slice(0, 100);
        setUpdatedEmail(value);
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value
            .replace(/[^\d+]/g, '')
            .slice(0, 15);
        setUpdatedPhone(value);
    };

    const handleSave = () => {
        if (!updatedName || !updatedSurname || !updatedEmail || !updatedPhone) {
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

        const fullName = `${updatedName} ${updatedSurname}`.toUpperCase();

        fetch(`http://localhost:8080/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: fullName,
                email: updatedEmail,
                phoneNumber: updatedPhone
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('jwtToken', data.token);
                    window.location.reload();
                }
                else{
                    console.error('Update failed:', data.error);
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
        if (user) {
            setUpdatedName(user.name);
            setUpdatedSurname(user.surname);
            setUpdatedEmail(user.email);
            setUpdatedPhone(user.phoneNumber);
        }
    }, [user]);

    return (
        <div className="flight-content">
            <div className="plane-card">
                {error && <p className="error-message">{error}</p>}
                <div className="personal-form">
                    <div className="personal-info-list">
                        <div className="info-section-personal">
                            <span className="label-pay">Name</span>
                            <input
                                className="form-input-personal"
                                type="text"
                                value={updatedName}
                                onChange={handleNameChange(setUpdatedName)}
                            />
                        </div>
                        <div className="info-section-personal">
                            <span className="label-pay">Surname</span>
                            <input
                                className="form-input-personal"
                                type="text"
                                value={updatedSurname}
                                onChange={handleNameChange(setUpdatedSurname)}
                            />
                        </div>
                    </div>
                    <div className="personal-divider"></div>
                    <div className="personal-info-list">
                        <div className="info-section-personal">
                            <span className="label-pay">Email</span>
                            <input
                                className="form-input-personal"
                                type="text"
                                value={updatedEmail}
                                onChange={handleEmailChange}
                            />
                        </div>
                        <div className="info-section-personal">
                            <span className="label-pay">Phone number</span>
                            <input
                                className="form-input-personal"
                                type="text"
                                value={updatedPhone}
                                onChange={handlePhoneChange}
                            />
                        </div>
                    </div>
                    <div className="personal-divider"></div>
                    <div className="personal-info-list">
                        <button className="delete-button" onClick={handleDelete}>Delete account</button>
                        <button className="save-personal-button" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default PersonalInformation;
