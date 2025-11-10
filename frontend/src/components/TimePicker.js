import React, { useState, useRef, useEffect } from "react";
import { IoTimeOutline } from "react-icons/io5";
import "../styles/TimePicker.css";

export default function TimePickerCustom({ value, onChange, placeholder = "Select time" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState("");
    const [selectedMinute, setSelectedMinute] = useState("");
    const pickerRef = useRef(null);
    const hourScrollRef = useRef(null);
    const minuteScrollRef = useRef(null);

    useEffect(() => {
        if (value) {
            const [hour, minute] = value.split(':');
            setSelectedHour(hour);
            setSelectedMinute(minute);
        }
        else {
            setSelectedHour(0);
            setSelectedMinute(0);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            scrollToSelected();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const scrollToSelected = () => {
        setTimeout(() => {
            if (hourScrollRef.current && selectedHour) {
                const hourIndex = parseInt(selectedHour, 10);
                const hourElement = hourScrollRef.current.children[hourIndex];
                if (hourElement) {
                    hourElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }

            if (minuteScrollRef.current && selectedMinute) {
                const minuteIndex = parseInt(selectedMinute, 10);
                const minuteElement = minuteScrollRef.current.children[minuteIndex];
                if (minuteElement) {
                    minuteElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        }, 10);
    };

    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    const handleHourClick = (hour) => {
        setSelectedHour(hour);
        const minute = selectedMinute || "00";
        onChange(`${hour}:${minute}`);
    };

    const handleMinuteClick = (minute) => {
        setSelectedMinute(minute);
        const hour = selectedHour || "00";
        onChange(`${hour}:${minute}`);
        setIsOpen(false);
    };

    const displayValue = value || "";

    return (
        <div className="time-picker-wrapper" ref={pickerRef}>
            <div className="time-input-container">
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    className="form-input-city time-input"
                />
                <IoTimeOutline className="calendar-icon" />
            </div>

            {isOpen && (
                <div className="time-picker-dropdown">
                    <div className="time-picker-header">
                        <span className="time-picker-title">Select Time</span>
                    </div>

                    <div className="time-picker-body">
                        <div className="time-column">
                            <div className="time-column-header">Hours</div>
                            <div className="time-scroll" ref={hourScrollRef}>
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        className={`time-item ${selectedHour === hour ? 'selected' : ''}`}
                                        onClick={() => handleHourClick(hour)}
                                    >
                                        {hour}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="time-separator">:</div>

                        <div className="time-column">
                            <div className="time-column-header">Minutes</div>
                            <div className="time-scroll" ref={minuteScrollRef}>
                                {minutes.map((minute) => (
                                    <div
                                        key={minute}
                                        className={`time-item ${selectedMinute === minute ? 'selected' : ''}`}
                                        onClick={() => handleMinuteClick(minute)}
                                    >
                                        {minute}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}