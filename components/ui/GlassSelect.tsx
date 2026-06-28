"use client";

/**
 * Glassmorphic Select Component
 * Custom styled dropdown with glassmorphism design
 */

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function GlassSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 glass-card text-white rounded-xl flex items-center justify-between transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-white/10 focus:ring-2 focus:ring-indigo-500"
        } ${isOpen ? "ring-2 ring-indigo-500" : ""}`}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? "text-white" : "text-white/40"}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <svg
          className={`w-5 h-5 text-white/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/20 rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-y-auto z-50 animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 flex items-center gap-2 text-left transition-colors duration-150 ${
                option.value === value
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "text-white hover:bg-white/10"
              } ${
                option === options[0] ? "rounded-t-xl" : ""
              } ${
                option === options[options.length - 1] ? "rounded-b-xl" : ""
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.value === value && (
                <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
