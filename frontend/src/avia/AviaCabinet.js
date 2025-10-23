import '../styles/Main.css';
import '../styles/Home.css';
import logoImage from "../resources/plane-icon.png";
import cabinetImageCab from "../resources/cabinet.png";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Clients from "./Clients";
import EditPersonalAvia from "./EditPersonalAvia";
import Layout from "../components/Layout";

function AviaCabinet() {
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');
    const decoded = jwtDecode(token);
    const aviaRole = decoded.role;
    const [activePage, setActivePage] = useState(aviaRole === 'AVIA' ? 'clients' : 'editPersonalAvia');
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    const renderContent = () => {
        switch (activePage) {
            case 'clients':
                return <Clients />;
            case 'editPersonalAvia':
                return (
                    <EditPersonalAvia
                        user={user}
                    />
                );
            default:
                return <Clients />;
        }
    };

    const fetchUser = () => {
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
                setUser({ name: data.name, email: data.email, phoneNumber: data.phoneNumber });
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                setError('Failed to fetch user data');
            });
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    const handleEditClick = () => {
        setActivePage('editPersonalAvia');
    };

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" title="Home" onClick={() => navigate('/avia/main')}>
                    <div className="logo">
                        <span>Kyiv</span>
                        <span>International</span>
                        <span>Airport</span>
                    </div>
                    <img src={logoImage} alt="logo" className="logoImage"/>
                </div>
                <div className="header-center">
                    {aviaRole === 'AVIA' && (
                        <button
                            className={`nav-button ${activePage === 'clients' ? 'active' : ''}`}
                            onClick={() => setActivePage('clients')}
                        >
                            Clients
                        </button>
                    )}
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

export default AviaCabinet;
