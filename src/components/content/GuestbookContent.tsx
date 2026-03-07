'use client'

import { GuestbookList } from '@/components/guestbook/GuestbookList'

export function GuestbookContent() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span className="text-primary">방명록</span>
        <span className="text-slate-400 dark:text-slate-500">Guestbook</span>
      </h2>

      <GuestbookList />
    </div>
  )
}
