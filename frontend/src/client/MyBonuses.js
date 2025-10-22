import React, {useEffect, useState} from 'react';
import '../styles/Home.css';
import {jwtDecode} from "jwt-decode";

function MyBonuses() {
    const [bonuses, setBonuses] = useState([]);
    const [error, setError] = useState(null);
    const [aviaNames, setAviaNames] = useState({});

    const fetchBonuses = async () => {
        const token = localStorage.getItem('jwtToken');
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        try {
            const response = await fetch(`http://localhost:8080/api/bonus/client/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 404) {
                setError("You have no bonuses yet.");
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch bonuses');
            }

            const data = await response.json();
            setBonuses(data[0]);

            const namesMap = {};
            data[1].forEach(company => {
                namesMap[company.id] = company.name;
            });
            setAviaNames(namesMap);

        } catch (err) {
            setError(err);
            console.error('Error fetching bonuses or avia companies:', err);
        }
    };

    useEffect(() => {
        fetchBonuses();
    }, []);

    return (
        <div className="flight-content">
            <div className="plane-card">
                {error && <p className="error-message">{error}</p>}
                {bonuses.map((bonus) => {
                    return (
                        <div key={bonus.id} className="ticket-card-my">
                            <div className="plane-info-list">
                                <div className="info-section">
                                    <span className="label">Avia-company</span>
                                    <span className="value">{aviaNames[bonus.avia_id] || 'Loading...'}</span>
                                </div>
                            </div>
                            <div className="plane-info-list">
                                <div className="info-section-ticket">
                                    <span className="label">Amount</span>
                                    <span className="value">{bonus.bonus_count}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MyBonuses;