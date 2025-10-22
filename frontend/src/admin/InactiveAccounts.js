import '../styles/Home.css'
import React, {useEffect, useState} from "react";
import FlightFilter from "../components/FlightFilter";
import Pagination from "../components/Pagination";

function InactiveAccounts() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [visibleCards, setVisibleCards] = useState([]);

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

    const fetchUsers = () => {
        const token = localStorage.getItem('jwtToken');

        fetch('http://localhost:8080/api/user/out', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.status === 404) {
                    setError("No inactive accounts.");
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

                const filteredUsers = data.filter(user => user.role !== 'ADMIN');
                setUsers(filteredUsers);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError('Failed to fetch users');
            });
    };

    const handleDelete = async (userId) => {
        const confirmed = window.confirm("Are you sure you want to delete this account?");
        if (confirmed) {
            try {
                const token = localStorage.getItem('jwtToken');
                const response = await fetch(`http://localhost:8080/api/user/delete/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    alert("Account successfully deleted");
                    setUsers(users.filter(user => user.id !== userId));
                } else {
                    alert("Failed to delete account");
                }
            } catch (err) {
                console.error('Error deleting user:', err);
                alert("There was an error deleting the account.");
            }
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="home-layout">
            <FlightFilter
                filter={filter}
                setFilter={setFilter}
                airports={airports}
                disabled={true}
            />

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
                                        <span className="label">Role</span>
                                        <span className="value">{user.role}</span>
                                    </div>
                                    <div className="info-section">
                                        <span className="label">Last activity</span>
                                        <span className="value">{user.recentActivity}</span>
                                    </div>
                                </div>
                                <div className="flight-right">
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InactiveAccounts;
