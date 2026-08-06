export default function Footer({
  buildInfo,
  APP_VERSION,
  APP_UPDATED,
}) {
  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur px-8 py-3.5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
      <span className="flex items-center gap-2">
        <span className="font-semibold text-slate-500">
          BMS · AX 사업본부
        </span>

        <span className="text-slate-300">·</span>

        <span>
          v{(buildInfo && buildInfo.version) || APP_VERSION}
        </span>

        <span className="text-slate-300">·</span>

        <span>
          업데이트 {(buildInfo && buildInfo.updated) || APP_UPDATED}
        </span>
      </span>

      <span className="flex items-center gap-1.5">
        <span className="text-slate-400">made by</span>

        <span className="font-extrabold tracking-wide bg-gradient-to-r from-brand-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
          김부용
        </span>
      </span>
    </footer>
  );
}