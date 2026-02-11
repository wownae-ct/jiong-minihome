import { BgmPlayer } from "./BgmPlayer";

export function Footer() {
    return (
        <footer className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 md:px-6 py-3 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <BgmPlayer />

            {/* 저작권 */}

            <div className="text-center md:text-right">
                © 2026 Jiong's Mini-homepage. All Rights Reserved. <br />
                Music licensed under the Pixabay License.
            </div>
        </footer>
    );
}

/*
            <div className="text-center md:text-right">
                &copy; 2026 Jiong&apos;s Mini-homepage. All Rights Reserved.
            </div> 
*/
