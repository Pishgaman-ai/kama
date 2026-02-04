"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
L.Icon.Default.prototype.options.iconUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
L.Icon.Default.prototype.options.iconRetinaUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
L.Icon.Default.prototype.options.shadowUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

interface School {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

const SchoolsMap = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Debug: Log the raw data
          console.log("Raw schools data:", result.data.schools);

          // Filter schools that have valid coordinates
          const schoolsWithCoordinates = result.data.schools.filter(
            (school: School) =>
              school.latitude !== null &&
              school.longitude !== null &&
              school.latitude !== undefined &&
              school.longitude !== undefined &&
              !isNaN(school.latitude) &&
              !isNaN(school.longitude)
          );

          // Debug: Log filtered data
          console.log("Schools with coordinates:", schoolsWithCoordinates);

          setSchools(schoolsWithCoordinates);
        } else {
          setError("خطا در بارگیری اطلاعات مدارس");
        }
      } else {
        setError("خطا در بارگیری اطلاعات مدارس");
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری نقشه...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate center point - if we have schools with valid coordinates, center on their average
  // Otherwise default to Tehran coordinates
  let center: [number, number] = [35.6892, 51.389]; // Tehran coordinates

  // Filter schools with valid coordinates for center calculation
  const validSchools = schools.filter(
    (school) =>
      school.latitude !== null &&
      school.longitude !== null &&
      school.latitude !== undefined &&
      school.longitude !== undefined &&
      !isNaN(school.latitude) &&
      !isNaN(school.longitude)
  );

  if (validSchools.length > 0) {
    // Calculate average of all valid school coordinates
    const avgLat =
      validSchools.reduce((sum, school) => sum + school.latitude!, 0) /
      validSchools.length;
    const avgLng =
      validSchools.reduce((sum, school) => sum + school.longitude!, 0) /
      validSchools.length;

    // Only use average if it's valid (reasonable coordinates for Tehran)
    if (!isNaN(avgLat) && !isNaN(avgLng) && avgLat !== 0 && avgLng !== 0) {
      center = [avgLat, avgLng];
    }
  }

  // Ensure we have valid center coordinates
  const isValidCenter =
    center &&
    Array.isArray(center) &&
    center.length === 2 &&
    !isNaN(center[0]) &&
    !isNaN(center[1]) &&
    center[0] !== 0 &&
    center[1] !== 0;

  return (
    <div
      className="h-96 w-full rounded-xl overflow-hidden border relative"
      dir="ltr"
      style={{ zIndex: 0 }}
    >
      {isValidCenter ? (
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {schools
            .filter(
              (school) =>
                school.latitude !== null &&
                school.longitude !== null &&
                school.latitude !== undefined &&
                school.longitude !== undefined &&
                !isNaN(school.latitude) &&
                !isNaN(school.longitude)
            )
            .map((school) => (
              <Marker
                key={school.id}
                position={[school.latitude!, school.longitude!]}
              >
                <Popup>
                  <div className="text-right" dir="rtl">
                    <h3 className="font-bold text-gray-800">{school.name}</h3>
                    {school.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        {school.address}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <p className="text-gray-500">در حال بارگذاری نقشه...</p>
        </div>
      )}
    </div>
  );
};

export default SchoolsMap;
