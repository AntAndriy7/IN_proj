import React from "react";
import AirportSelect from "./AirportSelect";
import DateRangeInput from "./DateRangeInput";
import "../styles/Home.css";

function FlightFilter({
                          filter,
                          setFilter,
                          airports,
                          flights = [],
                          onFilterChange = null,
                          disabled = false,
                          extraButtons = null,
                          showDividerAfterButtons = false
                      }) {
    const handlePriceInput = (value, maxLength = 5) => {
        return value.replace(/\D/g, '').slice(0, maxLength);
    };

    const handleClear = () => {
        if (flights.length > 0) {
            const prices = flights.map(p => parseFloat(p.ticket_price)).filter(p => !isNaN(p));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            const dates = flights.map(p => new Date(p.departure_date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const formatDate = (d) => d.toISOString().split('T')[0];

            const newFilter = {
                from: '',
                to: '',
                priceMin: minPrice,
                priceMax: maxPrice,
                dateFrom: formatDate(minDate),
                dateTo: formatDate(maxDate)
            };

            if (onFilterChange) onFilterChange(newFilter);
        } else {
            setFilter({
                from: '',
                to: '',
                priceMin: '',
                priceMax: '',
                dateFrom: '',
                dateTo: ''
            });
        }
    };

    return (
        <div className="filter-sidebar">
            <h2 className="filter-title">Filter</h2>
            <div className="filter-divider"></div>

            <div className="filter-form">
                <div className="info-section-filter">
                    <span className="label-filter">Departure</span>
                    <AirportSelect
                        airports={airports}
                        value={filter.from}
                        onChange={(val) => {
                            if (disabled) return;
                            setFilter(prev => {
                                const newFilter = { ...prev, from: val };
                                if (onFilterChange) onFilterChange(newFilter);
                                return newFilter;
                            });
                        }}
                        placeholder="Select departure airport"
                        disabled={disabled}
                    />
                </div>

                <div className="info-section-filter">
                    <span className="label-filter">Destination</span>
                    <AirportSelect
                        airports={airports}
                        value={filter.to}
                        onChange={(val) => {
                            if (disabled) return;
                            setFilter(prev => {
                                const newFilter = { ...prev, to: val };
                                if (onFilterChange) onFilterChange(newFilter);
                                return newFilter;
                            });
                        }}
                        placeholder="Select destination airport"
                        disabled={disabled}
                    />
                </div>

                <div className="info-section-filter">
                    <span className="label-filter">Date range</span>
                    <DateRangeInput
                        filter={filter}
                        setFilter={setFilter}
                        onFilterChange={onFilterChange}
                        disabled={disabled}
                    />
                </div>

                <div className="info-section-filter">
                    <span className="label-filter">Price range</span>
                    <div className="price-inputs-row">
                        <div className="price-input-wrapper">
                            <input
                                type="number"
                                placeholder="From"
                                value={filter.priceMin}
                                onChange={(e) => {
                                    const val = handlePriceInput(e.target.value, 5);
                                    setFilter(prev => {
                                        const newFilter = { ...prev, priceMin: val };
                                        if (onFilterChange) onFilterChange(newFilter);
                                        return newFilter;
                                    });
                                }}
                                className="form-input-price no-spinner"
                                disabled={disabled}
                            />
                            <span className="currency-symbol">₴</span>
                        </div>

                        <span className="price-separator">—</span>

                        <div className="price-input-wrapper">
                            <input
                                type="number"
                                placeholder="To"
                                value={filter.priceMax}
                                onChange={(e) => {
                                    const val = handlePriceInput(e.target.value, 5);
                                    setFilter(prev => {
                                        const newFilter = { ...prev, priceMax: val };
                                        if (onFilterChange) onFilterChange(newFilter);
                                        return newFilter;
                                    });
                                }}
                                className="form-input-price no-spinner"
                                disabled={disabled}
                            />
                            <span className="currency-symbol">₴</span>
                        </div>
                    </div>
                </div>

                <div className="info-section-filter">
                    <button
                        className="clear-button"
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        Clear
                    </button>

                    {showDividerAfterButtons && <div className="filter-divider-add"></div>}

                    {extraButtons}
                </div>
            </div>
        </div>
    );
}

export default FlightFilter;