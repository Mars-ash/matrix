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
import type { Project } from "@/lib/types";

export interface JoPickerProps {
  projects: Project[];
  value: string; // selected joId, "" = none
  onChange: (joId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

interface JoOption {
  joId: string;
  joNumber: string;
  product: string;
  display: string;
  label: string;
  subLabel: string;
  haystack: string;
}

const MAX_OPTIONS = 50;

export function JoPicker({
  projects,
  value,
  onChange,
  placeholder = "Cari nomor JO / project...",
  disabled = false,
  id,
}: JoPickerProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxContainerRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // All flat options
  const allOptions = useMemo<JoOption[]>(() => {
    const list: JoOption[] = [];
    for (const project of projects) {
      for (const jo of project.jos) {
        list.push({
          joId: jo.id,
          joNumber: jo.joNumber,
          product: jo.product,
          display: `JO ${jo.joNumber}`,
          label: `JO ${jo.joNumber} — ${jo.product}`,
          subLabel: `${project.name} · ${project.customer}`,
          haystack: `${jo.joNumber} ${jo.product} ${project.name} ${project.customer}`.toLowerCase(),
        });
      }
    }
    return list;
  }, [projects]);

  // Selected option
  const selectedOption = useMemo(
    () => allOptions.find((opt) => opt.joId === value) || null,
    [allOptions, value]
  );

  // Sync query when value changes from outside
  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.display);
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedOption]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    // If the query matches the current selection's display label, show all options
    if (!q || (selectedOption && q === selectedOption.display.toLowerCase())) {
      return allOptions;
    }
    return allOptions.filter((opt) => opt.haystack.includes(q));
  }, [allOptions, query, selectedOption]);

  const visibleOptions = useMemo(
    () => filteredOptions.slice(0, MAX_OPTIONS),
    [filteredOptions]
  );
  const hasMore = filteredOptions.length > MAX_OPTIONS;

  // Calculate and update dropdown position
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

  // Outside click handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = listboxContainerRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
        // Revert to selected option text if available, else blank
        if (selectedOption) {
          setQuery(selectedOption.display);
        } else {
          setQuery("");
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectedOption]);

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
    (option: JoOption) => {
      justSelectedRef.current = true;
      onChange(option.joId);
      setQuery(option.display);
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
      inputRef.current?.focus();
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
        } else if (visibleOptions.length > 0) {
          setActiveIndex((prev) =>
            prev < visibleOptions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
          setActiveIndex(visibleOptions.length - 1);
        } else if (visibleOptions.length > 0) {
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : visibleOptions.length - 1
          );
        }
      } else if (e.key === "Enter") {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          if (activeIndex >= 0 && activeIndex < visibleOptions.length) {
            selectOption(visibleOptions[activeIndex]);
          } else if (visibleOptions.length === 1) {
            selectOption(visibleOptions[0]);
          }
        }
      } else if (e.key === "Escape") {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setQuery(selectedOption ? selectedOption.display : "");
        }
      }
    },
    [disabled, isOpen, visibleOptions, activeIndex, selectOption, selectedOption, updatePosition]
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
        {visibleOptions.length === 0 ? (
          <li
            style={{
              padding: "12px 14px",
              fontSize: 12,
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}
          >
            JO tidak ditemukan
          </li>
        ) : (
          visibleOptions.map((option, idx) => {
            const isSelected = option.joId === value;
            const isActive = idx === activeIndex;

            return (
              <li
                key={option.joId}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  background: isActive
                    ? "var(--color-bg-hover)"
                    : "transparent",
                  color: "var(--color-text)",
                  transition: "background 80ms",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{option.label}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                  {option.subLabel}
                </span>
              </li>
            );
          })
        )}
        {hasMore && (
          <li
            style={{
              padding: "8px 12px",
              fontSize: 11,
              color: "var(--color-text-muted)",
              textAlign: "center",
              fontStyle: "italic",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            Persempit pencarian…
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%" }}
      className="jo-picker-root"
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
            paddingRight: value || query ? 56 : 34,
          }}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
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
          {(value || query) && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear JO"
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
            aria-label="Toggle JO list"
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

      {mounted &&
        typeof document !== "undefined" &&
        dropdownMenu &&
        createPortal(dropdownMenu, document.body)}
    </div>
  );
}
