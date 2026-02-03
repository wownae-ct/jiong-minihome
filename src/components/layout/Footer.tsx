import { Icon } from '@/components/ui/Icon';

export function Footer() {
  return (
    <footer className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 md:px-6 py-3 rounded-full border border-slate-200/50 dark:border-slate-700/50">
      {/* BGM 플레이어 */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Icon name="music_note" size="sm" />
          <span className="hidden sm:inline">BGM: Lucid Fall - 바람, 어디에서 부는지 (03:42)</span>
          <span className="sm:hidden">BGM: Lucid Fall</span>
        </span>
        <div className="flex gap-1">
          <button className="hover:text-primary transition-colors" aria-label="재생">
            <Icon name="play_arrow" size="sm" />
          </button>
          <button className="hover:text-primary transition-colors" aria-label="일시정지">
            <Icon name="pause" size="sm" />
          </button>
        </div>
      </div>

      {/* 저작권 */}
      <div className="text-center md:text-right">
        © 2023 Jiyong&apos;s Mini-homepage. All Rights Reserved.
      </div>
    </footer>
  );
}
