import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import FlightFilter from "../components/FlightFilter";

function Order({flight}) {
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');
    const [error, setError] = useState(null);
    const [useMyData, setUseMyData] = useState(false);
    const [tickets, setTickets] = useState([{ name: '', surname: '' }]);
    const [orderMessage, setOrderMessage] = useState('');
    const [bonus, setBonus] = useState(null);
    const [usedBonuses, setUsedBonuses] = useState(0);
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

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
        else {
            fetchBonus();
        }
    }, [token, navigate]);

    const fetchBonus = async () => {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;

        try {
            const response = await fetch(
                `http://localhost:8080/api/bonus/client/${userId}/avia/${flight.avia_id}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 404) {
                setBonus({ bonus_count: 0 });
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch bonus');
            }

            const bonusData = await response.json();
            setBonus(bonusData);
        } catch (error) {
            setError(error);
            console.error('Error fetching bonus:', error);
        }
    };

    const getTotalPrice = () => {
        const ticketPrice = flight.ticket_price;
        const totalPrice = ticketPrice * tickets.length - usedBonuses;
        return totalPrice >= 0 ? totalPrice : 0;
    }

    let myName = '';
    let mySurname = '';
    if (token) {
        const decodedToken = jwtDecode(token);
        const { name } = decodedToken;
        [myName, mySurname] = name.split(' ');
    }

    const handleUseMyDataChange = () => {
        setUseMyData(!useMyData);
        if (!useMyData) {
            setTickets((prevTickets) => {
                const updatedTickets = [...prevTickets];
                updatedTickets[0] = { name: myName, surname: mySurname };
                return updatedTickets;
            });
        } else {
            setTickets((prevTickets) => {
                const updatedTickets = [...prevTickets];
                updatedTickets[0] = { name: '', surname: '' };
                return updatedTickets;
            });
        }
    };

    const handleAddTicket = () => {
        if (tickets.length < 8) {
            setTickets([...tickets, { name: '', surname: '' }]);
        }
    };

    const handleBonusChange = (event) => {
        const value = Math.max(0, Math.min(Math.min(bonus?.bonus_count || 0, flight.ticket_price * tickets.length), Number(event.target.value)));
        setUsedBonuses(value);
    };

    const handleMakeOrder = async (event) => {
        event.preventDefault();

        const allFieldsFilled = tickets.every(ticket => ticket.name && ticket.surname);

        if (!allFieldsFilled) {
            setOrderMessage('Please fill in all fields for each ticket.');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;

                await fetch(`http://localhost:8080/api/order?tickets=${getFormattedNames().join(',')}&usedBonuses=${usedBonuses}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        client_id: userId,
                        flight_id: flight.id,
                        ticket_quantity: tickets.length,
                        total_price: getTotalPrice(),
                        payment_status: 'booked',
                    }),
                });

                setOrderMessage('Order placed successfully!');
                navigate('/cabinet');
            } catch (error) {
                console.error('Failed to place order:', error);
                setOrderMessage('Failed to place order.');
            }
        }
    }

    const handleTicketChange = (index, field, value) => {
        const cleanedValue = value
            .replace(/[^a-zA-Z' -]/g, '')
            .replace(/\s{2,}/g, ' ')
            .slice(0, 100)
            .toUpperCase();

        const updatedTickets = tickets.map((ticket, i) =>
            i === index ? { ...ticket, [field]: cleanedValue } : ticket
        );

        setTickets(updatedTickets);
    };

    const handleRemoveTicket = (index) => {
        setTickets(tickets.filter((_, i) => i !== index));
    };

    const getFormattedNames = () => {
        return tickets.map(ticket => `${ticket.name} ${ticket.surname}`.toUpperCase());
    };

    return (
        <div className="home-layout">
            <FlightFilter
                filter={filter}
                setFilter={setFilter}
                airports={airports}
                disabled={true}
            />

            <div className="right-content">
                <div className="flight-content">
                    {error && <p className="error-message">{error}</p>}
                    <div className="plane-list">
                        <div key={flight.id}>
                            <div className="plane-card event-active">
                                <div className="flight-info">
                                    <div className="time-block">
                                        <span className="time-main">{flight.departure_time.slice(0, -3)}</span>
                                        <span className="city-name">{flight.departureCity}</span>
                                        <span className="date-text">
                                                {new Date(flight.departure_date).toLocaleDateString('en-US', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    weekday: 'short'
                                                })}
                                            </span>
                                    </div>

                                    <div className="flight-line">
                                        <div className="duration">
                                            In flight: {
                                            Math.floor(
                                                (new Date(`${flight.arrival_date}T${flight.arrival_time}`) -
                                                    new Date(`${flight.departure_date}T${flight.departure_time}`)) /
                                                3600000
                                            )
                                        }h {
                                            Math.floor(
                                                ((new Date(`${flight.arrival_date}T${flight.arrival_time}`) -
                                                    new Date(`${flight.departure_date}T${flight.departure_time}`)) % 3600000) /
                                                60000
                                            )
                                        }m
                                        </div>
                                        <span className="airport-code-left">{flight.departureCode}</span>
                                        <div className="line"></div>
                                        <span className="airport-code-right">{flight.destinationCode}</span>
                                    </div>

                                    <div className="time-block">
                                        <span className="time-main">{flight.arrival_time.slice(0, -3)}</span>
                                        <span className="city-name">{flight.destinationCity}</span>
                                        <span className="date-text">
                                                {new Date(flight.arrival_date).toLocaleDateString('en-US', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    weekday: 'short'
                                                })}
                                            </span>
                                    </div>
                                </div>
                                <div className="flight-middle">
                                    <div className="airline-name">{flight.airlineName}</div>
                                    <div className="plane-number">{flight.planeModel}</div>
                                    <div className="seats-info">
                                        Free seats: <b>{flight.seats - flight.occupied_seats}</b> / {flight.seats}
                                    </div>
                                </div>

                                <div className="flight-right">
                                    <div className="price">{flight.ticket_price} UAH</div>
                                </div>
                            </div>
                            <div className="order-container">
                                <div className="tickets-section">
                                    <div className="tickets-grid">
                                        {tickets.map((ticket, index) => (
                                            <div key={index} className="ticket-card">
                                                <div className="ticket-header">
                                                    <h3>Ticket {index + 1}</h3>
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTicket(index)}
                                                            className="remove-ticket-button"
                                                            title="Remove ticket"
                                                        >
                                                            ✖
                                                        </button>
                                                    )}
                                                    {index === 0 && (
                                                        <label className="use-my-data">
                                                            <span>Use my data</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={useMyData}
                                                                onChange={handleUseMyDataChange}
                                                            />
                                                            <span className="checkbox-box"></span>
                                                        </label>
                                                    )}
                                                </div>

                                                <div className="ticket-fields">
                                                    <label>
                                                        <span>Name</span>
                                                        <input
                                                            type="text"
                                                            className="ticket-input"
                                                            value={ticket.name}
                                                            onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                                                            disabled={useMyData && index === 0}
                                                        />
                                                    </label>
                                                    <label>
                                                        <span>Surname</span>
                                                        <input
                                                            type="text"
                                                            className="ticket-input"
                                                            value={ticket.surname}
                                                            onChange={(e) => handleTicketChange(index, 'surname', e.target.value)}
                                                            disabled={useMyData && index === 0}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {tickets.length < 8 && (
                                            <div className="ticket-add">
                                                <button
                                                    type="button"
                                                    onClick={handleAddTicket}
                                                    className="add-ticket-button"
                                                    title="Add ticket"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            )}
                                    </div>
                                </div>

                                {orderMessage && <p className="order-message">{orderMessage}</p>}

                                <div className="order-summary">
                                    <div className="bonus-section">
                                        <div className="bonus-row">
                                            <span>Available bonuses:</span>
                                            <span className="bonus-value">{bonus?.bonus_count || 0}</span>
                                        </div>

                                        <div className="bonus-row">
                                            <label>
                                                <span>Use bonuses:</span>
                                                <input
                                                    type="number"
                                                    className="ticket-input bonus-input"
                                                    value={usedBonuses}
                                                    onChange={handleBonusChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="price-section">
                                        <strong>Total price:</strong>
                                        <span className="total-value">{getTotalPrice()} UAH</span>
                                    </div>

                                    <button type="button" onClick={handleMakeOrder} className="order-button">
                                        Confirm order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Order;