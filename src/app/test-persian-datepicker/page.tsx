"use client";

import React, { useState } from "react";
import PersianDatePicker from "../components/PersianDatePicker";

const TestPersianDatePickerPage = () => {
  const [selectedDate, setSelectedDate] = useState<{
    jalali: string;
    gregorian: string;
  } | null>(null);

  const handleDateChange = (
    dates: { jalali: string; gregorian: string } | null
  ) => {
    setSelectedDate(dates);
    console.log("Selected dates:", dates);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          تست تقویم شمسی
        </h1>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            انتخاب تاریخ:
          </label>

          <PersianDatePicker
            onDateChange={handleDateChange}
            placeholder="تاریخ را انتخاب کنید"
            className="w-full"
          />

          {selectedDate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                تاریخ انتخاب شده:
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">شمسی:</span>{" "}
                  {selectedDate.jalali}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">میلادی:</span>{" "}
                  {selectedDate.gregorian}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPersianDatePickerPage;
