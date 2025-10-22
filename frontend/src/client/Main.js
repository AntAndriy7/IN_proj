import '../styles/Main.css';
import { jwtDecode } from "jwt-decode";
import logoImage from "../resources/plane-icon.png";
import {useNavigate} from "react-router-dom";
import Home from "./Home";
import cabinetImage from "../resources/cabinet.png";
import {useState} from "react";
import Order from "./Order";
import Map from "../Map";
import Layout from "../components/Layout";

function Main() {
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');
    let user = null;

    try {
        if (token) {
            const decodedToken = jwtDecode(token);
            const { name } = decodedToken;
            user = { name };
        }
    } catch (error) {
        console.error("Invalid token", error);
    }

    const [activePage, setActivePage] = useState('home');
    const [selectedFlight, setSelectedFlight] = useState(null);

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return <Home onOrderClick={handleOrderClick} />;
            case 'order':
                return <Order flight={selectedFlight}/>;
            case 'map':
                return <Map />;
            default:
                return <Home onOrerClick={handleOrderClick} />;
        }
    };

    const handleOrderClick = (flight) => {
        setSelectedFlight(flight);
        setActivePage('order');
    };

    return (
        <div className="user-page">
            <header className="header">
                <div className="header-left" title="Home" onClick={() => {
                    navigate('/main');
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
                    {user ? (
                        <button className="login-button" onClick={() => navigate('/cabinet')}>{user.name}
                            <img src={cabinetImage} alt="logo" className="cabinetImage"/>
                        </button>
                    ) : (
                        <button className="login-button" onClick={() => navigate('/login')}>Login</button>
                    )}
                </div>
            </header>

            <div className="scroll-area">
                <div className={`main-content ${activePage === 'map' ? 'map-fullscreen' : ''}`}>
                    {renderContent()}
                </div>
                {activePage !== 'map' &&  <Layout></Layout>}
            </div>
        </div>
    );
}

export default Main;
