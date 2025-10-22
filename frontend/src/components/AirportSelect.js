import React from "react";
import Select from "react-select";
import "../styles/AirportSelect.css";

const AirportSelect = ({ airports, value, onChange, placeholder, disabled = false, maxInputLength = 42 }) => {
    const groupedOptions = Object.values(
        airports.reduce((acc, airport) => {
            if (!acc[airport.country]) {
                acc[airport.country] = {
                    label: airport.country,
                    options: []
                };
            }
            acc[airport.country].options.push({
                value: airport.id,
                label: airport.city,
                code: airport.code,
                name: airport.name,
                id: airport.id
            });
            return acc;
        }, {})
    );

    const formatOptionLabel = ({ label, code, name }) => (
        <div className="airport-option">
            <div>
                <div className="airport-city">{label}</div>
                <div className="airport-name">{name}</div>
            </div>
            <div className="airport-code">{code}</div>
        </div>
    );

    return (
        <Select
            isDisabled={disabled}

            value={
                value
                    ? {
                        value,
                        label: airports.find(a => a.id === value)?.city || value,
                        code: airports.find(a => a.id === value)?.code,
                        name: airports.find(a => a.id === value)?.name
                    }
                    : null
            }
            onChange={(option) => onChange(option ? option.value : '')}
            onInputChange={(value, { action }) => {
                if (action === "input-change") {
                    const filtered = value.replace(/[^a-zA-Z\s-]/g, '');
                    return filtered.slice(0, maxInputLength);
                }
                return value;
            }}

            filterOption={(option, inputValue) => {
                const { code, label, name } = option.data;
                const query = inputValue.toLowerCase();

                return (
                    code.toLowerCase().includes(query) ||
                    label.toLowerCase().includes(query) ||
                    name.toLowerCase().includes(query)
                );
            }}

            options={groupedOptions}
            formatOptionLabel={formatOptionLabel}
            placeholder={placeholder}
            isClearable
            classNamePrefix="airport-select"
            styles={{
                control: (base, state) => ({
                    ...base,
                    backgroundColor: "#404040",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: state.isFocused ? "0 0 0 1px #ffdd2d" : "none",
                    minHeight: "42px",
                    color: "#fff",
                    fontSize: "14px",
                    transition: "border-color 0.1s, box-shadow 0.1s",
                }),
                singleValue: (base) => ({
                    ...base,
                    color: "#fff",
                }),
                placeholder: (base) => ({
                    ...base,
                    color: "#878787",
                }),
                menu: (base) => ({
                    ...base,
                    backgroundColor: "#2b2b2b",
                    color: "#fff",
                    borderRadius: "8px",
                    marginTop: "4px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    overflow: "hidden",
                    width: "100%",

                }),
                groupHeading: (base) => ({
                    ...base,
                    color: "#bbb",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "6px 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    backgroundColor: "#1d1d1d",
                }),
                option: (base, { isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected ? "#555555" : "transparent",
                    color: isSelected ? "#ffdd2d" : "#fff",
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    ":hover": {
                        backgroundColor: "#404040"
                    }
                }),
                dropdownIndicator: (base, state) => ({
                    ...base,
                    color: state.isFocused ? "#ffdd2d" : "#ccc",
                    ":hover": { color: "#ffdd2d" },
                }),
                indicatorSeparator: () => ({
                    display: "none",
                }),
                clearIndicator: (base) => ({
                    ...base,
                    color: "#aaa",
                    ":hover": { color: "#ffdd2d" },
                }),
                input: (base) => ({
                    ...base,
                    color: "#fff",
                }),
                menuList: (base) => ({
                    ...base,
                    maxHeight: "400px",
                    overflowY: "auto",
                }),
            }}
        />
    );
};

export default AirportSelect;
