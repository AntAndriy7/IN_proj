import React, {useEffect, useRef, useState} from 'react';
import '../styles/Main.css';
import '../styles/Home.css';
import AirportSelect from "../components/AirportSelect.js";
import FlightFilter from "../components/FlightFilter.js";
import PlaneSelect from "../components/PlaneSelect.js";
import DateTime from "../components/DateTime";
import {addDays} from "date-fns";

function Add() {
    const [filter, setFilter] = useState({
        from: "",
        to: "",
        dateFrom: "",
        dateTo: "",
        priceMin: "",
        priceMax: ""
    });

    const [formValues, setFormValues] = useState({
        departure_id: '',
        destination_id: '',
        plane_id: '',
        departure_date: '',
        departure_time: '',
        arrival_date: '',
        arrival_time: '',
        ticket_price: '',
    });

    const [airports, setAirports] = useState([]);
    const [planesArr, setPlanesArr] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fillError, setFillError] = useState('');
    const [routeError, setRouteError] = useState('');
    const [departureError, setDepartureError] = useState('');
    const [arrivalError, setArrivalError] = useState('');
    const [priceError, setPriceError] = useState('');

    const routeErrorRef = useRef(null);
    const fillErrorRef = useRef(null);
    const departureErrorRef = useRef(null);
    const arrivalErrorRef = useRef(null);
    const priceErrorRef = useRef(null);
    const [errorTrigger, setErrorTrigger] = useState(0);

    useEffect(() => {
        if (fillError && fillErrorRef.current) {
            fillErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (routeError && routeErrorRef.current) {
            routeErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (departureError && departureErrorRef.current) {
            departureErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (arrivalError && arrivalErrorRef.current) {
            arrivalErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (priceError && priceErrorRef.current) {
            priceErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [fillError, routeError, departureError, arrivalError, priceError, errorTrigger]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('jwtToken');

                const airportsResponse = await fetch('http://localhost:8080/api/airport', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                const airportData = await airportsResponse.json().catch(() => null);

                if (!airportsResponse.ok) {
                    const errorMessage = airportData?.message || 'Failed to fetch airports';
                    throw new Error(errorMessage);
                }

                setAirports(airportData);

                const planesResponse = await fetch('http://localhost:8080/api/plane', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                const planeData = await planesResponse.json().catch(() => null);

                if (!planesResponse.ok) {
                    const errorMessage = airportData?.message || 'Failed to fetch planes';
                    throw new Error(errorMessage);
                }

                setPlanesArr(planeData);

                setLoading(false);
            } catch (error) {
                console.error(error.message || `Error fetching data`);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePriceChange = (value) => {
        setFormValues(prev => ({ ...prev, ticket_price: value }));
    };

    const handleDateChange = (field, value) => {
        setFormValues((prev) => {
            let updated = { ...prev, [field]: value };

            const depDateTime = new Date(`${updated.departure_date}T${updated.departure_time || '00:00'}`);
            const arrDateTime = new Date(`${updated.arrival_date}T${updated.arrival_time || '00:00'}`);

            if (field === "departure_date") {
                if (updated.arrival_date && depDateTime > arrDateTime) {
                    updated.arrival_date = updated.departure_date;
                    updated.arrival_time = updated.departure_time || '00:00';
                }
            }

            if (field === "arrival_date") {
                if (updated.departure_date && arrDateTime < depDateTime) {
                    updated.departure_date = updated.arrival_date;
                    updated.departure_time = updated.arrival_time || '00:00';
                }
            }

            if (field === "departure_time") {
                if (updated.arrival_date && updated.arrival_time) {
                    const dep = new Date(`${updated.departure_date}T${value}`);
                    const arr = new Date(`${updated.arrival_date}T${updated.arrival_time}`);
                    if (dep > arr) {
                        updated.arrival_time = value;
                    }
                }
            }

            if (field === "arrival_time") {
                if (updated.departure_date && updated.departure_time) {
                    const dep = new Date(`${updated.departure_date}T${updated.departure_time}`);
                    const arr = new Date(`${updated.arrival_date}T${value}`);
                    if (arr < dep) {
                        updated.departure_time = value;
                    }
                }
            }

            return updated;
        });
    };

    const handleConfirmAdd = async () => {
        setFillError('');
        setRouteError('');
        setDepartureError('');
        setArrivalError('');
        setPriceError('');

        const { departure_id, destination_id, plane_id, departure_date, departure_time,
            arrival_date, arrival_time, ticket_price } = formValues;

        if (!departure_id || !destination_id || !plane_id || !departure_date || !departure_time ||
            !arrival_date || !arrival_time || !ticket_price) {
            setFillError('Please fill in all fields.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (Number(departure_id) === Number(destination_id)) {
            setRouteError('Departure and destination airports cannot be the same.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (Number(departure_id) !== 1 && Number(destination_id) !== 1) {
            setRouteError('Either departure or destination airport must be IEV.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        const departureDateTime = new Date(`${departure_date}T${departure_time}`);
        const arrivalDateTime = new Date(`${arrival_date}T${arrival_time}`);

        const minDurationMs = 30 * 60 * 1000;
        const maxDurationMs = 24 * 60 * 60 * 1000;
        const duration = arrivalDateTime - departureDateTime;

        const now = new Date();
        if (departureDateTime - now < 24 * 60 * 60 * 1000) {
            setDepartureError('Departure date/time must be at least 24 hours from now.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (duration < minDurationMs) {
            setArrivalError('Flight duration is too short. Minimum duration is 30 minutes.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (duration > maxDurationMs) {
            setArrivalError('Flight duration is too long. Maximum duration is 24 hours.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (departureDateTime >= arrivalDateTime) {
            setArrivalError('Departure date/time must be earlier than arrival date/time.');
            setErrorTrigger(prev => prev + 1);
            return;
        }

        const minPrice = 50;
        if (Number(ticket_price) < minPrice) {
            setPriceError(`Ticket price must be at least ${minPrice} UAH.`);
            setErrorTrigger(prev => prev + 1);
            return;
        }

        try {
            const token = localStorage.getItem('jwtToken');

            const requestBody = {
                departure_time: departure_time.length === 5 ? `${departure_time}:00` : departure_time,
                arrival_time: arrival_time.length === 5 ? `${arrival_time}:00` : arrival_time,
                departure_date: departure_date,
                arrival_date: arrival_date,
                status: true,
                ticket_price: Number(ticket_price),
                occupied_seats: 0,
                plane_id: Number(plane_id),
                departure_id: Number(departure_id),
                destination_id: Number(destination_id)
            };

            console.log('Sending flight data:', requestBody);

            const response = await fetch(`http://localhost:8080/api/flight`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json().catch(() => null);
                const errorMessage = data?.message || 'Failed to fetch flights';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error adding flight:', error);
            setFillError(error.message || 'Failed to add flight');
            setErrorTrigger(prev => prev + 1);
        }
    };

    if (loading) {
        return (
            <div className="home-layout">
                <div className="loading-message">Loading data...</div>
            </div>
        );
    }

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
                    <div className="add-flight-container">
                        <div className="add-flight-card">

                            <div className="add-flight-header">
                                <h1 className="add-flight-title">Add New Flight</h1>
                                <p className="add-flight-subtitle">Fill in the flight details below</p>
                            </div>

                            <div className="edit-section">
                                <div className="edit-section-title">
                                    Route Information
                                </div>
                                <div className="edit-datetime-grid">
                                    <div className="edit-field">
                                        <label>Departure Airport</label>
                                        <AirportSelect
                                            airports={airports}
                                            value={formValues.departure_id}
                                            onChange={(val) => {
                                                console.log('Departure airport selected:', val);
                                                setFormValues(prev => ({ ...prev, departure_id: val }));
                                            }}
                                            placeholder="Select departure airport"
                                            fontSize = "16px"
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label>Destination Airport</label>
                                        <AirportSelect
                                            airports={airports}
                                            value={formValues.destination_id}
                                            onChange={(val) => {
                                                console.log('Destination airport selected:', val);
                                                setFormValues(prev => ({ ...prev, destination_id: val }));
                                            }}
                                            placeholder="Select destination airport"
                                            fontSize = "16px"
                                        />
                                    </div>
                                </div>

                                {routeError && <p ref={routeErrorRef} className="error">{routeError}</p>}
                            </div>

                            <div className="edit-section">
                                <div className="edit-section-title">
                                    Aircraft Details
                                </div>
                                <div className="edit-field">
                                    <label>Plane Model</label>
                                    <PlaneSelect
                                        planes={planesArr}
                                        value={formValues.plane_id}
                                        onChange={(val) => {
                                            console.log('Plane selected:', val);
                                            setFormValues(prev => ({ ...prev, plane_id: val }));
                                        }}
                                        placeholder="Select plane model"
                                        fontSize = "16px"
                                    />
                                </div>
                            </div>

                            <DateTime
                                updatedDepartureDate={formValues.departure_date}
                                updatedDepartureTime={formValues.departure_time}
                                updatedArrivalDate={formValues.arrival_date}
                                updatedArrivalTime={formValues.arrival_time}
                                updatedPrice={formValues.ticket_price}
                                setUpdatedPrice={handlePriceChange}
                                handleDateChange={handleDateChange}
                                handleEdit={() => {
                                    setFormValues({
                                        departure_id: '',
                                        destination_id: '',
                                        plane_id: '',
                                        departure_date: '',
                                        departure_time: '',
                                        arrival_date: '',
                                        arrival_time: '',
                                        ticket_price: '',
                                    });
                                    setFillError('');
                                    setRouteError('');
                                    setDepartureError('');
                                    setArrivalError('');
                                    setPriceError('');
                                    setErrorTrigger(0);
                                }}
                                handleSave={handleConfirmAdd}
                                minDate={addDays(new Date(), 1)}
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
    );
}

export default Add;