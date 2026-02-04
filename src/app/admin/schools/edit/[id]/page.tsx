"use client";
import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  School,
  MapPin,
  Plus,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  phone: string;
}

interface School {
  id: string;
  name: string;
  address: string;
  postal_code?: string;
  phone: string;
  email: string;
  established_year: number;
  grade_level: string;
  region: string;
  gender_type: string;
  website_url: string;
  contact_persons: ContactPerson[];
  latitude?: number;
  longitude?: number;
  user_count: number;
  teacher_count: number;
  student_count: number;
  class_count: number;
  principal_count: number;
  created_at: string;
  logo_url?: string;
}

interface EditSchoolData {
  name: string;
  address: string;
  postal_code?: string;
  phone: string;
  email: string;
  established_year: string;
  educational_levels: string[];
  region: string;
  gender_type: string;
  website_url: string;
  contact_persons: ContactPerson[];
  latitude?: number;
  longitude?: number;
}

// Utility function to convert Persian digits to English digits
const convertPersianToEnglishDigits = (value: string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = value;
  for (let i = 0; i < 10; i++) {
    result = result.replace(
      new RegExp(persianDigits[i], "g"),
      englishDigits[i]
    );
  }
  return result;
};

// Utility function to validate phone number format
const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");

  // Check if it's a valid Iranian phone number (starts with 09 and has 11 digits)
  // or a valid landline (starts with 0 and has 10-11 digits)
  const mobileRegex = /^09\d{9}$/;
  const landlineRegex = /^0\d{9,10}$/;

  return mobileRegex.test(digitsOnly) || landlineRegex.test(digitsOnly);
};

// Fix for default marker icons in Leaflet
L.Icon.Default.prototype.options.iconUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
L.Icon.Default.prototype.options.iconRetinaUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
L.Icon.Default.prototype.options.shadowUrl =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

function MapComponent({
  latitude,
  longitude,
  address,
  onLocationSelect,
  onAddressChange,
}: {
  latitude: number | undefined;
  longitude: number | undefined;
  address: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);

  // Default to Tehran coordinates if not provided or invalid
  const center: [number, number] =
    latitude !== undefined &&
    longitude !== undefined &&
    !isNaN(latitude) &&
    !isNaN(longitude)
      ? [latitude, longitude]
      : [35.6892, 51.389]; // Tehran coordinates

  const MapClickHandler = () => {
    const map = useMap();

    useMapEvents({
      click(e) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);

        // Reverse geocode to get address
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=fa`
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.display_name) {
              onAddressChange(data.display_name);
            }
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
          });
      },
    });
    return null;
  };

  const handleSearch = (query: string) => {
    const map = mapRef.current;
    if (!map) return;

    // Add a small delay to ensure the UI is responsive
    setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + " تهران"
        )}&accept-language=fa&limit=5`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            // Update map view with appropriate zoom level
            map.setView([lat, lon], 16);

            // Update location
            onLocationSelect(lat, lon);

            // Update address
            if (result.display_name) {
              onAddressChange(result.display_name);
            }
          } else {
            // Handle case when no results found
            console.warn("No search results found for query:", query);
          }
        })
        .catch((error) => {
          console.error("Error searching address:", error);
        });
    }, 100);
  };

  return (
    <div
      className="h-96 w-full rounded-xl overflow-hidden border relative"
      dir="ltr"
      style={{ zIndex: 0 }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SearchControl onSearch={handleSearch} />
        <MapClickHandler />
        {latitude !== undefined &&
          longitude !== undefined &&
          !isNaN(latitude) &&
          !isNaN(longitude) && (
            <Marker position={[latitude, longitude]}>
              <Popup>موقعیت ذخیره شده مدرسه</Popup>
            </Marker>
          )}
      </MapContainer>
    </div>
  );
}

