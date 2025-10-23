import React, {useState} from "react";
import Select from "react-select";
import "../styles/AirportSelect.css";

const AirportSelect = ({ airports, value, onChange, placeholder, disabled = false, maxInputLength = 42 }) => {
    const [isHovered, setIsHovered] = useState(false);

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
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                        transition: "box-shadow 0.1s",
                        cursor: "pointer",
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
                        color: (state.isFocused || isHovered) ? "#ffdd2d" : "#ccc",
                        transition: "color 0.2s",
                        ":hover": { color: "#ffdd2d" },
                        cursor: "pointer",
                    }),
                    indicatorSeparator: () => ({
                        display: "none",
                    }),
                    clearIndicator: (base) => ({
                        ...base,
                        color: "#aaa",
                        ":hover": { color: "#ffdd2d" },
                        cursor: "pointer",
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
        </div>
    );
};

export default AirportSelect;
