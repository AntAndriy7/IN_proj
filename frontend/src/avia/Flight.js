import React, {useEffect, useRef, useState} from 'react';
import FlightFilter from "../components/FlightFilter";
import '../styles/Home.css'
import DateTime from "../components/DateTime";

function Flight({flight: initialFlight, airLine: initialAirline, onAddClick}) {
    const [flight, setFlight] = useState(initialFlight);
    const [updatedDepartureDate, setUpdatedDepartureDate] = useState('');
    const [updatedDepartureTime, setUpdatedDepartureTime] = useState('');
    const [updatedArrivalDate, setUpdatedArrivalDate] = useState('');
    const [updatedArrivalTime, setUpdatedArrivalTime] = useState('');
    const [updatedPrice, setUpdatedPrice] = useState('');
    const [users, setUsers] = useState([]);
    const [bonusValues, setBonusValues] = useState({});
    const [confirmCancel, setConfirmCancel] = useState(false);

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

    const [fillError, setFillError] = useState('');
    const [departureError, setDepartureError] = useState('');
    const [arrivalError, setArrivalError] = useState('');
    const [priceError, setPriceError] = useState('');
    const [bonusErrors, setBonusErrors] = useState({});

    const fillErrorRef = useRef(null);
    const departureErrorRef = useRef(null);
    const arrivalErrorRef = useRef(null);
    const priceErrorRef = useRef(null);
    const [errorTrigger, setErrorTrigger] = useState(0);

    useEffect(() => {
        if (fillError && fillErrorRef.current) {
            fillErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (departureError && departureErrorRef.current) {
            departureErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (arrivalError && arrivalErrorRef.current) {
            arrivalErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (priceError && priceErrorRef.current) {
            priceErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [fillError, departureError, arrivalError, priceError, errorTrigger]);

    const handleEdit = () => {
        setFillError('');
        setDepartureError('');
        setArrivalError('');
        setPriceError('');
        setErrorTrigger(0);

        setUpdatedPrice(flight.ticket_price);
        setUpdatedDepartureDate(flight.departure_date);
        setUpdatedDepartureTime(flight.departure_time.slice(0, 5));
        setUpdatedArrivalDate(flight.arrival_date);
        setUpdatedArrivalTime(flight.arrival_time.slice(0, 5));
        setIsEditing(true);
    };

    const handleShowClients = () => {
        setBonusErrors({});
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
        setFillError('');
        setDepartureError('');
        setArrivalError('');
        setPriceError('');

        if (!updatedDepartureDate || !updatedDepartureTime || !updatedArrivalDate || !updatedArrivalTime || !updatedPrice) {
            handleEdit();
            setFillError('All fields must be filled');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        const flightDepartureDateTime = new Date(`${flight.departure_date}T${flight.departure_time}`);
        const departureDateTime = new Date(`${updatedDepartureDate}T${updatedDepartureTime}`);
        const arrivalDateTime = new Date(`${updatedArrivalDate}T${updatedArrivalTime}`);

        if (departureDateTime < flightDepartureDateTime) {
            handleEdit();
            setDepartureError('Updated departure date and time must be later than the current departure date and time');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (departureDateTime >= arrivalDateTime) {
            handleEdit();
            setArrivalError('Departure date and time must be earlier than arrival date and time');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        const minPrice = 50;
        if (Number(updatedPrice) < minPrice) {
            setPriceError(`Ticket price must be at least ${minPrice} UAH.`);
            setErrorTrigger(prev => prev + 1);
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
            .then(async (response) => {
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
                    const data = await response.json().catch(() => null);
                    const errorMessage = data?.message || 'Failed to update flight';
                    throw new Error(errorMessage);
                }
            })
            .catch(error => {
                console.error('Error updating flight:', error);
                setFillError(error.message || 'Failed to update flight');
            });

        setIsEditing(false);
    };

    const handleCancel = () => {
        const token = localStorage.getItem('jwtToken');
        fetch(`http://localhost:8080/api/flight/status/${flight.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
            .then(async (response) => {
                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    const errorMessage = data?.message || 'Failed to cancel flight';
                    throw new Error(errorMessage);
                }
                setFlight(prev => ({ ...prev, status: false }));
                fetchUsers();
            })
            .catch(error => {
                console.error(error.message || 'Failed to cancel flight');
            });
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
            .then(async (response) => {
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    const errorMessage = data?.message || 'Failed to fetch users';
                    throw new Error(errorMessage);
                }

                return data;
            })
            .then(data => setUsers(data))
            .catch(err => { console.error(err.message || 'Failed to fetch users'); });
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
                    item.user.id === userId
                        ? { ...item, bonus_count: data.bonus_count }
                        : item
                )
            );

            setBonusValues(prev => ({ ...prev, [userId]: "" }));
        } catch (error) {
            console.error("Error updating bonuses:", error);
            newErrors[userId] = error.message || `Something went wrong while updating bonuses.`;
            setBonusErrors(newErrors);
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
                                    {confirmCancel ? (
                                        <>
                                            <div className="confirm-massage">Are you sure you want to cancel this flight?</div>
                                            <div className="button-row">
                                                <button
                                                    className="cancel-button"
                                                    onClick={handleCancel}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    className="view-button"
                                                    onClick={() => setConfirmCancel(false)}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
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
                                                    <button className="cancel-button" onClick={() => setConfirmCancel(true)}>
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="order-container">
                            {isEditing ? (
                                <div className="flight-edit-form">
                                    <DateTime
                                        updatedDepartureDate={updatedDepartureDate}
                                        updatedDepartureTime={updatedDepartureTime}
                                        updatedArrivalDate={updatedArrivalDate}
                                        updatedArrivalTime={updatedArrivalTime}
                                        updatedPrice={updatedPrice}
                                        setUpdatedPrice={setUpdatedPrice}
                                        handleDateChange={handleDateChange}
                                        handleEdit={handleEdit}
                                        handleSave={handleSave}
                                        fillError = {fillError}
                                        arrivalError = {arrivalError}
                                        departureError = {departureError}
                                        priceError = {priceError}
                                        fillErrorRef = {fillErrorRef}
                                        departureErrorRef={departureErrorRef}
                                        arrivalErrorRef={arrivalErrorRef}
                                        priceErrorRef={priceErrorRef}
                                    />
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
                                        <div className="info-section">
                                            <div className="bonus-control">
                                                <input
                                                    type="number"
                                                    className="add-bonus-input no-spinner"
                                                    placeholder="0"
                                                    value={bonusValues[item.user.id] || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d{0,5}$/.test(value)) {
                                                            setBonusValues({
                                                                ...bonusValues,
                                                                [item.user.id]: value,
                                                            });
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="order-home-button"
                                                    onClick={() => handleSend(item.user.id)}
                                                >
                                                    Send
                                                </button>
                                            </div>
                                            {bonusErrors[item.user.id] && <p className="bonus-error">{bonusErrors[item.user.id]}</p>}
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