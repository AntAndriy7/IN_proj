import '../styles/Home.css'
import React, {useEffect, useState} from "react";
import Pagination from "../components/Pagination";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";

function Clients() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [visibleCards, setVisibleCards] = useState([]);
    const [bonusValues, setBonusValues] = useState({});
    const token = localStorage.getItem('jwtToken');
    const navigate = useNavigate();

    const [bonusErrors, setBonusErrors] = useState({});

    const fetchUsers = () => {
        fetch(`http://localhost:8080/api/user/avia`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    const errorMessage = data?.message || 'Failed to fetch users';
                    setUsers([]);
                    throw new Error(errorMessage);
                }

                return data;
            })
            .then(data => {
                if (!data) return;

                setUsers(data);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError(err.message || 'Failed to fetch users');
            });
    };

    const handleSend = async (userId) => {
        setBonusErrors({});

        const inputValue = bonusValues[userId];
        const newErrors = {};

        if (!inputValue || inputValue.trim() === "") {
            newErrors[userId] = "Please enter a bonus value.";
            setBonusErrors(newErrors);
            return;
        }

        const amount = parseInt(inputValue, 10);
        if (isNaN(amount) || amount <= 0) {
            newErrors[userId] = "Please enter a valid whole number greater than zero.";
            setBonusErrors(newErrors);
            return;
        }

        const token = localStorage.getItem("jwtToken");

        try {
            const response = await fetch("http://localhost:8080/api/bonus", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: userId,
                    bonus_count: amount,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMessage = data?.message || 'Failed to send bonuses';
                throw new Error(errorMessage);
            }

            setUsers(prevUsers =>
                prevUsers.map(item =>
                    item.id === userId
                        ? { ...item, bonus_count: data.bonus_count }
                        : item
                )
            );

            setBonusValues(prev => ({
                ...prev,
                [userId]: ""
            }));

        } catch (error) {
            console.error("Error updating bonuses:", error);
            newErrors[userId] = error.message || `Something went wrong while updating bonuses.`;
            setBonusErrors(newErrors);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (token) {
            const decoded = jwtDecode(token);
            const aviaRole = decoded.role;
            if (aviaRole !== 'AVIA') {
                navigate('/avia/main');
            }
        }
    }, [navigate, token]);

    return (
        <div className="right-content">
            <Pagination
                data={users}
                initialPerPage={7}
                onPageChange={setVisibleCards}
            />
            <div className="flight-content">
                {error && <p className="error-message">{error}</p>}
                <div className="plane-list">
                    {visibleCards.map(user => (
                        <div key={user.id} className="plane-card">
                            <div className="user-info">
                                <div className="info-section">
                                    <span className="label">Name</span>
                                    <span className="value">{user.name}</span>
                                </div>
                                <div className="info-section">
                                    <span className="label">Email</span>
                                    <span className="value">{user.email}</span>
                                </div>
                                <div className="info-section">
                                    <span className="label">Phone number</span>
                                    <span className="value">{user.phoneNumber}</span>
                                </div>
                                <div className="info-section">
                                    <span className="label">Bonuses</span>
                                    <span className="value">{user.bonus_count}</span>
                                </div>
                            </div>
                            <div className="flight-right">
                                <div className="bonus-control">
                                    <input
                                        type="number"
                                        className="add-bonus-input no-spinner"
                                        placeholder="Bonus amount"
                                        value={bonusValues[user.id] || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d{0,5}$/.test(value)) {
                                                setBonusValues({ ...bonusValues, [user.id]: value })
                                            }
                                        }}
                                    />
                                    <button className="order-home-button" onClick={() => handleSend(user.id)}>
                                        Send
                                    </button>
                                </div>
                                {bonusErrors[user.id] && <p className="bonus-error">{bonusErrors[user.id]}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Clients;
