"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const items = [
    { label: "Past Devotionals", href: "/history" },
    { label: "Journal Entries", href: null, disabled: true },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <div ref={menuRef} className="fixed top-7 right-8 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--surface-border)]
          hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
          transition-all duration-150 cursor-pointer
          flex items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-52 py-1.5 rounded-xl
          bg-[#2a2a2c] border border-[rgba(255,255,255,0.08)]
          shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.href) {
                  router.push(item.href);
                  setOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors
                ${item.disabled
                  ? "text-[var(--text-faint)] cursor-default"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
                }`}
            >
              {item.label}
              {item.disabled && (
                <span className="ml-2 text-[10px] text-[var(--text-faint)] tracking-wide uppercase">Soon</span>
              )}
            </button>
          ))}
          <div className="mx-3 my-1.5 border-t border-[rgba(255,255,255,0.06)]" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--text-tertiary)]
              hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
