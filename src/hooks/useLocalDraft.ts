'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DraftData {
  title?: string
  content?: string
  description?: string
  image?: string | string[] | null
  githubUrl?: string
  notionUrl?: string
  featured?: boolean
  tags?: string[]
}

/** 새 글 모드 슬롯 (최대 3개) */
export interface DraftSlot {
  index: number
  data: DraftData | null
  savedAt: string | null
}

/** 수정 모드 슬롯 (포트폴리오당 1개) */
export interface EditDraft {
  portfolioId: number
  data: DraftData
  savedAt: string
}

export interface StoredDrafts {
  new: Array<{ data: DraftData; savedAt: string } | null>  // length = 3
  edits: Record<string, { data: DraftData; savedAt: string }>  // key = portfolioId
}

export const MAX_NEW_SLOTS = 3
const DRAFT_KEY = 'portfolio_drafts'

// ────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────────────────────────────────────

function emptyStorage(): StoredDrafts {
  return {
    new: Array(MAX_NEW_SLOTS).fill(null),
    edits: {},
  }
}

function readStorage(): StoredDrafts {
  if (typeof window === 'undefined') return emptyStorage()
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return emptyStorage()
    const parsed = JSON.parse(raw)

    // Legacy format: array of SavedDraft ({ id, data, savedAt, portfolioId? })
    if (Array.isArray(parsed)) {
      return migrateLegacy(parsed)
    }

    // New format
    if (parsed && typeof parsed === 'object' && 'new' in parsed && 'edits' in parsed) {
      const storage = parsed as StoredDrafts
      // Ensure new array is length 3
      const newSlots = Array.isArray(storage.new) ? storage.new : []
      while (newSlots.length < MAX_NEW_SLOTS) newSlots.push(null)
      return {
        new: newSlots.slice(0, MAX_NEW_SLOTS),
        edits: storage.edits ?? {},
      }
    }

    // Unknown format — discard
    return emptyStorage()
  } catch {
    return emptyStorage()
  }
}

function writeStorage(data: StoredDrafts) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // Storage full or disabled — silently ignore
  }
}

interface LegacyDraft {
  id: string
  data: DraftData
  savedAt: string
  portfolioId?: number
}

function migrateLegacy(legacy: unknown[]): StoredDrafts {
  const storage = emptyStorage()
  for (const item of legacy) {
    if (!item || typeof item !== 'object') continue
    const draft = item as LegacyDraft
    if (!draft.data || !draft.savedAt) continue

    if (typeof draft.portfolioId === 'number') {
      storage.edits[String(draft.portfolioId)] = {
        data: draft.data,
        savedAt: draft.savedAt,
      }
    } else {
      // 새 글 드래프트는 slot 0으로 마이그레이션
      if (storage.new[0] === null) {
        storage.new[0] = { data: draft.data, savedAt: draft.savedAt }
      }
    }
  }
  return storage
}

// ────────────────────────────────────────────────────────────────────────────
// Global listeners (for cross-hook sync within same document)
// ────────────────────────────────────────────────────────────────────────────

type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// useDraftSlots — 새 글 작성용 3개 슬롯
// ────────────────────────────────────────────────────────────────────────────

export function useDraftSlots() {
  const [storage, setStorage] = useState<StoredDrafts>(() => readStorage())

  useEffect(() => {
    const refresh = () => setStorage(readStorage())
    return subscribe(refresh)
  }, [])

  const slots: DraftSlot[] = storage.new.map((entry, index) => ({
    index,
    data: entry?.data ?? null,
    savedAt: entry?.savedAt ?? null,
  }))

  const hasAnyDraft = slots.some((s) => s.data !== null)

  const saveToSlot = useCallback((index: number, data: DraftData) => {
    if (index < 0 || index >= MAX_NEW_SLOTS) return
    const current = readStorage()
    current.new[index] = { data, savedAt: new Date().toISOString() }
    writeStorage(current)
    setStorage(current)
    notify()
  }, [])

  const deleteSlot = useCallback((index: number) => {
    if (index < 0 || index >= MAX_NEW_SLOTS) return
    const current = readStorage()
    current.new[index] = null
    writeStorage(current)
    setStorage(current)
    notify()
  }, [])

  const findEmptySlotIndex = useCallback((): number => {
    for (let i = 0; i < MAX_NEW_SLOTS; i++) {
      if (storage.new[i] === null) return i
    }
    return -1
  }, [storage])

  return {
    slots,
    hasAnyDraft,
    saveToSlot,
    deleteSlot,
    findEmptySlotIndex,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// useEditDraft — 수정 모드 단일 슬롯 (portfolioId별)
// ────────────────────────────────────────────────────────────────────────────

export function useEditDraft(portfolioId: number | undefined) {
  const [storage, setStorage] = useState<StoredDrafts>(() => readStorage())

  useEffect(() => {
    const refresh = () => setStorage(readStorage())
    return subscribe(refresh)
  }, [])

  const key = portfolioId !== undefined ? String(portfolioId) : ''
  const entry = key ? storage.edits[key] : undefined
  const draft: EditDraft | null =
    entry && portfolioId !== undefined
      ? { portfolioId, data: entry.data, savedAt: entry.savedAt }
      : null

  const save = useCallback(
    (data: DraftData) => {
      if (portfolioId === undefined) return
      const current = readStorage()
      current.edits[String(portfolioId)] = {
        data,
        savedAt: new Date().toISOString(),
      }
      writeStorage(current)
      setStorage(current)
      notify()
    },
    [portfolioId]
  )

  const clear = useCallback(() => {
    if (portfolioId === undefined) return
    const current = readStorage()
    delete current.edits[String(portfolioId)]
    writeStorage(current)
    setStorage(current)
    notify()
  }, [portfolioId])

  return {
    draft,
    hasDraft: draft !== null,
    save,
    clear,
  }
}
