'use client'

import { useBgm } from '@/components/providers/BgmContext'
import { Icon } from '@/components/ui/Icon'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function BgmPlayer() {
  const {
    isPlaying, currentTrack, volume, currentTime, duration,
    toggle, next, previous, setVolume, playlist, isLoading,
  } = useBgm()

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Icon name="music_note" size="sm" />
          <span className="text-slate-400">BGM 로딩...</span>
        </span>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Icon name="music_note" size="sm" />
          <span>BGM 없음</span>
        </span>
      </div>
    )
  }

  const trackDisplay = currentTrack
    ? `${currentTrack.artist ? `${currentTrack.artist} - ` : ''}${currentTrack.title}`
    : 'BGM'

  const timeDisplay = currentTrack && duration > 0
    ? ` (${formatTime(currentTime)} / ${formatTime(duration)})`
    : ''

  return (
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1">
        <Icon name="music_note" size="sm" />
        <span className="hidden sm:inline">BGM: {trackDisplay}{timeDisplay}</span>
        <span className="sm:hidden">BGM: {currentTrack?.title || 'BGM'}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={previous}
          className="hover:text-primary transition-colors cursor-pointer"
          aria-label="이전 곡"
        >
          <Icon name="skip_previous" size="sm" />
        </button>
        <button
          onClick={toggle}
          className="hover:text-primary transition-colors cursor-pointer"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} size="sm" />
        </button>
        <button
          onClick={next}
          className="hover:text-primary transition-colors cursor-pointer"
          aria-label="다음 곡"
        >
          <Icon name="skip_next" size="sm" />
        </button>
        <button
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          className="hover:text-primary transition-colors cursor-pointer"
          aria-label={volume === 0 ? '음소거 해제' : '음소거'}
        >
          <Icon name={volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'} size="sm" />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 accent-primary"
          aria-label="볼륨"
        />
      </div>
    </div>
  )
}
