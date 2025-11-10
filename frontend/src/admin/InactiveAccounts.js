import '../styles/Home.css'
import React, {useEffect, useState} from "react";
import FlightFilter from "../components/FlightFilter";
import Pagination from "../components/Pagination";

function InactiveAccounts() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [visibleCards, setVisibleCards] = useState([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

                const filteredUsers = data.filter(user => user.role !== 'ADMIN');
                setUsers(filteredUsers);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError(err.message || 'Failed to fetch users');
            });
    };

    const handleDelete = async (userId) => {
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
                setUsers(users.filter(user => user.id !== userId));
            } else {
                setError("Failed to delete account.");
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setError("There was an error deleting the account.");
        }
        finally {
            setConfirmDeleteId(null);
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
                                    {confirmDeleteId === user.id ? (
                                        <>
                                            <div>Are you sure you want to delete this account?</div>
                                            <div className="button-row">
                                                <button
                                                    className="cancel-button"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    className="view-button"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            className="delete-button"
                                            onClick={() => setConfirmDeleteId(user.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
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
