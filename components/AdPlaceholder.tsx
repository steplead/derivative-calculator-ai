export default function AdPlaceholder({ slot }: { slot: string }) {
    return (
        <div className="w-full h-24 bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center my-4">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                Ad Space ({slot})
            </span>
        </div>
    );
}
