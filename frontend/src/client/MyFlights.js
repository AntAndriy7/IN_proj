import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import { jwtDecode } from 'jwt-decode';
import Pagination from "../components/Pagination";

function MyFlights() {
    const [orders, setOrders] = useState([]);
    const [tickets, setTickets] = useState({});
    const [error, setError] = useState(null);
    const [payOrderId, setPayOrderId] = useState(null);
    const [viewOrderId, setViewOrderId] = useState(null);
    const [visibleCards, setVisibleCards] = useState([]);

    const [formValues, setFormValues] = useState({
        cardNumber: '',
        cardholderName: '',
        expirationDate: '',
        cvv: '',
    });

    const token = localStorage.getItem('jwtToken');
    const decodedToken = jwtDecode(token);
    const { id } = decodedToken;

    useEffect(() => {
        fetchOrdersByClientId(id);
    }, [id]);

    const fetchOrdersByClientId = async (id) => {
        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch(`http://localhost:8080/api/order/client/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 404) {
                setOrders([]);
                setTickets({});
                setError("You have no orders yet.");
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length < 6) {
                setError("Unexpected response format");
                return;
            }

            const [flightsArr, airlinesArr, planesArr, airportsArr, ordersArr, ticketsArr] = data;

            const airlineMap = Object.fromEntries(airlinesArr.map(a => [a.id, a.name]));
            const planeMap = Object.fromEntries(planesArr.map(p => [p.id, p]));
            const airportMap = Object.fromEntries(airportsArr.map(a => [a.id, a]));
            const flightMap = Object.fromEntries(flightsArr.map(f => [f.id, f]));

            const processedOrders = ordersArr.map(o => {
                const flight = flightMap[o.flight_id]
                const departure = airportMap[flight.departure_id];
                const destination = airportMap[flight.destination_id];

                return {
                    ...o,
                    departure_date: flight?.departure_date || 'Unknown',
                    arrival_date: flight?.arrival_date || 'Unknown',
                    departure_time: flight?.departure_time || 'Unknown',
                    arrival_time: flight?.arrival_time || 'Unknown',
                    status: flight?.status || false,
                    seats: planeMap[flight.plane_id]?.seats_number || 0,
                    departureCity: departure?.city || 'Unknown',
                    departureCode: departure?.code || '',
                    departureName: departure?.name || '',
                    destinationCity: destination?.city || 'Unknown',
                    destinationCode: destination?.code || '',
                    destinationName: destination?.name || '',
                    airlineName: airlineMap[flight.avia_id] || 'Unknown airline',
                    planeModel: planeMap[flight.plane_id]?.model || 'Unknown plane'
                };
            }).sort((a, b) => {
                if (a.status !== b.status) {
                    return b.status - a.status;
                }

                const dateA = new Date(a.departure_date + 'T' + a.departure_time);
                const dateB = new Date(b.departure_date + 'T' + b.departure_time);

                if (a.status) {
                    return dateA - dateB;
                }

                return dateB - dateA;
            });

            setOrders(processedOrders);

            const ticketsMap = {};
            for (const t of ticketsArr) {
                if (!ticketsMap[t.order_id]) ticketsMap[t.order_id] = [];
                ticketsMap[t.order_id].push(t);
            }
            setTickets(ticketsMap);

            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to fetch orders');
        }
    };

    const handleCancel = async (orderId) => {
        const confirmed = window.confirm('Cancel this order?');
        if (!confirmed) return;

        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`http://localhost:8080/api/order/${orderId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: 'canceled' })
        });

        if (response.ok) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'canceled' } : o));
        } else alert('Failed to cancel order');
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        switch (name) {
            case 'cardNumber':
                formattedValue = value.replace(/\D/g, '').slice(0, 16);
                formattedValue = formattedValue.replace(/(.{4})/g, '$1 ').trim();
                break;

            case 'cardholderName':
                formattedValue = value
                    .replace(/[^a-zA-Z' -]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .slice(0, 200)
                    .toUpperCase();
                break;

            case 'expirationDate':
                const digits = value.replace(/\D/g, '').slice(0, 4);
                let month = digits.slice(0, 2);
                let year = digits.slice(2, 4);

                if (month.length === 2) {
                    let numericMonth = parseInt(month, 10);
                    if (numericMonth === 0) numericMonth = 1;
                    if (numericMonth > 12) numericMonth = 12;
                    month = numericMonth.toString().padStart(2, '0');
                }

                if (year.length === 2) {
                    let numericYear = parseInt(year, 10);
                    if (numericYear < 25) numericYear = 25;
                    if (numericYear > 30) numericYear = 30;
                    year = numericYear.toString();
                }

                formattedValue = month;
                if (year) {
                    formattedValue += '/' + year;
                }
                break;

            case 'cvv':
                formattedValue = value.replace(/\D/g, '').slice(0, 3);
                break;

            default:
                break;
        }

        setFormValues(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleConfirmPayment = async (orderId) => {
        const { cardNumber, cardholderName, expirationDate, cvv } = formValues;

        if (!cardNumber || !cardholderName || !expirationDate || !cvv) {
            alert('Please fill in all payment fields.');
            return;
        }

        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length !== 16) {
            alert('Card number must contain 16 digits.');
            return;
        }

        if (cvv.length !== 3) {
            alert('CVV must contain 3 digits.');
            return;
        }

        const [monthStr, yearStr] = expirationDate.split('/');
        if (!monthStr || !yearStr || monthStr.length !== 2 || yearStr.length !== 2) {
            alert('Expiration date must be in format MM/YY.');
            return;
        }

        const month = parseInt(monthStr, 10);
        const year = 2000 + parseInt(yearStr, 10);

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            alert('Invalid expiration month.');
            return;
        }

        const now = new Date();
        const expDate = new Date(year, month - 1, 1);
        expDate.setMonth(expDate.getMonth() + 1);

        if (expDate < now) {
            alert('Card expiration date cannot be earlier than today.');
            return;
        }

        if (!/^[A-Z]+ [A-Z]+(?: [A-Z]+)*$/.test(cardholderName.trim())) {
            alert('Cardholder name must contain first and last name separated by a space.');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`http://localhost:8080/api/order/${orderId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: 'paid' })
        });

        if (response.ok) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o));
            alert('Payment successful!');
        } else alert('Failed to pay order');

        setPayOrderId(null);
    };

    const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div>
            <Pagination
                data={orders}
                initialPerPage={4}
                onPageChange={setVisibleCards}
            />

            <div className="flight-content">
                {error && <p className="error-message">{error}</p>}
                <div className="plane-list">
                    {visibleCards.map(order => {
                        const orderTickets = tickets[order.id] || [];

                        return (
                            <div key={order.id}>
                                <div
                                    className={`plane-card ${
                                        order?.status === false || order.payment_status === 'canceled'
                                            ? 'inactive'
                                            : ''
                                    }
                                    ${payOrderId === order.id || viewOrderId === order.id ? 'event-active' : ''}
                                    `}
                                >
                                    <div className="flight-info">
                                        <div className="time-block">
                                            <span className="time-main">{order.departure_time.slice(0, -3)}</span>
                                            <span className="city-name">{order.departureCity}</span>
                                            <span className="date-text">
                                            {new Date(order.departure_date).toLocaleDateString('en-US', {
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
                                                    (new Date(`${order.arrival_date}T${order.arrival_time}`) -
                                                        new Date(`${order.departure_date}T${order.departure_time}`)) /
                                                    3600000
                                                )
                                            }h {
                                                Math.floor(
                                                    ((new Date(`${order.arrival_date}T${order.arrival_time}`) -
                                                        new Date(`${order.departure_date}T${order.departure_time}`)) % 3600000) /
                                                    60000
                                                )
                                            }m
                                            </div>
                                            <span className="airport-code-left">{order.departureCode}</span>
                                            <div className="line"></div>
                                            <span className="airport-code-right">{order.destinationCode}</span>
                                        </div>

                                        <div className="time-block">
                                            <span className="time-main">{order.arrival_time.slice(0, -3)}</span>
                                            <span className="city-name">{order.destinationCity}</span>
                                            <span className="date-text">
                                            {new Date(order.arrival_date).toLocaleDateString('en-US', {
                                                day: '2-digit',
                                                month: 'short',
                                                weekday: 'short'
                                            })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flight-middle">
                                        <div className="airline-name">{order.airlineName}</div>
                                        <div className="plane-number">{order.planeModel}</div>
                                        <div className="seats-info">
                                            Tickets: <b>{order.ticket_quantity}</b>
                                        </div>
                                    </div>

                                    <div className="myFlight-right">
                                        <div className="price">{order.total_price} UAH</div>
                                        <div className="order-status">
                                            {capitalizeFirstLetter(order.payment_status)}
                                        </div>
                                        <div className="button-row">
                                            <button
                                                className="view-button"
                                                onClick={() => {
                                                    setPayOrderId(null);
                                                    setViewOrderId(viewOrderId === order.id ? null : order.id);
                                                }}
                                            >
                                                View
                                            </button>
                                            {order.payment_status === 'booked' && (
                                                <button
                                                    className="pay-button"
                                                    onClick={() => {
                                                        setPayOrderId(
                                                            payOrderId === order.id ? null : order.id
                                                        );
                                                        setViewOrderId(null);
                                                    }}
                                                >
                                                    Pay
                                                </button>
                                            )}
                                            {(order.payment_status === 'booked' ||
                                                order.payment_status === 'paid') && (
                                                <button
                                                    className="cancel-button"
                                                    onClick={() =>
                                                        handleCancel(order.id)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {payOrderId === order.id && (
                                    <div className="payment-form">
                                        <div className="plane-info-list">
                                            <div className="info-section">
                                                <span className="label-pay">Card Number</span>
                                                <input
                                                    type="text"
                                                    name="cardNumber"
                                                    placeholder="**** **** **** ****"
                                                    value={formValues.cardNumber}
                                                    onChange={handlePaymentInputChange}
                                                    className="form-input-city"
                                                />
                                            </div>
                                            <div className="info-section">
                                                <span className="label-pay">Cardholder Name</span>
                                                <input
                                                    type="text"
                                                    name="cardholderName"
                                                    placeholder="NAME SURNAME"
                                                    value={formValues.cardholderName}
                                                    onChange={handlePaymentInputChange}
                                                    className="form-input-city"
                                                />
                                            </div>
                                            <div className="info-section">
                                                <span className="label-pay">Expiration Date</span>
                                                <input
                                                    type="text"
                                                    name="expirationDate"
                                                    placeholder="MM/YY"
                                                    value={formValues.expirationDate}
                                                    onChange={handlePaymentInputChange}

                                                    className="form-input-city"
                                                />
                                            </div>
                                            <div className="info-section">
                                                <span className="label-pay">CVV</span>
                                                <input
                                                    type="text"
                                                    name="cvv"
                                                    placeholder="***"
                                                    value={formValues.cvv}
                                                    onChange={handlePaymentInputChange}
                                                    className="form-input-city"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="confirm-button"
                                            onClick={() => handleConfirmPayment(order.id)}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                )}

                                {viewOrderId === order.id && (
                                    <div className="tickets-container">
                                        {orderTickets.map(ticket => {
                                            const [firstName, lastName] = ticket.name.split(' ');
                                            return (
                                                <div key={ticket.id} className="ticket-card-my">
                                                    <div className="plane-info-list">
                                                        <div className="info-section">
                                                            <span className="label">Name</span>
                                                            <span className="value">{firstName}</span>
                                                        </div>
                                                        <div className="info-section">
                                                            <span className="label">Surname</span>
                                                            <span className="value">{lastName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="plane-info-list">
                                                        <div className="info-section-ticket">
                                                            <span className="label">Seat</span>
                                                            <span className="value">{ticket.seat_number}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

export default MyFlights;
