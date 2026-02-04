"use client";

import React, { useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Calendar, Locale } from "react-date-object";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DateObjectType = any;

interface PersianDatePickerProps {
  onDateChange?: (dates: { jalali: string; gregorian: string } | null) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  onDateChange,
  placeholder = "تاریخ را انتخاب کنید",
  className = "",
  containerClassName = "",
}) => {
  const [value, setValue] = useState<DateObjectType>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateChange = (date: any) => {
    setValue(date);

    if (date && onDateChange) {
      // Convert to Jalali format (YYYY/MM/DD)
      const jalaliDate = date.format ? date.format("YYYY/MM/DD") : "";

      // Convert to Gregorian format (YYYY-MM-DD)
      const gregorianDate = date.toDate
        ? date.toDate().toISOString().split("T")[0]
        : "";

      onDateChange({
        jalali: jalaliDate,
        gregorian: gregorianDate,
      });
    } else if (onDateChange) {
      onDateChange(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <DatePicker
        calendar={persian as Calendar}
        locale={persian_fa as Locale}
        value={value}
        onChange={handleDateChange}
        placeholder={placeholder}
        containerClassName={`w-full ${containerClassName}`}
        inputClass="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-right text-gray-900 dark:text-white dark:bg-slate-800/50 dark:border-slate-700/50"
        calendarPosition="bottom-center"
        style={{
          direction: "rtl",
          fontFamily: "inherit",
        }}
        portal
        zIndex={1000}
      />
    </div>
  );
};

export default PersianDatePicker;
