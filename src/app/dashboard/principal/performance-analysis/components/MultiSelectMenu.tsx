"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectMenuProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  formatCountLabel?: (count: number) => string;
}

const MultiSelectMenu = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  formatCountLabel,
}: MultiSelectMenuProps) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = value ?? [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (optionValue: string) => {
    const exists = selected.includes(optionValue);
    const next = exists
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue];
    onChange(next.length > 0 ? next : null);
  };

  const labelText =
    selected.length === 0
      ? placeholder
      : formatCountLabel
      ? formatCountLabel(selected.length)
      : `${selected.length} مورد`;

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900/50 text-slate-100"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <span className={selected.length === 0 ? "text-slate-400" : ""}>
          {labelText}
        </span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-2 w-full rounded-xl border p-2 shadow-lg ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                    checked
                      ? theme === "dark"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-900"
                      : theme === "dark"
                      ? "text-slate-200 hover:bg-slate-800"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
            {options.length === 0 && (
              <div className="px-2 py-3 text-xs text-slate-400">
                موردی برای انتخاب وجود ندارد
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectMenu;
