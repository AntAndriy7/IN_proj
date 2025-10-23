import React, {useEffect, useState} from 'react';
import {jwtDecode} from "jwt-decode";
import FlightFilter from "../components/FlightFilter";
import '../styles/Home.css'

function Flight({flight: initialFlight, airLine: initialAirline, onAddClick}) {
    const [flight, setFlight] = useState(initialFlight);
    const [updatedDepartureDate, setUpdatedDepartureDate] = useState('');
    const [updatedDepartureTime, setUpdatedDepartureTime] = useState('');
    const [updatedArrivalDate, setUpdatedArrivalDate] = useState('');
    const [updatedArrivalTime, setUpdatedArrivalTime] = useState('');
    const [updatedPrice, setUpdatedPrice] = useState('');
    const [users, setUsers] = useState([]);
    const [bonusValues, setBonusValues] = useState({});

    const [filter, setFilter] = useState({
        from: "",
        to: "",
        dateFrom: "",
        dateTo: "",
        priceMin: "",
        priceMax: ""
    });

    const airports = [{
        country: "",
        city: "",
        code: "",
        name: "" }
    ];

    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setUpdatedPrice(flight.ticket_price);
        setUpdatedDepartureDate(flight.departure_date);
        setUpdatedDepartureTime(flight.departure_time);
        setUpdatedArrivalDate(flight.arrival_date);
        setUpdatedArrivalTime(flight.arrival_time);
        setIsEditing(true);
    };

    const handleShowClients = () => {
        setIsEditing(false);
    };

    const handleDateChange = (name, value) => {
        let updated = {
            departure_date: updatedDepartureDate,
            departure_time: updatedDepartureTime,
            arrival_date: updatedArrivalDate,
            arrival_time: updatedArrivalTime,
        };

        updated = { ...updated, [name]: value };

        const depDateTime = new Date(`${updated.departure_date}T${updated.departure_time || '00:00'}`);
        const arrDateTime = new Date(`${updated.arrival_date}T${updated.arrival_time || '00:00'}`);

        if (name === "departure_date") {
            if (updated.arrival_date && depDateTime > arrDateTime) {
                updated.arrival_date = updated.departure_date;
                updated.arrival_time = updated.departure_time || '00:00';
            }
        }

        if (name === "arrival_date") {
            if (updated.departure_date && arrDateTime < depDateTime) {
                updated.departure_date = updated.arrival_date;
                updated.departure_time = updated.arrival_time || '00:00';
            }
        }

        if (name === "departure_time") {
            if (updated.arrival_date && updated.arrival_time) {
                const dep = new Date(`${updated.departure_date}T${value}`);
                const arr = new Date(`${updated.arrival_date}T${updated.arrival_time}`);
                if (dep > arr) {
                    updated.arrival_time = value;
                }
            }
        }

        if (name === "arrival_time") {
            if (updated.departure_date && updated.departure_time) {
                const dep = new Date(`${updated.departure_date}T${updated.departure_time}`);
                const arr = new Date(`${updated.arrival_date}T${value}`);
                if (arr < dep) {
                    updated.departure_time = value;
                }
            }
        }

        setUpdatedDepartureDate(updated.departure_date);
        setUpdatedDepartureTime(updated.departure_time);
        setUpdatedArrivalDate(updated.arrival_date);
        setUpdatedArrivalTime(updated.arrival_time);
    };

    const handleSave = () => {
        if (!updatedDepartureDate || !updatedDepartureTime || !updatedArrivalDate || !updatedArrivalTime || !updatedPrice) {
            alert('All fields must be filled');
            handleEdit();
            return;
        }

        const flightDepartureDateTime = new Date(`${flight.departure_date}T${flight.departure_time}`);
        const departureDateTime = new Date(`${updatedDepartureDate}T${updatedDepartureTime}`);
        const arrivalDateTime = new Date(`${updatedArrivalDate}T${updatedArrivalTime}`);

        if (departureDateTime < flightDepartureDateTime) {
            handleEdit();
            alert('Updated departure date and time must be later than the current departure date and time');
            return;
        }

        if (departureDateTime >= arrivalDateTime) {
            handleEdit();
            alert('Departure date and time must be earlier than arrival date and time');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        fetch(`http://localhost:8080/api/flight/${flight.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                departure_date: updatedDepartureDate,
                departure_time: updatedDepartureTime.length === 5 ? `${updatedDepartureTime}:00` : updatedDepartureTime,
                arrival_date: updatedArrivalDate,
                arrival_time: updatedArrivalTime.length === 5 ? `${updatedArrivalTime}:00` : updatedArrivalTime,
                ticket_price: updatedPrice
            }),
        })
            .then(response => {
                if (response.ok) {
                    setFlight(prev => ({
                        ...prev,
                        departure_date: updatedDepartureDate,
                        departure_time: updatedDepartureTime.length === 5 ? `${updatedDepartureTime}:00` : updatedDepartureTime,
                        arrival_date: updatedArrivalDate,
                        arrival_time: updatedArrivalTime.length === 5 ? `${updatedArrivalTime}:00` : updatedArrivalTime,
                        ticket_price: updatedPrice
                    }));
                } else {
                    throw new Error('Failed to update flight');
                }
            })
            .catch(error => {
                console.error('Error updating flight:', error);
            });

        setIsEditing(false);
    };

    const handleCancel = () => {
        const confirmed = window.confirm("Are you sure you want to cancel this flight?");
        if (confirmed) {
            const token = localStorage.getItem('jwtToken');
            fetch(`http://localhost:8080/api/flight/status/${flight.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to cancel flight');
                    setFlight(prev => ({ ...prev, status: false }));
                    fetchUsers();
                })
                .catch(error => {
                    console.error('Error canceling flight:', error);
                });
        }
    };

    const fetchUsers = () => {
        const token = localStorage.getItem('jwtToken');

        fetch(`http://localhost:8080/api/user/flight/${flight.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch users');
                return response.json();
            })
            .then(data => setUsers(data))
            .catch(err => console.error('Error fetching users:', err));
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

            if (!response.ok) throw new Error("Failed to update or create bonus");

            const updated = await response.json();
            setUsers(prevUsers =>
                prevUsers.map(item =>
                    item.user.id === userId
                        ? { ...item, bonus_count: updated.bonus_count }
                        : item
                )
            );

            setBonusValues(prev => ({ ...prev, [userId]: "" }));
            alert("Bonuses updated successfully!");
        } catch (error) {
            console.error("Error updating bonuses:", error);
            alert("Something went wrong while updating bonuses.");
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
                extraButtons={
                    <button className="add-button" onClick={onAddClick}>
                        Add new flight
                    </button>
                }
                showDividerAfterButtons={true}
            />

            <div className="right-content">
                <div className="flight-content">
                    <div className="plane-list-flight">
                        {flight && (
                            <div className="plane-card event-active">
                                <div className="flight-info">
                                    <div className="time-block">
                                        <span className="time-main">{flight.departure_time.slice(0, -3)}</span>
                                        <span className="city-name">{flight.departureCity}</span>
                                        <span className="date-text">
                                            {new Date(flight.departure_date).toLocaleDateString("en-US", {
                                                day: "2-digit",
                                                month: "short",
                                                weekday: "short",
                                            })}
                                        </span>
                                    </div>

                                    <div className="flight-line">
                                        <div className="duration">
                                            In flight:{" "}
                                            {Math.floor(
                                                (new Date(`${flight.arrival_date}T${flight.arrival_time}`) -
                                                    new Date(`${flight.departure_date}T${flight.departure_time}`)) /
                                                3600000
                                            )}
                                            h{" "}
                                            {Math.floor(
                                                ((new Date(`${flight.arrival_date}T${flight.arrival_time}`) -
                                                        new Date(`${flight.departure_date}T${flight.departure_time}`)) %
                                                    3600000) /
                                                60000
                                            )}
                                            m
                                        </div>
                                        <span className="airport-code-left">{flight.departureCode}</span>
                                        <div className="line"></div>
                                        <span className="airport-code-right">{flight.destinationCode}</span>
                                    </div>

                                    <div className="time-block">
                                        <span className="time-main">{flight.arrival_time.slice(0, -3)}</span>
                                        <span className="city-name">{flight.destinationCity}</span>
                                        <span className="date-text">
                                            {new Date(flight.arrival_date).toLocaleDateString("en-US", {
                                                day: "2-digit",
                                                month: "short",
                                                weekday: "short",
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flight-middle">
                                    <div className="airline-name">{initialAirline || "Lufthansa"}</div>
                                    <div className="plane-number">{flight.planeModel}</div>
                                    <div className="seats-info">
                                        Free seats: <b>{flight.seats - flight.occupied_seats}</b> / {flight.seats}
                                    </div>
                                </div>

                                <div className="myFlight-right">
                                    <div className="price">{flight.ticket_price} UAH</div>
                                    <div className="order-status">
                                        {flight.status ? "Active" : "Inactive"}
                                    </div>
                                    <div className="button-row">
                                        {flight.status && (
                                            <button className="view-button" onClick={handleEdit}>
                                                Edit
                                            </button>
                                        )}
                                        <button className="pay-button" onClick={handleShowClients}>
                                            Clients
                                        </button>
                                        {flight.status && (
                                            <button className="cancel-button" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="order-container">
                            {isEditing ? (
                                <div className="flight-edit-form">
                                    <div className="first-edit-section">
                                        <h4 className="edit-section-title">Departure Schedule</h4>
                                        <div className="edit-datetime-grid">
                                            <div className="edit-field">
                                                <label>Departure Date</label>
                                                <input
                                                    type="date"
                                                    value={updatedDepartureDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                                        .toISOString()
                                                        .split('T')[0]}
                                                    onChange={(e) => handleDateChange("departure_date", e.target.value)}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                            <div className="edit-field">
                                                <label>Departure Time</label>
                                                <input
                                                    type="time"
                                                    value={updatedDepartureTime}
                                                    onChange={(e) => handleDateChange("departure_time", e.target.value)}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="edit-section">
                                        <h4 className="edit-section-title">Arrival Schedule</h4>
                                        <div className="edit-datetime-grid">
                                            <div className="edit-field">
                                                <label>Arrival Date</label>
                                                <input
                                                    type="date"
                                                    value={updatedArrivalDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                                        .toISOString()
                                                        .split('T')[0]}
                                                    onChange={(e) => handleDateChange("arrival_date", e.target.value)}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                            <div className="edit-field">
                                                <label>Arrival Time</label>
                                                <input
                                                    type="time"
                                                    value={updatedArrivalTime}
                                                    onChange={(e) => handleDateChange("arrival_time", e.target.value)}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="edit-section">
                                        <h4 className="edit-section-title">Pricing</h4>
                                        <div className="edit-field">
                                            <label>Ticket Price (UAH)</label>
                                            <input
                                                type="number"
                                                value={updatedPrice}
                                                placeholder="0"
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^\d{0,5}$/.test(value)) {
                                                        setUpdatedPrice(value);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    const paste = e.clipboardData.getData('text');
                                                    if (/\D/.test(paste)) e.preventDefault();
                                                }}
                                                className="no-spinner"
                                            />
                                        </div>
                                    </div>

                                    <div className="edit-actions">
                                        <button className="btn-clear" onClick={handleEdit}>Clear</button>
                                        <button className="btn-primary" onClick={handleSave}>Save</button>
                                    </div>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="error-message-nomar">
                                    There are no users who have purchased tickets for this flight.
                                </div>
                            ) : (
                                users.map((item) => (
                                    <div key={item.user.id} className="bonus-card">
                                        <div className="info-section">
                                            <span className="label">Name</span>
                                            <span className="value">{item.user.name}</span>
                                        </div>
                                        <div className="info-section">
                                            <span className="label">Email</span>
                                            <span className="value">{item.user.email}</span>
                                        </div>
                                        <div className="info-section">
                                            <span className="label">Phone</span>
                                            <span className="value">{item.user.phoneNumber}</span>
                                        </div>
                                        <div className="info-section">
                                            <span className="label">Bonuses</span>
                                            <span className="value">{item.bonus_count}</span>
                                        </div>
                                        <div className="bonus-control">
                                            <input
                                                type="number"
                                                className="add-bonus-input no-spinner"
                                                placeholder="Bonus amount"
                                                value={bonusValues[item.user.id] || ""}
                                                onChange={(e) =>
                                                    setBonusValues({
                                                        ...bonusValues,
                                                        [item.user.id]: e.target.value,
                                                    })
                                                }
                                            />
                                            <button
                                                className="order-home-button"
                                                onClick={() => handleSend(item.user.id)}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Flight;