import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import FlightFilter from "../components/FlightFilter";
import Pagination from "../components/Pagination";

function Home({ onOrderClick }) {
    const [flights, setFlights] = useState([]);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({
        from: '',
        to: '',
        dateFrom: '',
        dateTo: '',
        priceMin: '',
        priceMax: ''
    });
    const [airports, setAirports] = useState([]);
    const [visibleCards, setVisibleCards] = useState([]);
    const [resetPaginationKey, setResetPaginationKey] = useState(0);


    const fetchFlights = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/flight/status`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length < 4) {
                setError("Unexpected response format");
                return;
            }

            const [flightsArr, airlinesArr, planesArr, airportsArr] = data;

            const airlineMap = Object.fromEntries(airlinesArr.map(a => [a.id, a.name]));
            const planeMap = Object.fromEntries(planesArr.map(p => [p.id, p]));
            const airportMap = Object.fromEntries(airportsArr.map(a => [a.id, a]));

            const processedFlights = flightsArr.map(f => {
                const departure = airportMap[f.departure_id];
                const destination = airportMap[f.destination_id];

                return {
                    ...f,
                    seats: planeMap[f.plane_id]?.seats_number || 0,
                    departureCity: departure?.city || 'Unknown',
                    departureCode: departure?.code || '',
                    departureName: departure?.name || '',
                    destinationCity: destination?.city || 'Unknown',
                    destinationCode: destination?.code || '',
                    destinationName: destination?.name || '',
                    airlineName: airlineMap[f.avia_id] || 'Unknown airline',
                    planeModel: planeMap[f.plane_id]?.model || 'Unknown plane'
                };
            }).sort((a, b) => (
                new Date(`${a.departure_date}T${a.departure_time}`) -
                new Date(`${b.departure_date}T${b.departure_time}`)
            ));

            setFlights(processedFlights);
            setAirports(airportsArr);
            setError(null);

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to fetch flights");
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setResetPaginationKey((prev) => prev + 1);
    };

    const applyFilters = () => {
        return flights.filter((flight) => {
            const matchesFrom = filter.from
                ? flight.departure_id === filter.from
                : true;

            const matchesTo = filter.to
                ? flight.destination_id === filter.to
                : true;

            const matchesDate = filter.dateFrom || filter.dateTo ? (
                new Date(flight.departure_date) >= new Date(filter.dateFrom) &&
                new Date(flight.departure_date) <= new Date(filter.dateTo)
            ) : true;

            const matchesPrice = filter.priceMin || filter.priceMax ? (
                flight.ticket_price >= (filter.priceMin || 0) &&
                flight.ticket_price <= (filter.priceMax || Infinity)
            ) : true;

            return matchesFrom && matchesTo && matchesDate && matchesPrice;
        });
    };

    const filteredFlights = applyFilters();

    useEffect(() => {
        fetchFlights();
    }, []);

    useEffect(() => {
        if (flights.length > 0) {
            const prices = flights.map(p => parseFloat(p.ticket_price)).filter(p => !isNaN(p));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            const dates = flights.map(p => new Date(p.departure_date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            const formatDate = (d) => d.toISOString().split('T')[0];

            setFilter(prev => ({
                ...prev,
                priceMin: prev.priceMin || minPrice,
                priceMax: prev.priceMax || maxPrice,
                dateFrom: prev.dateFrom || formatDate(minDate),
                dateTo: prev.dateTo || formatDate(maxDate)
            }));
        }
    }, [flights]);

    return (
        <div className="home-layout">
            <FlightFilter
                filter={filter}
                setFilter={setFilter}
                airports={airports}
                flights={flights}
                onFilterChange={handleFilterChange}
            />

            <div className="right-content">

                <Pagination
                    data={filteredFlights}
                    initialPerPage={4}
                    onPageChange={setVisibleCards}
                    resetTrigger={resetPaginationKey}
                />

                <div className="flight-content">
                    {error && <p className="error-message">{error}</p>}
                    <div className="plane-list">
                        {visibleCards.map((flight) => (
                            <div className="plane-card" key={flight.id}>
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
                                    <button
                                        className="order-home-button"
                                        onClick={() => onOrderClick(flight)}
                                    >
                                        Buy
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

export default Home;
