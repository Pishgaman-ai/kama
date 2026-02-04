"use client";
import React from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";

type AlertVariant = "success" | "info" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string | React.ReactNode;
  className?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { styles: string; icon: React.ReactNode; ariaLive: "polite" | "assertive" }
> = {
  success: {
    styles:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    icon: (
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    ),
    ariaLive: "polite",
  },
  info: {
    styles:
      "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30",
    icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    ariaLive: "polite",
  },
  warning: {
    styles:
      "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    icon: (
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    ),
    ariaLive: "polite",
  },
  error: {
    styles:
      "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/90",
    icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-500" />,
    ariaLive: "assertive",
  },
};

export default function Alert({
  variant = "info",
  title,
  description,
  className = "",
  onClose,
  icon,
  children,
}: AlertProps) {
  const config = variantConfig[variant];
  const content = children || description;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-sm ${config.styles} ${className}`}
      role="status"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon !== undefined ? icon : config.icon}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-semibold text-sm mb-1 leading-tight">{title}</h5>
        )}
        {content && (
          <div className="text-sm leading-relaxed opacity-90">{content}</div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