function SearchControl({ onSearch }: { onSearch: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (controlRef.current) {
      // ⛔️ جلوگیری از propagate شدن کلیک‌ها به نقشه
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div
      ref={controlRef}
      className="leaflet-top leaflet-center"
      style={{
        position: "relative",
        zIndex: 1000,
        margin: "10px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="leaflet-control leaflet-bar"
        style={{
          backgroundColor: "white",
          padding: "5px",
          borderRadius: "4px",
        }}
      >
        <form onSubmit={handleSubmit} className="flex gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی آدرس..."
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            style={{ width: "200px" }}
          />
          <button
            type="submit"
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="جستجو"
          >
            <MapPin size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the params promise
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const { theme } = useTheme();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editSchoolData, setEditSchoolData] = useState<EditSchoolData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    established_year: "",
    educational_levels: [],
    region: "",
    gender_type: "",
    website_url: "",
    contact_persons: [],
    latitude: undefined,
    longitude: undefined,
  });

  useEffect(() => {
    fetchSchool();
  }, [id]);

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/admin/schools/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const schoolData = result.data.school;
          console.log("School data received:", schoolData); // Debug log

          // Ensure contact_persons is an array
          let contactPersons = [];
          if (Array.isArray(schoolData.contact_persons)) {
            contactPersons = schoolData.contact_persons;
          } else if (typeof schoolData.contact_persons === "string") {
            try {
              contactPersons = JSON.parse(schoolData.contact_persons);
            } catch (e) {
              console.error("Error parsing contact persons:", e);
              contactPersons = [];
            }
          }

          // Ensure each contact person has a unique ID
          const contactPersonsWithIds = contactPersons.map(
            (person: ContactPerson, index: number) => ({
              ...person,
              id: person.id || `contact-${index}-${Date.now()}`,
            })
          );

          setSchool(schoolData);
          setEditSchoolData({
            name: schoolData.name,
            address: schoolData.address || "",
            postal_code: schoolData.postal_code || "",
            phone: schoolData.phone || "",
            email: schoolData.email || "",
            established_year: schoolData.established_year
              ? schoolData.established_year.toString()
              : "",
            educational_levels: schoolData.grade_level
              ? schoolData.grade_level.split(",").filter(Boolean)
              : [],
            region: schoolData.region || "",
            gender_type: schoolData.gender_type || "",
            website_url: schoolData.website_url || "",
            contact_persons: contactPersonsWithIds,
            latitude: schoolData.latitude,
            longitude: schoolData.longitude,
          });

          // Set logo preview if exists
          if (schoolData.logo_url) {
            setLogoPreview(schoolData.logo_url);
          }
        } else {
          setFormError("خطا در بارگیری اطلاعات مدرسه");
        }
      } else {
        setFormError("خطا در بارگیری اطلاعات مدرسه");
      }
    } catch (error) {
      console.error("Error fetching school:", error);
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        setFormError("فایل انتخاب شده باید یک تصویر باشد");
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFormError("حجم فایل نباید بیشتر از 2 مگابایت باشد");
        return;
      }

      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file selected, keep the existing logo preview
      // Only clear preview if explicitly requested (e.g., by a clear button)
      // For now, we keep the existing preview
    }
  };

  const handleEditSchool = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (!editSchoolData.name.trim()) {
        setFormError("نام مدرسه الزامی است");
        return;
      }

      if (!editSchoolData.address.trim()) {
        setFormError("آدرس مدرسه الزامی است");
        return;
      }

      if (
        editSchoolData.latitude === undefined ||
        editSchoolData.longitude === undefined
      ) {
        setFormError("موقعیت مدرسه روی نقشه الزامی است");
        return;
      }

      if (editSchoolData.educational_levels.length === 0) {
        setFormError("حداقل یک دوره تحصیلی باید انتخاب شود");
        return;
      }

      if (!editSchoolData.gender_type) {
        setFormError("نوعیت جنسیتی مدرسه الزامی است");
        return;
      }

      if (!editSchoolData.region) {
        setFormError("منطقه مدرسه الزامی است");
        return;
      }

      // Validate school phone number if provided
      if (editSchoolData.phone && !isValidPhoneNumber(editSchoolData.phone)) {
        setFormError(
          "شماره تماس مدرسه نامعتبر است. لطفاً یک شماره تماس معتبر وارد کنید."
        );
        return;
      }

      // Validate contact persons
      if (editSchoolData.contact_persons.length === 0) {
        setFormError("حداقل یک شخص تماس الزامی است");
        return;
      }

      // Validate each contact person
      for (const person of editSchoolData.contact_persons) {
        if (!person.name.trim()) {
          setFormError("نام همه اشخاص تماس الزامی است");
          return;
        }

        if (!person.phone.trim()) {
          setFormError("شماره تماس همه اشخاص تماس الزامی است");
          return;
        }

        if (!isValidPhoneNumber(person.phone)) {
          setFormError(
            `شماره تماس برای "${person.name}" نامعتبر است. لطفاً یک شماره تماس معتبر وارد کنید.`
          );
          return;
        }
      }

      // Create FormData object to handle file uploads
      const formData = new FormData();

      // Append all text fields
      formData.append("name", editSchoolData.name.trim());
      formData.append("address", editSchoolData.address.trim() || "");
      formData.append("postal_code", editSchoolData.postal_code?.trim() || "");
      formData.append("phone", editSchoolData.phone.trim() || "");
      formData.append("email", editSchoolData.email.trim() || "");
      formData.append(
        "established_year",
        editSchoolData.established_year || ""
      );
      formData.append(
        "grade_level",
        editSchoolData.educational_levels.join(",") || ""
      );
      formData.append("region", editSchoolData.region.trim() || "");
      formData.append("gender_type", editSchoolData.gender_type || "");
      formData.append("website_url", editSchoolData.website_url.trim() || "");
      formData.append(
        "contact_persons",
        JSON.stringify(editSchoolData.contact_persons)
      );
      formData.append("latitude", editSchoolData.latitude?.toString() || "");
      formData.append("longitude", editSchoolData.longitude?.toString() || "");

      // Append logo file if selected
      const logoInput = document.getElementById(
        "school-logo"
      ) as HTMLInputElement;
      if (logoInput?.files?.[0]) {
        formData.append("logo", logoInput.files[0]);
      }

      const response = await fetch(`/api/admin/schools/${id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess(
          `اطلاعات مدرسه "${editSchoolData.name}" با موفقیت به‌روزرسانی شد!`
        );
        setTimeout(() => {
          router.push("/admin/schools");
        }, 2000);
      } else {
        setFormError(result.error || "خطا در به‌روزرسانی مدرسه");
      }
    } catch (error) {
      console.error("Error updating school:", error);
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/schools"
          className={`p-2 rounded-lg transition-colors ${
            theme === "dark"
              ? "hover:bg-slate-800 text-slate-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          ویرایش مدرسه
        </h1>
      </div>

      {school && (
        <div
          className={`rounded-2xl border p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  لوگوی مدرسه
                </label>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="پیش‌نمایش لوگو"
                        className="w-16 h-16 rounded-lg object-contain object-center border"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center ${
                          theme === "dark"
                            ? "border-slate-600 bg-slate-800"
                            : "border-gray-300 bg-gray-100"
                        }`}
                      >
                        <School
                          className={`w-8 h-8 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <div
                      className={`relative rounded-lg border-2 border-dashed ${
                        theme === "dark"
                          ? "border-slate-600 hover:border-slate-500"
                          : "border-gray-300 hover:border-gray-400"
                      } transition-colors`}
                    >
                      <input
                        type="file"
                        id="school-logo"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="انتخاب لوگوی مدرسه"
                      />
                      <div className="py-3 px-4 text-center">
                        <Plus
                          className={`w-5 h-5 mx-auto mb-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-600"
                          }`}
                        >
                          انتخاب تصویر
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-500"
                          }`}
                        >
                          JPG, PNG تا حداکثر 2MB
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-xs mt-2 ${
                        theme === "dark" ? "text-slate-500" : "text-gray-500"
                      }`}
                    >
                      لوگوی مدرسه (اختیاری)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام مدرسه *
                </label>
                <input
                  type="text"
                  value={editSchoolData.name}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="نام مدرسه را وارد کنید"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  آدرس *
                </label>
                <textarea
                  value={editSchoolData.address}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  rows={3}
                  placeholder="آدرس مدرسه را وارد کنید"
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  کد پستی
                </label>
                <input
                  type="text"
                  value={editSchoolData.postal_code || ""}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      postal_code: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="کد پستی مدرسه را وارد کنید"
                />
              </div>

              {/* Map Component - Shows marker at saved location */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    موقعیت جغرافیایی *
                  </label>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    بر روی نقشه کلیک کنید تا موقعیت مدرسه را انتخاب کنید
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset map to Tehran center
                      setEditSchoolData((prev) => ({
                        ...prev,
                        latitude: 35.6892,
                        longitude: 51.389,
                      }));
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === "dark"
                        ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    مرکز تهران
                  </button>
                </div>
                <MapComponent
                  key={`${editSchoolData.latitude || ""}-${
                    editSchoolData.longitude || ""
                  }`}
                  latitude={editSchoolData.latitude}
                  longitude={editSchoolData.longitude}
                  address={editSchoolData.address}
                  onLocationSelect={(lat, lng) => {
                    setEditSchoolData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }));
                  }}
                  onAddressChange={(address) => {
                    setEditSchoolData((prev) => ({
                      ...prev,
                      address,
                    }));
                  }}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شماره تماس
                </label>
                <input
                  type="tel"
                  value={editSchoolData.phone}
                  onChange={(e) => {
                    // Convert Persian digits to English digits
                    const englishDigitsValue = convertPersianToEnglishDigits(
                      e.target.value
                    );
                    setEditSchoolData((prev) => ({
                      ...prev,
                      phone: englishDigitsValue,
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="شماره تماس را وارد کنید"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ایمیل
                </label>
                <input
                  type="email"
                  value={editSchoolData.email}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="ایمیل را وارد کنید"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  سال تأسیس
                </label>
                <input
                  type="number"
                  value={editSchoolData.established_year}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      established_year: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="سال تأسیس را وارد کنید"
                  min="1300"
                  max="1500"
                />
              </div>

              {/* Replace grade level with educational levels */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  دوره تحصیلی *
                </label>
                <div className="space-y-2">
                  {[
                    { id: "elementary", label: "دوره ابتدایی" },
                    { id: "middle", label: "دوره متوسطه اول" },
                    { id: "high", label: "دوره متوسطه دوم" },
                  ].map((level) => (
                    <div key={level.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-level-${level.id}`}
                        checked={editSchoolData.educational_levels.includes(
                          level.id
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSchoolData((prev) => ({
                              ...prev,
                              educational_levels: [
                                ...prev.educational_levels,
                                level.id,
                              ],
                            }));
                          } else {
                            setEditSchoolData((prev) => ({
                              ...prev,
                              educational_levels:
                                prev.educational_levels.filter(
                                  (id) => id !== level.id
                                ),
                            }));
                          }
                        }}
                        className={`w-4 h-4 rounded focus:ring-2 ${
                          theme === "dark"
                            ? "bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500"
                            : "bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                        }`}
                      />
                      <label
                        htmlFor={`edit-level-${level.id}`}
                        className={`mr-2 text-sm ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  منطقه *
                </label>
                <select
                  value={editSchoolData.region}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      region: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  title="منطقه مدرسه را انتخاب کنید"
                >
                  <option value="">انتخاب کنید</option>
                  {Array.from({ length: 22 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      منطقه {num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نوعیت جنسیتی *
                </label>
                <select
                  value={editSchoolData.gender_type}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      gender_type: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  title="نوعیت جنسیتی مدرسه را انتخاب کنید"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="boys">پسرانه</option>
                  <option value="girls">دخترانه</option>
                  <option value="mixed">مختلط</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  آدرس وب‌سایت
                </label>
                <input
                  type="url"
                  value={editSchoolData.website_url}
                  onChange={(e) =>
                    setEditSchoolData((prev) => ({
                      ...prev,
                      website_url: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="آدرس وب‌سایت مدرسه"
                />
              </div>
            </div>
          </div>

          {/* Contact Persons Section */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3
                className={`text-lg font-medium ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                اشخاص تماس *
              </h3>
              <p
                className={`text-xs ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                حداقل یک شخص تماس با شماره تماس الزامی است
              </p>
              <button
                type="button"
                onClick={() => {
                  const newContactPerson: ContactPerson = {
                    id: Date.now().toString(),
                    name: "",
                    title: "",
                    phone: "",
                  };
                  setEditSchoolData((prev) => ({
                    ...prev,
                    contact_persons: [
                      ...prev.contact_persons,
                      newContactPerson,
                    ],
                  }));
                }}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                <Plus className="w-4 h-4" />
                افزودن شخص
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {editSchoolData.contact_persons.map((person, index) => (
                <div
                  key={person.id}
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        نام شخص
                      </label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => {
                          const updatedPersons = [
                            ...editSchoolData.contact_persons,
                          ];
                          updatedPersons[index].name = e.target.value;
                          setEditSchoolData((prev) => ({
                            ...prev,
                            contact_persons: updatedPersons,
                          }));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 ${
                          theme === "dark"
                            ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        placeholder="نام شخص"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        عنوان
                      </label>
                      <input
                        type="text"
                        value={person.title}
                        onChange={(e) => {
                          const updatedPersons = [
                            ...editSchoolData.contact_persons,
                          ];
                          updatedPersons[index].title = e.target.value;
                          setEditSchoolData((prev) => ({
                            ...prev,
                            contact_persons: updatedPersons,
                          }));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 ${
                          theme === "dark"
                            ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        placeholder="عنوان (مثلاً مدیر، معاون)"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        شماره تماس
                      </label>
                      <input
                        type="tel"
                        value={person.phone}
                        onChange={(e) => {
                          // Convert Persian digits to English digits
                          const englishDigitsValue =
                            convertPersianToEnglishDigits(e.target.value);

                          const updatedPersons = [
                            ...editSchoolData.contact_persons,
                          ];
                          updatedPersons[index].phone = englishDigitsValue;
                          setEditSchoolData((prev) => ({
                            ...prev,
                            contact_persons: updatedPersons,
                          }));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 ${
                          theme === "dark"
                            ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        placeholder="شماره تماس"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPersons =
                          editSchoolData.contact_persons.filter(
                            (_, i) => i !== index
                          );
                        setEditSchoolData((prev) => ({
                          ...prev,
                          contact_persons: updatedPersons,
                        }));
                      }}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        theme === "dark"
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title="حذف شخص تماس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {editSchoolData.contact_persons.length === 0 && (
                <div
                  className={`text-center py-6 rounded-xl border-2 border-dashed ${
                    theme === "dark"
                      ? "border-slate-700 text-slate-500"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">هیچ شخص تماسی اضافه نشده است</p>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {formError && (
            <div
              className={`mt-6 rounded-xl p-4 border ${
                theme === "dark"
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <svg
                  className={`w-5 h-5 mt-0.5 ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                >
                  {formError}
                </p>
              </div>
            </div>
          )}

          {formSuccess && (
            <div
              className={`mt-6 rounded-xl p-4 border ${
                theme === "dark"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <svg
                  className={`w-5 h-5 mt-0.5 ${
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  {formSuccess}
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <Link
              href="/admin/schools"
              className={`px-4 py-3 rounded-xl transition-colors ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  : "bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
              }`}
            >
              انصراف
            </Link>
            <button
              type="button"
              onClick={handleEditSchool}
              disabled={formLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  ذخیره تغییرات
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
