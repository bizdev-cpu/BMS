export default function MonitoringDashboard({
  dashStats,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-500">총 모니터링</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{dashStats.total}<span className="text-sm font-bold text-slate-400">건</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-500">제안 진행</div>
              <div className="text-3xl font-black text-brand-600 mt-1">{dashStats.proposed}<span className="text-sm font-bold text-slate-400">건</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-500">제안 전환율</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{dashStats.rate}<span className="text-sm font-bold text-slate-400">%</span></div>
          </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-700">일자별 모니터링 / 제안 진행</p>
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-slate-300 mr-1.5"></span>모니터링</span>
                  <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-brand-600 mr-1.5"></span>제안 진행</span>
              </div>
          </div>
          {dashStats.rows.length === 0 ? (
              <p className="text-sm text-slate-400 font-semibold py-6 text-center">데이터가 없습니다.</p>
          ) : (
              <div className="space-y-3">
                  {dashStats.rows.map(r => (
                      <div key={r.date} className="flex items-center gap-3">
                          <div className="w-24 shrink-0 text-xs font-bold text-slate-600">{r.date}</div>
                          <div className="flex-grow">
                              <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden">
                                  <div className="absolute inset-y-0 left-0 bg-slate-300" style={{ width: `${(r.total / dashStats.maxTotal) * 100}%` }}></div>
                                  <div className="absolute inset-y-0 left-0 bg-brand-600 rounded-r-sm" style={{ width: `${(r.proposed / dashStats.maxTotal) * 100}%` }}></div>
                              </div>
                          </div>
                          <div className="w-28 shrink-0 text-right text-xs font-bold text-slate-700">
                              {r.total}건 <span className="text-brand-600">/ 제안 {r.proposed}</span>
                          </div>
                      </div>
                  ))}
              </div>
          )}
          <p className="text-[11px] text-slate-400 mt-4">* '제안 진행'은 해당 건을 '제안 등록'(전체 사업에 제안 중으로 등록)한 건수입니다. 수집일 기준 집계.</p>
      </div>
  </div>
  )
}