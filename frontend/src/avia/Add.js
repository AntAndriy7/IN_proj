import React, {useEffect, useState} from 'react';
import { jwtDecode } from "jwt-decode";
import '../styles/Main.css';
import '../styles/Home.css';
import AirportSelect from "../components/AirportSelect.js";
import FlightFilter from "../components/FlightFilter.js";
import PlaneSelect from "../components/PlaneSelect.js";

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('jwtToken');

                const airportsResponse = await fetch('http://localhost:8080/api/airport', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (airportsResponse.ok) {
                    const airportsData = await airportsResponse.json();
                    setAirports(airportsData);
                }

                const planesResponse = await fetch('http://localhost:8080/api/plane', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (planesResponse.ok) {
                    const planesData = await planesResponse.json();
                    setPlanesArr(planesData);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('Error loading data. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormValues((prev) => {
            let updated = { ...prev, [name]: value };

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

            return updated;
        });
    };

    const handleConfirmAdd = async () => {
        const { departure_id, destination_id, plane_id, departure_date, departure_time,
            arrival_date, arrival_time, ticket_price } = formValues;

        if (!departure_id || !destination_id || !plane_id || !departure_date || !departure_time ||
            !arrival_date || !arrival_time || !ticket_price) {
            alert('Please fill in all fields.');
            return;
        }

        if (Number(departure_id) === Number(destination_id)) {
            alert('Departure and destination airports cannot be the same.');
            return;
        }

        if (Number(departure_id) !== 1 && Number(destination_id) !== 1) {
            alert('Either departure or destination airport must be IEV.');
            return;
        }

        const departureDateTime = new Date(`${departure_date}T${departure_time}`);
        const arrivalDateTime = new Date(`${arrival_date}T${arrival_time}`);

        const minDurationMs = 30 * 60 * 1000;
        const maxDurationMs = 24 * 60 * 60 * 1000;
        const duration = arrivalDateTime - departureDateTime;

        if (duration < minDurationMs) {
            alert('Flight duration is too short. Minimum duration is 30 minutes.');
            return;
        }

        if (duration > maxDurationMs) {
            alert('Flight duration is too long. Maximum duration is 24 hours.');
            return;
        }

        if (departureDateTime >= arrivalDateTime) {
            alert('Departure date/time must be earlier than arrival date/time.');
            return;
        }

        const now = new Date();
        if (departureDateTime - now < 24 * 60 * 60 * 1000) {
            alert('Departure date/time must be at least 24 hours from now.');
            return;
        }

        const minPrice = 50;
        if (Number(ticket_price) < minPrice) {
            alert(`Ticket price must be at least ${minPrice} UAH.`);
            return;
        }

        try {
            const token = localStorage.getItem('jwtToken');
            const decoded = jwtDecode(token);
            const aviaId = decoded.id;

            const requestBody = {
                avia_id: aviaId,
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
                alert('Flight added successfully!');
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
            } else {
                const errorData = await response.json();
                alert(`Failed to add flight: ${errorData.message || 'Try again.'}`);
            }
        } catch (error) {
            console.error('Error adding flight:', error);
            alert("Error adding flight.");
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

                            <div className="form-section">
                                <div className="section-title">
                                    Route Information
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Departure Airport</label>
                                        <AirportSelect
                                            airports={airports}
                                            value={formValues.departure_id}
                                            onChange={(val) => {
                                                console.log('Departure airport selected:', val);
                                                setFormValues(prev => ({ ...prev, departure_id: val }));
                                            }}
                                            placeholder="Select departure airport"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Destination Airport</label>
                                        <AirportSelect
                                            airports={airports}
                                            value={formValues.destination_id}
                                            onChange={(val) => {
                                                console.log('Destination airport selected:', val);
                                                setFormValues(prev => ({ ...prev, destination_id: val }));
                                            }}
                                            placeholder="Select destination airport"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    Aircraft Details
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Plane Model</label>
                                    <PlaneSelect
                                        planes={planesArr}
                                        value={formValues.plane_id}
                                        onChange={(val) => {
                                            console.log('Plane selected:', val);
                                            setFormValues(prev => ({ ...prev, plane_id: val }));
                                        }}
                                        placeholder="Select plane model"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    Departure Schedule
                                </div>
                                <div className="datetime-group">
                                    <div className="form-group" lang="en">
                                        <label className="form-label">Departure Date</label>
                                        <input
                                            type="date"
                                            name="departure_date"
                                            value={formValues.departure_date}
                                            min={new Date().toISOString().split('T')[0]}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                                .toISOString()
                                                .split('T')[0]}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Departure Time</label>
                                        <input
                                            type="time"
                                            name="departure_time"
                                            value={formValues.departure_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            onKeyDown={(e) => e.preventDefault()}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    Arrival Schedule
                                </div>
                                <div className="datetime-group">
                                    <div className="form-group">
                                        <label className="form-label">Arrival Date</label>
                                        <input
                                            type="date"
                                            name="arrival_date"
                                            value={formValues.arrival_date}
                                            min={new Date().toISOString().split('T')[0]}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                                .toISOString()
                                                .split('T')[0]}
                                            onChange={handleInputChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Arrival Time</label>
                                        <input
                                            type="time"
                                            name="arrival_time"
                                            value={formValues.arrival_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    Pricing
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Ticket Price (UAH)</label>
                                        <input
                                            type="number"
                                            name="ticket_price"
                                            placeholder="0"
                                            value={formValues.ticket_price}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d{0,5}$/.test(value)) {
                                                    handleInputChange(e);
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
                                            className="form-input no-spinner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button className="btn btn-clear" onClick={() => {
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
                                }}>
                                    Clear
                                </button>
                                <button className="btn btn-primary" onClick={handleConfirmAdd}>
                                    Confirm & Add Flight
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Add;