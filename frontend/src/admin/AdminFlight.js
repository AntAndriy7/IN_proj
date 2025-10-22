import React, { useState } from 'react';

function AdminFlight({ flight: initialFlight, airlineName}) {
    const [flight, setFlight] = useState(initialFlight);
    const [updatedDepartureDate, setUpdatedDepartureDate] = useState('');
    const [updatedDepartureTime, setUpdatedDepartureTime] = useState('');
    const [updatedArrivalDate, setUpdatedArrivalDate] = useState('');
    const [updatedArrivalTime, setUpdatedArrivalTime] = useState('');
    const [updatedFlight, setUpdatedFlight] = useState('');
    const [updatedSeats, setUpdatedSeats] = useState('');
    const [updatedPrice, setUpdatedPrice] = useState('');

    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setUpdatedPrice(flight.ticket_price);
        setUpdatedSeats(flight.seats);
        setUpdatedFlight(flight.plane_number);
        setUpdatedDepartureDate(flight.departure_date);
        setUpdatedDepartureTime(flight.departure_time);
        setUpdatedArrivalDate(flight.arrival_date);
        setUpdatedArrivalTime(flight.arrival_time);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!updatedDepartureDate || !updatedDepartureTime || !updatedArrivalDate || !updatedArrivalTime || !updatedPrice || !updatedSeats || !updatedFlight) {
            alert('All fields must be filled');
            handleEdit();
            return;
        }

        const planeDepartureDateTime = new Date(`${flight.departure_date}T${flight.departure_time}`);

        const departureDateTime = new Date(`${updatedDepartureDate}T${updatedDepartureTime}`);
        const arrivalDateTime = new Date(`${updatedArrivalDate}T${updatedArrivalTime}`);

        if (departureDateTime < planeDepartureDateTime) {
            handleEdit();
            alert('Updated departure date and time must be later than the current departure date and time');
            return;
        }

        if (departureDateTime >= arrivalDateTime) {
            handleEdit();
            alert('Departure date and time must be earlier than arrival date and time');
            return;
        }

        if (updatedSeats < flight.occupied_seats) {
            handleEdit();
            alert('Seats must be higher than the occupied seats');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        fetch(`http://localhost:8080/api/flight/${flight.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ departure_date: updatedDepartureDate, departure_time: updatedDepartureTime, arrival_date: updatedArrivalDate, arrival_time: updatedArrivalTime, plane_number: updatedFlight, seats: updatedSeats, ticket_price: updatedPrice }),
        })
            .then(response => {
                if (response.ok) {
                    setFlight(prev => ({ ...prev, departure_date: updatedDepartureDate, departure_time: updatedDepartureTime, arrival_date: updatedArrivalDate, arrival_time: updatedArrivalTime, plane_number: updatedFlight, seats: updatedSeats, ticket_price: updatedPrice }));
                }
                else {
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
                }})
                .then(response => {
                    if (!response.ok) throw new Error('Failed to cancel flight');
                    setFlight(prev => ({ ...prev, status: false }));
                })
                .catch(error => {
                    console.error('Error canceling flight:', error);
                });
        }
    };

    return (
        <div>
            {flight && (
                <div className="plane-order-card">
                    <div className="plane-info">
                        {!isEditing && (
                            <div className="plane-info-list">
                                <div className="info-section">
                                    <span className="value">{airlineName}</span>
                                </div>
                            </div>
                        )}
                        <div className="plane-info-list">
                            {!isEditing && (
                                <>
                                    <div className="info-section">
                                        <span className="label">From</span>
                                        <span className="value">{flight.departure}</span>
                                    </div>
                                    <div className="info-section">
                                        <span className="label">To</span>
                                        <span className="value">{flight.destination}</span>
                                    </div>
                                </>
                            )}
                            <div className="info-section">
                                {isEditing ? (
                                    <>
                                        <span className="label">Price</span>
                                        <input
                                            className="form-input"
                                            type="number"
                                            value={updatedPrice}
                                            onChange={(e) => setUpdatedPrice(e.target.value)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="label">Departure</span>
                                        <span
                                            className="value">{new Date(flight.departure_date).toLocaleDateString()} {flight.departure_time.slice(0, -3)}</span>
                                    </>
                                )}
                            </div>
                            {!isEditing && (
                                <div className="info-section">
                                    <span className="label">Arrival</span>
                                    <span
                                        className="value">{new Date(flight.arrival_date).toLocaleDateString()} {flight.arrival_time.slice(0, -3)}</span>
                                </div>
                            )}
                            <div className="info-section">
                                <span className="label">Plane</span>
                                {isEditing ? (
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={updatedFlight}
                                        onChange={(e) => setUpdatedFlight(e.target.value)}
                                    />
                                ) : (
                                    <span className="value">{flight.plane_number}</span>
                                )}
                            </div>
                            <div className="info-section">
                                <span className="label">Seats</span>
                                {isEditing ? (
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={updatedSeats}
                                        onChange={(e) => setUpdatedSeats(e.target.value)}
                                    />
                                ) : (
                                    <span className="value">{flight.seats}</span>
                                )}
                            </div>
                            {!isEditing && (
                                <div className="info-section">
                                    <span className="label">Free seats</span>
                                    <span className="value">{flight.seats - flight.occupied_seats}</span>
                                </div>
                            )}
                        </div>
                        <div className="plane-info-list">
                            {isEditing ? (
                                <>
                                    <div className="info-section">
                                        <span className="label">Departure</span>
                                        <div>
                                            <input
                                                className="form-input"
                                                type="date"
                                                value={updatedDepartureDate}
                                                onChange={(e) => setUpdatedDepartureDate(e.target.value)}
                                            />
                                            <input
                                                className="form-input"
                                                type="time"
                                                value={updatedDepartureTime}
                                                onChange={(e) => setUpdatedDepartureTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="info-section">
                                        <span className="label">Arrival</span>
                                        <div>
                                            <input
                                                className="form-input"
                                                type="date"
                                                value={updatedArrivalDate}
                                                onChange={(e) => setUpdatedArrivalDate(e.target.value)}
                                            />
                                            <input
                                                className="form-input"
                                                type="time"
                                                value={updatedArrivalTime}
                                                onChange={(e) => setUpdatedArrivalTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="info-section">
                                        <span className="label-price">Status</span>
                                        <span className="value-price">{flight.status ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <div className="info-section">
                                        <span className="label-price">Price</span>
                                        <span className="value-price">{flight.ticket_price} UAH
                                            </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="button-row">
                        {isEditing ? (
                            <>
                                <button className="view-button" onClick={() => setIsEditing(false)}>X</button>
                                <button className="view-button" onClick={handleSave}>Save</button>
                            </>
                        ) : (
                            <button className="view-button" onClick={handleEdit}>Edit</button>
                        )}
                        {flight.status && (
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminFlight;