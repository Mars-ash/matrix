"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { DEFAULT_CUSTOMERS } from "@/lib/types";
import { api } from "@/lib/api-client";

export interface CustomerComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options?: readonly string[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export function CustomerCombobox({
  value,
  onChange,
  options,
  placeholder = "Cari atau pilih customer...",
  error,
  disabled = false,
  id,
  autoFocus = false,
}: CustomerComboboxProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [partnerCustomers, setPartnerCustomers] = useState<string[]>([]);

  useEffect(() => {
    if (options !== undefined) return;
    let isMounted = true;
    api.getPartners("customer", "active")
      .then((data) => {
        if (isMounted && data.length > 0) {
          setPartnerCustomers(data.map((p) => p.name));
        }
      })
      .catch(() => {
        // Fallback to default options
      });
    return () => {
      isMounted = false;
    };
  }, [options]);

  const effectiveOptions = useMemo(() => {
    if (options !== undefined) return options;
    if (partnerCustomers.length > 0) return partnerCustomers;
    return DEFAULT_CUSTOMERS;
  }, [options, partnerCustomers]);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
    maxHeight: 250,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxContainerRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal query text when external value changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return effectiveOptions;
    return effectiveOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [effectiveOptions, query]);

  // Calculate and update dropdown position (escapes overflow containers via Portal)
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight =
      typeof window !== "undefined"
        ? window.innerHeight || document.documentElement.clientHeight
        : 800;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;

    const availableHeight = placeAbove
      ? Math.max(120, Math.min(260, spaceAbove - 16))
      : Math.max(120, Math.min(260, spaceBelow - 16));

    setCoords({
      top: placeAbove ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width || containerRef.current.offsetWidth || 320,
      placeAbove,
      maxHeight: availableHeight,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle outside click to close dropdown & enforce strict selection
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = listboxContainerRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
        // If query doesn't match current selected value, check if exact match exists, else revert
        const trimmed = query.trim().toLowerCase();
        const exactMatch = effectiveOptions.find(
          (opt) => opt.toLowerCase() === trimmed
        );
        if (exactMatch) {
          onChange(exactMatch);
          setQuery(exactMatch);
        } else {
          // Revert to current confirmed value
          setQuery(value || "");
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [query, value, effectiveOptions, onChange]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, activeIndex]);

  const selectOption = useCallback(
    (option: string) => {
      justSelectedRef.current = true;
      onChange(option);
      setQuery(option);
      setIsOpen(false);
      setActiveIndex(-1);
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 250);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setQuery("");
      setActiveIndex(-1);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
          setActiveIndex(0);
        } else if (filteredOptions.length > 0) {
          setActiveIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
          setActiveIndex(filteredOptions.length - 1);
        } else if (filteredOptions.length > 0) {
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
      } else if (e.key === "Enter") {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
            selectOption(filteredOptions[activeIndex]);
          } else if (filteredOptions.length === 1) {
            // If only 1 filtered match, select it
            selectOption(filteredOptions[0]);
          }
        }
      } else if (e.key === "Escape") {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setQuery(value || "");
        }
      }
    },
    [disabled, isOpen, filteredOptions, activeIndex, selectOption, value, updatePosition]
  );

  const dropdownMenu = isOpen && mounted && typeof document !== "undefined" && (
    <div
      ref={listboxContainerRef}
      style={{
        position: "fixed",
        left: coords.left,
        width: coords.width,
        ...(coords.placeAbove
          ? {
              bottom: Math.max(
                0,
                (window.innerHeight || document.documentElement.clientHeight) -
                  coords.top
              ),
            }
          : { top: coords.top }),
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 99999,
        maxHeight: coords.maxHeight,
        overflowY: "auto",
      }}
    >
      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        style={{
          listStyle: "none",
          margin: 0,
          padding: "4px 0",
        }}
      >
        {filteredOptions.length === 0 ? (
          <li
            style={{
              padding: "12px 14px",
              fontSize: 12,
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}
          >
            Tidak ada customer yang cocok &quot;{query}&quot;
          </li>
        ) : (
          filteredOptions.map((option, idx) => {
            const isActive = idx === activeIndex;

            return (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: "8px 12px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  background: isActive
                    ? "var(--color-bg-hover)"
                    : "transparent",
                  color: "var(--color-text)",
                  fontWeight: 400,
                  transition: "background 80ms",
                }}
              >
                <span>{option}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%" }}
      className="customer-combobox-root"
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="input"
          style={{
            paddingRight: value ? 56 : 34,
            borderColor: error ? "var(--color-status-problem)" : undefined,
          }}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            updatePosition();
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            if (justSelectedRef.current) return;
            updatePosition();
            setIsOpen(true);
          }}
          onClick={() => {
            if (disabled || justSelectedRef.current) return;
            if (!isOpen) {
              updatePosition();
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />

        <div
          style={{
            position: "absolute",
            right: 6,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {query && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear customer"
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                padding: "2px 4px",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: 12,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle customer list"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              updatePosition();
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            style={{
              background: "none",
              border: "none",
              padding: "4px 4px",
              cursor: disabled ? "default" : "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 150ms ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ pointerEvents: "none" }}
            >
              <path d="M8 11L3 6h10z" />
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="error-text" style={{ marginTop: 4 }}>{error}</p>}

      {mounted &&
        typeof document !== "undefined" &&
        dropdownMenu &&
        createPortal(dropdownMenu, document.body)}
    </div>
  );
}
