import React from "react";
import DatePicker from "react-datepicker";
import { addYears } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Home.css";
import "../styles/DateInput.css";

export default function DateRangeInput({ filter, setFilter, onFilterChange, disabled }) {
    const minDate = new Date();
    const maxDate = addYears(new Date(), 1);

    const handleFromChange = (dateFrom) => {
        setFilter((prev) => {
            let { dateTo } = prev;

            if (dateFrom && dateTo && dateFrom > new Date(dateTo)) {
                dateTo = dateFrom;
            }

            const newFilter = {
                ...prev,
                dateFrom: dateFrom ? dateFrom.toISOString().split("T")[0] : "",
                dateTo,
            };

            if (onFilterChange) onFilterChange(newFilter);
            return newFilter;
        });
    };

    const handleToChange = (dateTo) => {
        setFilter((prev) => {
            let { dateFrom } = prev;

            if (dateTo && dateFrom && new Date(dateTo) < new Date(dateFrom)) {
                dateFrom = dateTo;
            }

            const newFilter = {
                ...prev,
                dateFrom,
                dateTo: dateTo ? dateTo.toISOString().split("T")[0] : "",
            };

            if (onFilterChange) onFilterChange(newFilter);
            return newFilter;
        });
    };

    return (
        <div className="date-inputs-row">
            <DatePicker
                selected={filter.dateFrom ? new Date(filter.dateFrom) : null}
                onChange={handleFromChange}
                dateFormat="dd.MM.yyyy"
                placeholderText="From"
                minDate={minDate}
                maxDate={maxDate}
                selectsStart
                startDate={filter.dateFrom ? new Date(filter.dateFrom) : null}
                endDate={filter.dateTo ? new Date(filter.dateTo) : null}
                className="form-input-city"
                disabled={disabled}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
            />

            <span className="date-separator">—</span>

            <DatePicker
                selected={filter.dateTo ? new Date(filter.dateTo) : null}
                onChange={handleToChange}
                dateFormat="dd.MM.yyyy"
                placeholderText="To"
                minDate={minDate}
                maxDate={maxDate}
                selectsEnd
                startDate={filter.dateFrom ? new Date(filter.dateFrom) : null}
                endDate={filter.dateTo ? new Date(filter.dateTo) : null}
                className="form-input-city"
                disabled={disabled}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
            />
        </div>
    );
}
