"use client";

import Link from "next/link";
import { useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { markNotificationsRead } from "./notificationActions";

export interface AdminNotice {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
}

export function AdminBell({ notices: initial }: { notices: AdminNotice[] }) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState(initial);
  const unread = notices.filter((notice) => !notice.readAt);

  async function mark(ids: string[]) {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    setNotices((current) => current.map((notice) => (ids.includes(notice.id) && !notice.readAt ? { ...notice, readAt: now } : notice)));
    await markNotificationsRead(ids);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread.length > 0 ? `${unread.length} ongelezen meldingen` : "Meldingen"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111827] shadow-sm"
      >
        <IoNotificationsOutline className="h-5 w-5" aria-hidden />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ed1c24] px-1 text-[11px] font-bold text-white">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="text-sm font-extrabold text-[#111827]">Meldingen</p>
            {unread.length > 0 && (
              <button type="button" onClick={() => mark(unread.map((notice) => notice.id))} className="text-xs font-semibold text-[#58595b]">
                Alles gelezen
              </button>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#58595b]">Nog geen meldingen.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notices.map((notice) => {
                const className = `block px-4 py-3 text-left hover:bg-[#f9f9f9] ${notice.readAt ? "" : "bg-[#fff5f5]"}`;
                const content = (
                  <>
                    <p className="text-sm font-semibold text-[#111827]">{notice.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-[#58595b]">{notice.body}</p>
                    <p className="mt-1 text-xs text-[#58595b]">{new Date(notice.createdAt).toLocaleString("nl-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </>
                );
                return (
                  <li key={notice.id} className="border-b border-black/5 last:border-b-0">
                    {notice.href ? (
                      <Link href={notice.href} className={className} onClick={() => { setOpen(false); void mark([notice.id]); }}>
                        {content}
                      </Link>
                    ) : (
                      <button type="button" className={`${className} w-full`} onClick={() => { setOpen(false); void mark([notice.id]); }}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
