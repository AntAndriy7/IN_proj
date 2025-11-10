import React, {useEffect, useState} from 'react';
import '../styles/Home.css';

function MyBonuses() {
    const [bonuses, setBonuses] = useState([]);
    const [error, setError] = useState(null);
    const [aviaNames, setAviaNames] = useState({});

    const fetchBonuses = async () => {
        const token = localStorage.getItem('jwtToken');

        try {
            const response = await fetch(`http://localhost:8080/api/bonus/client`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMessage = data?.message || 'Failed to fetch bonuses';
                throw new Error(errorMessage);
            }

            setBonuses(data.bonuses || []);

            const namesMap = {};
            (data.avia_companies || []).forEach(company => {
                namesMap[company.id] = company.name;
            });
            setAviaNames(namesMap);

        } catch (err) {
            console.error('Error fetching bonuses or avia companies:', err);
            setError(err.message || 'Failed to fetch bonuses');
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