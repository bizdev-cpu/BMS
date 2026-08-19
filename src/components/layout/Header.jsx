import Logo from '../../assets/goormLogo.jpg';
import { useState } from 'react';

export default function Header({
  selectedYear,
  setSelectedYear,
  mode,
  dataSources,
  selectedSourceId,
  setSelectedSourceId,
  onMenuOpen,
}) {
  const currentYear = new Date().getFullYear();

  const selectableYears = Array.from(
    { length: 5 },
    (_, index) => currentYear - index,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md max-[479px]:px-3 md:px-5 md:py-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* 로고 / 제목 */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 md:hidden"
            aria-label="메뉴 열기"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          <img
            src={Logo}
            alt="AX 사업본부 로고"
            className="h-10 w-10 shrink-0 rounded-lg object-cover max-[479px]:h-8 max-[479px]:w-8"
          />

          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-xl font-bold tracking-tight text-transparent max-[479px]:text-base">
              AX 사업본부
            </h1>

            <p className="text-xs font-medium text-slate-500 max-[479px]:text-[10px]">
              사업관리 &amp; 통합 매출 집계
            </p>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:flex-nowrap">
          {/* 연도 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1 max-[479px]:w-[92px]">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full rounded-md bg-transparent px-3 py-1 text-sm font-medium text-slate-500 outline-none max-[479px]:px-2 max-[479px]:text-xs"
            >
              {selectableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>

          {/* 부서 */}
          <div className="min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-slate-50 p-1 max-[479px]:min-w-0 md:flex-none">
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full rounded-md bg-transparent px-3 py-1 text-sm font-medium text-slate-500 outline-none max-[479px]:px-2 max-[479px]:text-xs"
            >
              <option value="all">전체 부서 통합</option>

              {dataSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* 연결 상태 */}
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold max-[479px]:w-full max-[479px]:justify-center max-[479px]:text-[10px] ${
              mode === 'api'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                : 'border-blue-500/20 bg-blue-500/10 text-blue-600'
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                mode === 'api'
                  ? 'animate-pulse bg-emerald-400'
                  : 'bg-blue-400'
              }`}
            />

            <span className="whitespace-nowrap">
              {mode === 'api'
                ? '구글 시트 연동 중'
                : 'Mock 데모 모드'}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}