'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

interface BgmTrack {
  id: number
  title: string
  artist: string | null
  url: string
  originalName: string
  filename: string
  duration: number | null
  isActive: boolean
  sortOrder: number
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function BgmSettings() {
  const { success, error: showError } = useToast()
  const [tracks, setTracks] = useState<BgmTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/bgm?all=true')
      if (res.ok) {
        const data = await res.json()
        setTracks(data)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      showError('파일을 선택해주세요')
      return
    }
    if (!title.trim()) {
      showError('제목을 입력해주세요')
      return
    }

    setIsUploading(true)
    try {
      // Step 1: Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'bgm')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        showError(uploadData.error || '파일 업로드에 실패했습니다')
        return
      }

      const { url } = await uploadRes.json()

      // Step 2: Create track record
      const trackRes = await fetch('/api/bgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim() || undefined,
          url,
          originalName: file.name,
          filename: url.split('/').pop(),
          fileSize: file.size,
        }),
      })

      if (!trackRes.ok) {
        const trackData = await trackRes.json()
        showError(trackData.error || 'BGM 등록에 실패했습니다')
        return
      }

      success('BGM이 등록되었습니다')
      setTitle('')
      setArtist('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchTracks()
    } catch {
      showError('BGM 등록 중 오류가 발생했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/bgm/${id}`, { method: 'DELETE' })
      if (res.ok) {
        success('BGM이 삭제되었습니다')
        await fetchTracks()
      } else {
        showError('BGM 삭제에 실패했습니다')
      }
    } catch {
      showError('BGM 삭제 중 오류가 발생했습니다')
    }
  }

  const handleToggleActive = async (track: BgmTrack) => {
    try {
      const res = await fetch(`/api/bgm/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !track.isActive }),
      })
      if (res.ok) {
        await fetchTracks()
      } else {
        showError('상태 변경에 실패했습니다')
      }
    } catch {
      showError('상태 변경 중 오류가 발생했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">BGM 관리</h3>

      {/* 트랙 목록 */}
      {tracks.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Icon name="music_off" size="xl" className="mb-2" />
          <p>등록된 BGM이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                track.isActive
                  ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                  : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon name="music_note" size="sm" className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {track.artist || '알 수 없는 아티스트'} · {formatDuration(track.duration)} · {track.originalName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(track)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    track.isActive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-label={track.isActive ? '비활성화' : '활성화'}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      track.isActive ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDelete(track.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="삭제"
                >
                  <Icon name="delete" size="sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 폼 */}
      <form onSubmit={handleUpload} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
          <Icon name="upload" size="sm" />
          BGM 추가
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="곡 제목"
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="아티스트 (선택)"
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
          <Button type="submit" size="sm" disabled={isUploading || !file || !title.trim()}>
            {isUploading ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </form>
    </div>
  )
}
