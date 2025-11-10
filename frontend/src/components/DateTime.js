import React from "react";
import DatePicker from "react-datepicker";
import { addYears } from "date-fns";
import { IoCalendarOutline } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Home.css";
import "../styles/DateInput.css";
import TimePicker from "./TimePicker";

export default function DateTime({
                                     updatedDepartureDate,
                                     updatedDepartureTime,
                                     updatedArrivalDate,
                                     updatedArrivalTime,
                                     updatedPrice,
                                     setUpdatedPrice,
                                     handleDateChange,
                                     handleEdit,
                                     handleSave,
                                     minDate = new Date(),
                                     maxDate = addYears(new Date(), 1),
                                     fillError = null,
                                     arrivalError = null,
                                     departureError = null,
                                     priceError = null,
                                     fillErrorRef = null,
                                     departureErrorRef = null,
                                     arrivalErrorRef = null,
                                     priceErrorRef = null
                                 }) {

    const handleKeyDown = (e) => {
        e.preventDefault();
    };

    const departureDate = updatedDepartureDate ? new Date(updatedDepartureDate + 'T00:00:00') : null;
    const arrivalDate = updatedArrivalDate ? new Date(updatedArrivalDate + 'T00:00:00') : null;

    const dateToLocalString = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div>
            <div className="edit-section">
                <h4 className="edit-section-title">Departure Schedule</h4>
                <div className="edit-datetime-grid">
                    <div className="edit-field">
                        <label>Departure Date</label>
                        <div className="date-input-wrapper">
                            <DatePicker
                                selected={departureDate}
                                onChange={(date) => handleDateChange("departure_date", dateToLocalString(date))}
                                dateFormat="dd.MM.yyyy"
                                placeholderText="Select date"
                                minDate={minDate}
                                maxDate={maxDate}
                                className="form-input-city"
                                onKeyDown={handleKeyDown}
                                shouldCloseOnSelect
                                portalId="root-portal"
                                calendarStartDay={1}
                            />
                            <IoCalendarOutline className="calendar-icon" />
                        </div>
                    </div>
                    <div className="edit-field">
                        <label>Departure Time</label>
                        <TimePicker
                            type="time"
                            value={updatedDepartureTime}
                            onChange={(time) => handleDateChange("departure_time", time)}
                        />
                    </div>
                </div>

                {departureError && <p ref={departureErrorRef} className="error">{departureError}</p>}
            </div>

            <div className="edit-section">
                <h4 className="edit-section-title">Arrival Schedule</h4>
                <div className="edit-datetime-grid">
                    <div className="edit-field">
                        <label>Arrival Date</label>
                        <div className="date-input-wrapper">
                            <DatePicker
                                selected={arrivalDate}
                                onChange={(date) => handleDateChange("arrival_date", dateToLocalString(date))}
                                dateFormat="dd.MM.yyyy"
                                placeholderText="Select date"
                                minDate={minDate}
                                maxDate={maxDate}
                                className="form-input-city"
                                onKeyDown={handleKeyDown}
                                shouldCloseOnSelect
                                portalId="root-portal"
                                calendarStartDay={1}
                            />
                            <IoCalendarOutline className="calendar-icon" />
                        </div>
                    </div>
                    <div className="edit-field">
                        <label>Arrival Time</label>
                        <TimePicker
                            value={updatedArrivalTime}
                            onChange={(time) => handleDateChange("arrival_time", time)}
                        />
                    </div>
                </div>

                {arrivalError && <p ref={arrivalErrorRef} className="error">{arrivalError}</p>}
            </div>

            <div className="edit-section">
                <h4 className="edit-section-title">Pricing</h4>
                <div className="edit-field">
                    <label>Ticket Price (UAH)</label>
                    <div className="date-input-wrapper">
                        <input
                            type="number"
                            value={updatedPrice}
                            placeholder="0"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,5}$/.test(value)) {
                                    setUpdatedPrice(value);
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
                            className="no-spinner"
                        />
                        <span className="currency-symbol">₴</span>
                    </div>
                </div>

                {priceError && <p ref={priceErrorRef} className="error">{priceError}</p>}
            </div>

            {fillError && <p ref={fillErrorRef} className="error">{fillError}</p>}

            <div className="edit-actions">
                <button className="btn-clear" onClick={handleEdit}>Clear</button>
                <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}