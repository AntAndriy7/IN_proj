import React, {useState} from "react";
import Select from "react-select";
import "../styles/PlaneSelect.css";

const PlaneSelect = ({ planes, value, onChange, placeholder, disabled = false, maxInputLength = 42, fontSize = "14px" }) => {
    const [isHovered, setIsHovered] = useState(false);

    const groupedOptions = Object.values(
        planes.reduce((acc, plane) => {
            const manufacturer = plane.model.split(' ')[0];
            if (!acc[manufacturer]) {
                acc[manufacturer] = {
                    label: manufacturer,
                    options: []
                };
            }
            acc[manufacturer].options.push({
                value: plane.id,
                label: plane.model,
                seats: plane.seats_number,
                id: plane.id,
                model: plane.model
            });
            return acc;
        }, {})
    );

    const formatOptionLabel = ({ label, seats }) => (
        <div className="plane-option">
            <div>
                <div className="plane-model">{label}</div>
                <div className="plane-info">Capacity: {seats} seats</div>
            </div>
            <div className="plane-seats">{seats}</div>
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
                            label: planes.find(p => p.id === value)?.model || value,
                            seats: planes.find(p => p.id === value)?.seats_number
                        }
                        : null
                }
                onChange={(option) => onChange(option ? option.value : '')}
                onInputChange={(value, { action }) => {
                    if (action === "input-change") {
                        const filtered = value.replace(/[^a-zA-Z0-9\s-]/g, '');
                        return filtered.slice(0, maxInputLength);
                    }
                    return value;
                }}

                filterOption={(option, inputValue) => {
                    const { label, seats } = option.data;
                    const query = inputValue.toLowerCase();

                    return (
                        label.toLowerCase().includes(query) ||
                        seats.toString().includes(query)
                    );
                }}

                options={groupedOptions}
                formatOptionLabel={formatOptionLabel}
                placeholder={placeholder}
                isClearable
                classNamePrefix="plane-select"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        backgroundColor: "#404040",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: state.isFocused ? "0 0 0 1px #ffdd2d" : "none",
                        minHeight: "42px",
                        color: "#fff",
                        fontSize: fontSize,
                        transition: "border-color 0.1s, box-shadow 0.1s",
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
                        border: "1px solid #ffdd2d !important",
                        marginTop: "10px",
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

export default PlaneSelect;