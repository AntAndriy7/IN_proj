import '../styles/Main.css';
import '../styles/Home.css';
import logoImage from "../resources/plane-icon.png";
import cabinetImageCab from "../resources/cabinet.png";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import MyFlights from "./MyFlights";
import PersonalInformation from "./PersonalInformation";
import MyBonuses from "./MyBonuses";
import Layout from "../components/Layout";

function Cabinet() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('myFlights');
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    const renderContent = () => {
        switch (activePage) {
            case 'myFlights':
                return <MyFlights />;
            case 'personalInformation':
                return (
                    <PersonalInformation
                        user={user}
                    />
                );
            case 'myBonuses':
                return <MyBonuses />;
            default:
                return <MyFlights />;
        }
    };

    const fetchUser = () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        fetch(`http://localhost:8080/api/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    const errorMessage = data?.message || 'Failed to fetch user';
                    throw new Error(errorMessage);
                }

                return data;
            })
            .then(data => {
                const [name, surname] = data.name.split(' ');
                setUser({
                    name,
                    surname,
                    email: data.email,
                    phoneNumber: data.phoneNumber
                });
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                setError(error.message || 'Failed to fetch user');
            });
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/main');
    };

    const handleEditClick = () => {
        setActivePage('personalInformation');
    };

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" title="Home" onClick={() => navigate('/main')}>
                    <div className="logo">
                        <span>Kyiv</span>
                        <span>International</span>
                        <span>Airport</span>
                    </div>
                    <img src={logoImage} alt="logo" className="logoImage"/>
                </div>
                <div className="header-center">
                    <button
                        className={`nav-button ${activePage === 'myFlights' ? 'active' : ''}`}
                        onClick={() => setActivePage('myFlights')}
                    >
                        My Flights
                    </button>
                    <div className="vertical-line"></div>
                    <button
                        className={`nav-button ${activePage === 'myBonuses' ? 'active' : ''}`}
                        onClick={() => setActivePage('myBonuses')}
                    >
                        My Bonuses
                    </button>
                </div>
                <div className="header-right">
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                    <button className="cabinet-logo-button" title="Reload cabinet page" onClick={() => window.location.reload()}>
                        <img src={cabinetImageCab} alt="logo" className="cabinetImageCab"/>
                    </button>
                </div>
            </header>

            <div className="scroll-area">
                <div className="main-content">
                    <div className="home-layout">
                        <div className="cabinet-sidebar">
                            <h2 className="cabinet-title">Account</h2>
                            <div className="cabinet-divider"></div>

                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            {user ? (
                                <div className="user-info-block">
                                    <div className="user-header">
                                        <img
                                            src={cabinetImageCab}
                                            alt="User icon"
                                            className="user-icon"
                                        />
                                        <div className="user-name">
                                            <span className="user-fullname">{user.name}</span>
                                            <span className="user-fullname">{user.surname}</span>
                                        </div>
                                    </div>

                                    <div className="user-details">
                                        <div className="detail-block">
                                            <span className="detail-title">Email</span>
                                            <span className="detail-value">{user.email}</span>
                                        </div>
                                        <div className="detail-block">
                                            <span className="detail-title">Phone number</span>
                                            <span className="detail-value">{user.phoneNumber}</span>
                                        </div>
                                    </div>

                                    <button className="edit-button" onClick={handleEditClick}>Edit</button>
                                </div>
                            ) : (
                                <p>Loading...</p>
                            )}
                        </div>

                        <div className="right-content">
                            {renderContent()}
                        </div>
                    </div>
                </div>
                <Layout></Layout>
            </div>
        </div>
    );
}

export default Cabinet;
