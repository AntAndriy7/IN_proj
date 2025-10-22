import '../styles/Main.css';
import '../styles/Home.css';
import logoImage from "../resources/plane-icon.png";
import {useNavigate} from "react-router-dom";
import React, {useState} from "react";
import AdminHome from "./AdminHome";
import AdminFlight from "./AdminFlight";
import InactiveAccounts from "./InactiveAccounts";
import Layout from "../components/Layout";

function AdminMain() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('home');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedAirline, setSelectedAirline] = useState(null);

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return <AdminHome onViewClick={handleViewClick} />;
            case 'accounts':
                return <InactiveAccounts />;
            case 'flight':
                return <AdminFlight flight={selectedFlight} airlineName={selectedAirline}/>;
            default:
                return <AdminHome onViewClick={handleViewClick} />;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    }

    const handleViewClick = (flight, airlineName) => {
        setSelectedFlight(flight);
        setSelectedAirline(airlineName);
        setActivePage('flight');
    };

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" title="Home" onClick={() => {
                    navigate('/admin/main');
                    window.location.reload();
                }}>
                    <div className="logo">
                        <span>Kyiv</span>
                        <span>International</span>
                        <span>Airport</span>
                    </div>
                    <img src={logoImage} alt="logo" className="logoImage"/>
                </div>
                <div className="header-center">
                    <button
                        className={`nav-button ${activePage === 'home' ? 'active' : ''}`}
                            onClick={() => setActivePage('home')}
                    >
                        Flights
                    </button>
                    <div className="vertical-line"></div>
                    <button
                        className={`nav-button ${activePage === 'accounts' ? 'active' : ''}`}
                            onClick={() => setActivePage('accounts')}
                    >
                        Inactive Accounts
                    </button>
                </div>
                <div className="header-right">
                    <div className="admin-text">ADMIN</div>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="scroll-area">
                <div className="main-content">
                    {renderContent()}
                </div>
                <Layout></Layout>
            </div>
        </div>
    );
}

export default AdminMain;
