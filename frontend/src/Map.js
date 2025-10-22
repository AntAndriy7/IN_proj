import './styles/Map.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import planeIconImg from "./resources/plane.png";

const createRotatedPlaneIcon = (heading) => {
    if (heading === null || heading === undefined) {
        return new L.Icon({
            iconUrl: planeIconImg,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    const rotatedIconHtml = `
        <div style="
            transform: rotate(${heading}deg);
            transform-origin: center;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <img src="${planeIconImg}" style="width: 30px; height: 30px;" alt="plane" />
        </div>
    `;

    return new L.DivIcon({
        html: rotatedIconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
        className: 'rotated-plane-icon'
    });
};

function ResizeHandler() {
    const map = useMap();

    useEffect(() => {
        const timeouts = [100, 300, 500];
        const timeoutIds = timeouts.map(delay =>
            setTimeout(() => {
                map.invalidateSize({ animate: false });
            }, delay)
        );

        const handleResize = () => {
            map.invalidateSize({ animate: false });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            timeoutIds.forEach(id => clearTimeout(id));
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);

    return null;
}

function Map() {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    const fetchPlanes = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/plane/opensky", {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            console.log("Planes:", data);
            setPlanes(data);
        } catch (error) {
            console.error("Error fetching planes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanes();

        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize({ animate: false });
            }
        }, 100);
    }, []);

    const whenReady = () => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize({ animate: false });
            }, 0);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchPlanes();
    };

    return (
        <div className="map-wrapper">
            <button
                className={`refresh-button`}
                onClick={handleRefresh}
                title="Update plane data"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M4 4V9H4.58152M4.58152 9C5.24618 7.35652 6.43101 5.98175 7.96065 5.07538C9.49029 4.16901 11.2847 3.78338 13.0729 4.00233C14.8611 4.22128 16.5302 5.03258 17.8014 6.30372C19.0725 7.57487 19.8838 9.24403 20.1028 11.0322M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.7538 16.6435 17.569 18.0183 16.0394 18.9246C14.5097 19.831 12.7153 20.2166 10.9271 19.9977C9.13893 19.7787 7.46982 18.9674 6.19867 17.6963C4.92753 16.4251 4.11623 14.756 3.89728 12.9678M19.4185 15H15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {loading && (
                <div className="loading-overlay">
                    <div>Loading planes...</div>
                </div>
            )}

            <MapContainer
                center={[50.4501, 30.5234]}
                zoom={6}
                className="map-container"
                ref={mapRef}
                whenReady={whenReady}
                style={{ height: '100%', width: '100%' }}
            >
                <ResizeHandler />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors, &copy; <a href='https://carto.com/attributions'>CARTO</a>"
                />

                {planes
                    .filter(p => p.latitude !== null && p.longitude !== null)
                    .map((plane) => (
                        <Marker
                            key={plane.icao24}
                            position={[plane.latitude, plane.longitude]}
                            icon={createRotatedPlaneIcon(plane.heading)}
                        >
                            <Popup>
                                ✈ <b>{plane.callsign?.trim() || "Unknown"}</b><br />
                                Country: {plane.originCountry}<br />
                                Altitude: {plane.altitude ? `${plane.altitude.toFixed(0)} m` : "N/A"}<br />
                                Velocity: {plane.velocity ? `${plane.velocity.toFixed(1)} m/s` : "N/A"}<br />
                            </Popup>
                        </Marker>
                    ))}
            </MapContainer>
        </div>
    );
}

export default Map;