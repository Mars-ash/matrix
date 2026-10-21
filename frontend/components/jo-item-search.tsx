"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import type { Category } from "@/lib/types";

interface SearchResult {
  categoryId: string;
  categoryLabel: string;
  itemId: string;
  itemNo: string;
  itemDescription: string;
}

interface JoItemSearchProps {
  categories: Category[];
  onSelect: (categoryId: string, itemId: string) => void;
}

export function JoItemSearch({ categories, onSelect }: JoItemSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const matches: SearchResult[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        const haystack = [
          item.no,
          item.description,
          item.dimension,
          item.material,
          cat.label,
        ]
          .join(" ")
          .toLowerCase();
        if (haystack.includes(q)) {
          matches.push({
            categoryId: cat.id,
            categoryLabel: cat.label,
            itemId: item.id,
            itemNo: item.no,
            itemDescription: item.description,
          });
        }
      }
    }
    return matches.slice(0, 20); // Limit visible results
  }, [query, categories]);

  const showResults = focused && query.trim().length > 0;

  return (
    <div ref={wrapperRef} className="jo-search-container" style={{ position: "relative", width: "100%", maxWidth: 320, zIndex: 40 }}>
      <input
        className="input"
        type="search"
        placeholder="Search items in this JO..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        style={{ fontSize: 12 }}
      />
      {showResults && (
        <div className="jo-search-results">
          {results.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-text-muted)" }}>
              No matching items
            </div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.categoryId}-${r.itemId}`}
                className="jo-search-result-item"
                onClick={() => {
                  onSelect(r.categoryId, r.itemId);
                  setQuery("");
                  setFocused(false);
                }}
              >
                <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>
                  {r.categoryLabel}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {r.itemNo !== "-" ? `${r.itemNo} — ` : ""}{r.itemDescription}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
