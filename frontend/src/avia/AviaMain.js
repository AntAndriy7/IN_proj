import '../styles/Main.css';
import { jwtDecode } from "jwt-decode";
import logoImage from "../resources/plane-icon.png";
import {useNavigate} from "react-router-dom";
import cabinetImage from "../resources/cabinet.png";
import React, {useState} from "react";
import AviaHome from "./AviaHome";
import Flight from "./Flight";
import PlaneMap from "../PlaneMap";
import Add from "./Add";
import Layout from "../components/Layout";
import FlightFilter from "../components/FlightFilter";

function AviaMain() {
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');
    const decodedToken = jwtDecode(token);
    const { role, name } = decodedToken;
    const user = { name };

    const [activePage, setActivePage] = useState('home');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedAirline, setSelectedAirline] = useState(null);

    const [filter, setFilter] = useState({
        from: "",
        to: "",
        dateFrom: "",
        dateTo: "",
        priceMin: "",
        priceMax: ""
    });
    const airports = [
        { country: "", city: "", code: "", name: "" }
    ];

    const renderTemporaryContent = () => {
        switch (activePage) {
            case 'home':
                return <div className="home-layout">
                    <FlightFilter
                        filter={filter}
                        setFilter={setFilter}
                        airports={airports}
                        disabled={true}
                    />

                    <div className="right-content">
                        <div className="flight-content">
                            <h2>Your account is not verified. Please contact the administration to get full access.</h2>
                        </div>
                    </div>
                </div>;
            case 'map':
                return <PlaneMap/>;
            default:
                return <div className="home-layout">
                    <FlightFilter
                        filter={filter}
                        setFilter={setFilter}
                        airports={airports}
                        disabled={true}
                    />

                    <div className="right-content">
                        <div className="flight-content">
                            <h2>Your account is not verified. Please contact the administration to get full access.</h2>
                        </div>
                    </div>
                </div>;
        }
    };

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return <AviaHome onViewClick={handleViewClick} onAddClick={handleAddClick} />;
            case 'flight':
                return <Flight flight={selectedFlight} airLine={selectedAirline} onAddClick={handleAddClick}/>;
            case 'map':
                return <PlaneMap/>;
            case 'add':
                return <Add/>
            default:
                return <AviaHome onViewClick={handleViewClick} onAddClick={handleAddClick} />;
        }
    };

    const handleViewClick = (flight, airLine) => {
        setSelectedFlight(flight);
        setSelectedAirline(airLine);
        setActivePage('flight');
    };

    const handleAddClick = () => {
        setActivePage('add');
    };

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" title="Home" onClick={() => {
                    navigate('/avia/main');
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
                        className={`nav-button ${activePage === 'map' ? 'active' : ''}`}
                        onClick={() => setActivePage('map')}
                    >
                        Map
                    </button>
                </div>
                <div className="header-right">
                    <button className="login-button" onClick={() => navigate('/avia/cabinet')}>{user.name}
                        <img src={cabinetImage} alt="logo" className="cabinetImage"/>
                    </button>
                </div>
            </header>

            <div className="scroll-area">
                <div className={`main-content ${activePage === 'map' ? 'map-fullscreen' : ''}`}>
                    {role === 'AVIA' ? renderContent() : renderTemporaryContent()}
                </div>
                {activePage !== 'map' &&  <Layout></Layout>}
            </div>
        </div>
    );
}

export default AviaMain;
