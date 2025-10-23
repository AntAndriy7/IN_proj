import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { addYears } from "date-fns";
import { IoCalendarOutline } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Home.css";
import "../styles/DateInput.css";

export default function DateRangeInput({ filter, setFilter, onFilterChange, disabled }) {
    const [hoverDate, setHoverDate] = useState(null);
    const [activeCalendar, setActiveCalendar] = useState(null);

    const minDate = new Date();
    const maxDate = addYears(new Date(), 1);

    const dateToLocalString = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleFromChange = (dateFrom) => {
        setFilter((prev) => {
            let { dateTo } = prev;

            if (dateFrom && dateTo && dateFrom > new Date(dateTo)) {
                dateTo = dateToLocalString(dateFrom);
            }

            const newFilter = {
                ...prev,
                dateFrom: dateFrom ? dateToLocalString(dateFrom) : "",
                dateTo,
            };

            onFilterChange?.(newFilter);
            return newFilter;
        });
        setActiveCalendar(null);
        setHoverDate(null);
    };

    const handleToChange = (dateTo) => {
        setFilter((prev) => {
            let { dateFrom } = prev;

            if (dateTo && dateFrom && new Date(dateTo) < new Date(dateFrom)) {
                dateFrom = dateToLocalString(dateTo);
            }

            const newFilter = {
                ...prev,
                dateFrom,
                dateTo: dateTo ? dateToLocalString(dateTo) : "",
            };

            onFilterChange?.(newFilter);
            return newFilter;
        });
        setActiveCalendar(null);
        setHoverDate(null);
    };

    const from = filter.dateFrom ? new Date(filter.dateFrom + 'T00:00:00') : null;
    const to = filter.dateTo ? new Date(filter.dateTo + 'T00:00:00') : null;

    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    const getDayClassName = (date) => {
        const currentDate = normalizeDate(date);

        const fromTime = from ? normalizeDate(from) : null;
        const toTime = to ? normalizeDate(to) : null;

        if ((fromTime && currentDate === fromTime) || (toTime && currentDate === toTime)) {
            return "custom-selected";
        }

        if (activeCalendar === 'from') {
            if (!to) return "";

            if (hoverDate) {
                const hoverTime = normalizeDate(hoverDate);

                if (hoverTime < toTime) {
                    if (currentDate > hoverTime && currentDate < toTime) {
                        return "custom-in-range";
                    }
                }
                else if (fromTime) {
                    if (currentDate > fromTime && currentDate < toTime) {
                        return "custom-in-range";
                    }
                }
            }
            else if (fromTime) {
                if (currentDate > fromTime && currentDate < toTime) {
                    return "custom-in-range";
                }
            }
        }
        else if (activeCalendar === 'to') {
            if (!from) return "";

            if (hoverDate) {
                const hoverTime = normalizeDate(hoverDate);

                if (hoverTime > fromTime) {
                    if (currentDate > fromTime && currentDate < hoverTime) {
                        return "custom-in-range";
                    }
                }
                else if (toTime) {
                    if (currentDate > fromTime && currentDate < toTime) {
                        return "custom-in-range";
                    }
                }
            }
            else if (toTime) {
                if (currentDate > fromTime && currentDate < toTime) {
                    return "custom-in-range";
                }
            }
        }
        else if (fromTime && toTime) {
            if (currentDate > fromTime && currentDate < toTime) {
                return "custom-in-range";
            }
        }

        return "";
    };

    const handleDayMouseEnter = (date) => {
        if (activeCalendar) {
            setHoverDate(date);
        }
    };

    const clearHover = () => {
        setHoverDate(null);
    };

    const handleKeyDown = (e) => {
        e.preventDefault();
    };

    return (
        <div className="date-inputs-row">
            <div className="date-input-wrapper">
                <DatePicker
                    selected={from}
                    onChange={handleFromChange}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="From"
                    minDate={minDate}
                    maxDate={maxDate}
                    className="form-input-city"
                    dayClassName={getDayClassName}
                    onCalendarOpen={() => setActiveCalendar('from')}
                    onCalendarClose={() => {
                        setActiveCalendar(null);
                        clearHover();
                    }}
                    onMonthMouseLeave={clearHover}
                    onDayMouseEnter={handleDayMouseEnter}
                    onKeyDown={handleKeyDown}
                    shouldCloseOnSelect
                    portalId="root-portal"
                    disabled={disabled}
                    startDate={from}
                    endDate={to}
                />
                <IoCalendarOutline className="calendar-icon" />
            </div>

            <span className="date-separator">—</span>

            <div className="date-input-wrapper">
                <DatePicker
                    selected={to}
                    onChange={handleToChange}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="To"
                    minDate={minDate}
                    maxDate={maxDate}
                    className="form-input-city"
                    dayClassName={getDayClassName}
                    onCalendarOpen={() => setActiveCalendar('to')}
                    onCalendarClose={() => {
                        setActiveCalendar(null);
                        clearHover();
                    }}
                    onMonthMouseLeave={clearHover}
                    onDayMouseEnter={handleDayMouseEnter}
                    onKeyDown={handleKeyDown}
                    shouldCloseOnSelect
                    portalId="root-portal"
                    disabled={disabled}
                    startDate={from}
                    endDate={to}
                />
                <IoCalendarOutline className="calendar-icon" />
            </div>
        </div>
    );
}