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

    const fetchUsers = () => {
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        fetch(`http://localhost:8080/api/user/avia/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.status === 404) {
                    setError("No clients yet.");
                    setUsers([]);
                    return null;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;

                setUsers(data);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError('Failed to fetch users');
            });
    };

    const handleSend = async (userId) => {
        const inputValue = bonusValues[userId];

        if (!inputValue || inputValue.trim() === "") {
            alert("Please enter a bonus value.");
            return;
        }

        const amount = parseInt(inputValue, 10);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid whole number greater than zero.");
            return;
        }

        const token = localStorage.getItem("jwtToken");
        const decoded = jwtDecode(token);
        const aviaId = decoded.id;

        try {
            const response = await fetch("http://localhost:8080/api/bonus", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    avia_id: aviaId,
                    client_id: userId,
                    bonus_count: amount,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update or create bonus");
            }

            const updated = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(item =>
                    item.id === userId
                        ? { ...item, bonus_count: updated.bonus_count }
                        : item
                )
            );

            setBonusValues(prev => ({
                ...prev,
                [userId]: ""
            }));

            alert("Bonuses updated successfully!");
        } catch (error) {
            console.error("Error updating bonuses:", error);
            alert("Something went wrong while updating bonuses.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const decoded = jwtDecode(token);
        const aviaRole = decoded.role;
        
        if (aviaRole !== 'AVIA') {
            navigate('/avia/main');
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
                                        onChange={(e) =>
                                            setBonusValues({ ...bonusValues, [user.id]: e.target.value })
                                        }
                                    />
                                    <button className="order-home-button" onClick={() => handleSend(user.id)}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Clients;
