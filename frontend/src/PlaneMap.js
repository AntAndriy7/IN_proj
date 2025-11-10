import './styles/Map.css';
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import planeIconImg from "./resources/plane.png";

const iconCache = new Map();
const planeImage = new Image();
planeImage.src = planeIconImg;

// Создаем Canvas-based иконки вместо DivIcon для лучшей производительности
const createRotatedPlaneIcon = (heading) => {
    const key = Math.round((heading || 0) / 10) * 10; // Кэшируем каждые 10 градусов
    if (iconCache.has(key)) return iconCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');

    // Рисуем повернутое изображение
    ctx.save();
    ctx.translate(15, 15);
    ctx.rotate((key * Math.PI) / 180);
    ctx.drawImage(planeImage, -15, -15, 30, 30);
    ctx.restore();

    const icon = new L.Icon({
        iconUrl: canvas.toDataURL(),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });

    iconCache.set(key, icon);
    return icon;
};

function ResizeHandler() {
    const map = useMap();
    useEffect(() => {
        const handleResize = () => map.invalidateSize({ animate: false });
        const timeouts = [100, 300, 500].map(delay =>
            setTimeout(() => map.invalidateSize({ animate: false }), delay)
        );
        window.addEventListener("resize", handleResize);
        return () => {
            timeouts.forEach(clearTimeout);
            window.removeEventListener("resize", handleResize);
        };
    }, [map]);
    return null;
}

function MapRefCollector({ mapRef }) {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);
    return null;
}

function PlaneMap() {
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    const markersRef = useRef(new Map()); // Храним маркеры по callsign для переиспользования
    const planesDataRef = useRef([]); // Кэшируем все данные самолетов локально

    // Функция для обновления маркеров на карте из локальных данных
    const updateMarkersFromCache = () => {
        if (!mapRef.current || planesDataRef.current.length === 0) return;

        const map = mapRef.current;

        // Создаем группу если её нет
        if (!layerRef.current) {
            layerRef.current = L.layerGroup().addTo(map);
        }

        const currentMarkers = new Map();
        const bounds = map.getBounds();

        // Расширяем границы для предзагрузки маркеров вокруг видимой области
        const paddedBounds = bounds.pad(0.3);

        // Обновляем только видимые самолеты из кэша
        planesDataRef.current.forEach((plane) => {
            if (!plane.latitude || !plane.longitude) return;

            const id = plane.callsign?.trim() || `${plane.icao24 || plane.latitude}-${plane.longitude}`;
            const latLng = [plane.latitude, plane.longitude];

            // Проверяем, виден ли самолет на карте (с отступом)
            if (!paddedBounds.contains(latLng)) return;

            const existingMarker = markersRef.current.get(id);

            if (existingMarker) {
                // Обновляем позицию и иконку существующего маркера
                existingMarker.setLatLng(latLng);
                existingMarker.setIcon(createRotatedPlaneIcon(plane.heading));

                // Обновляем popup content если нужно
                existingMarker.setPopupContent(`
                    ✈ <b>${plane.callsign?.trim() || "Unknown"}</b><br/>
                    Country: ${plane.originCountry}<br/>
                    Altitude: ${plane.altitude ? plane.altitude.toFixed(0) + " m" : "N/A"}<br/>
                    Velocity: ${plane.velocity ? plane.velocity.toFixed(1) + " m/s" : "N/A"}<br/>
                `);

                currentMarkers.set(id, existingMarker);
            } else {
                // Создаем новый маркер
                const marker = L.marker(latLng, {
                    icon: createRotatedPlaneIcon(plane.heading),
                    riseOnHover: true
                });

                marker.bindPopup(`
                    ✈ <b>${plane.callsign?.trim() || "Unknown"}</b><br/>
                    Country: ${plane.originCountry}<br/>
                    Altitude: ${plane.altitude ? plane.altitude.toFixed(0) + " m" : "N/A"}<br/>
                    Velocity: ${plane.velocity ? plane.velocity.toFixed(1) + " m/s" : "N/A"}<br/>
                `, {
                    autoPan: false,
                    closeButton: true,
                    maxWidth: 300
                });

                marker.addTo(layerRef.current);
                currentMarkers.set(id, marker);
            }
        });

        // Удаляем маркеры, которых больше нет в данных
        markersRef.current.forEach((marker, id) => {
            if (!currentMarkers.has(id)) {
                layerRef.current.removeLayer(marker);
            }
        });

        markersRef.current = currentMarkers;

        console.log(`Rendered ${currentMarkers.size} planes from cache (total: ${planesDataRef.current.length})`);
    };

    // Функция для загрузки данных с бэкенда
    const fetchPlanes = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8080/api/plane/opensky");
            const data = await response.json();

            // Сохраняем данные локально
            planesDataRef.current = data;
            console.log(`Fetched ${data.length} planes from backend`);

            // Обновляем маркеры из новых данных
            updateMarkersFromCache();
        } catch (error) {
            console.error("Error fetching planes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Загружаем изображение самолета перед первым рендером
        planeImage.onload = () => {
            fetchPlanes();
        };

        if (planeImage.complete) {
            fetchPlanes();
        }

        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize({ animate: false });
            }
        }, 100);

        // Обновляем маркеры при движении/зуме карты БЕЗ запроса к бэку
        const handleMoveEnd = () => {
            updateMarkersFromCache(); // Используем локальный кэш
        };

        // Добавляем слушатель через небольшую задержку, чтобы карта инициализировалась
        const timer = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.on('moveend', handleMoveEnd);
                mapRef.current.on('zoomend', handleMoveEnd);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.off('moveend', handleMoveEnd);
                mapRef.current.off('zoomend', handleMoveEnd);
            }
        };
    }, []);

    return (
        <div className="map-wrapper">
            <button
                className="refresh-button"
                onClick={fetchPlanes}
                title="Update plane data"
                disabled={loading}
            >
                {loading ? (
                    <span>Loading...</span>
                ) : (
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
                )}
            </button>

            {loading && (
                <div className="loading-overlay">
                    <div>Loading planes...</div>
                </div>
            )}

            <MapContainer
                center={[50.4501, 30.5234]}
                zoom={6}
                minZoom={6}
                maxZoom={10}
                className="map-container"
                style={{ height: '100%', width: '100%' }}
                preferCanvas={true}
            >
                <MapRefCollector mapRef={mapRef} />
                <ResizeHandler />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
                    updateWhenIdle={true}
                    updateWhenZooming={false}
                    keepBuffer={2}
                />
            </MapContainer>
        </div>
    );
}

export default PlaneMap;