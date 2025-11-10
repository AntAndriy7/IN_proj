import React, {useEffect, useRef, useState} from 'react';
import FlightFilter from "../components/FlightFilter";
import DateTime from "../components/DateTime";

function AdminFlight({ flight: initialFlight, initialAirlineName }) {
    const [flight, setFlight] = useState(initialFlight);
    const [updatedDepartureDate, setUpdatedDepartureDate] = useState('');
    const [updatedDepartureTime, setUpdatedDepartureTime] = useState('');
    const [updatedArrivalDate, setUpdatedArrivalDate] = useState('');
    const [updatedArrivalTime, setUpdatedArrivalTime] = useState('');
    const [updatedPrice, setUpdatedPrice] = useState('');
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

    const [fillError, setFillError] = useState('');
    const [departureError, setDepartureError] = useState('');
    const [arrivalError, setArrivalError] = useState('');
    const [priceError, setPriceError] = useState('');

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
            })
            .catch(error => {
                console.error(error.message || 'Failed to cancel flight');
            });
    };

    useEffect(() => {
        handleEdit();
    }, [])

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
                                    <div className="airline-name">{initialAirlineName || "Lufthansa"}</div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminFlight;