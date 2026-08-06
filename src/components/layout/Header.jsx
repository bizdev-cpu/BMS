export default function Header({
  selectedYear,
  setSelectedYear,
  mode,
}) {
  const currentYear = new Date().getFullYear();

  const selectableYears = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ].filter((year) => year !== 2024 && year !== 2025);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <img
          src="/logo.png"
          alt="AX 사업본부 로고"
          className="h-10 w-10 rounded-lg object-cover"
        />

        <div>
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            AX 사업본부
          </h1>

          <p className="text-xs font-medium text-slate-500">
            사업관리 &amp; 통합 매출 집계
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          {selectableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 ${
                selectedYear === year
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {year}년
            </button>
          ))}
        </div>

        <span
          className={`flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            mode === 'api'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
              : 'border-blue-500/20 bg-blue-500/10 text-blue-600'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              mode === 'api'
                ? 'animate-pulse bg-emerald-400'
                : 'bg-blue-400'
            }`}
          />

          <span>
            {mode === 'api'
              ? '구글 시트 연동 중'
              : 'Mock 데모 모드'}
          </span>
        </span>
      </div>
    </header>
  );
}