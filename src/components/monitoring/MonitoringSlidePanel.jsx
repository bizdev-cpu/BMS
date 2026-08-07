import ReportView from "../report/ReportView";

export default function MonitoringSlidePanel({
  slideItem,
  setSlideItem,

  splitMemo,
  taskLine,
  verdictLabel,

  regenBusy,
  regenMsg,
  regenReport,
  setRegenMsg,

  copiedNo,
  setCopiedNo,
  copyCard,
  reportToSlack,
}) {
    return (
        <>

         {/* 오른쪽 슬라이드 패널 — 요약/보고서 열람(수집 목록) */}
                            <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${slideItem ? 'translate-x-0' : 'translate-x-full'}`}>
                                {slideItem && (() => {
                                    const rep = splitMemo(slideItem['메모']).report;
                                    return <>
                                        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${slideItem['판정'] === '적합' ? 'bg-emerald-100 text-emerald-700' : slideItem['판정'] === '제외' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{verdictLabel(slideItem['판정'])}</span>
                                                    <span className="text-[11px] text-slate-400">{slideItem['발주처']}</span>
                                                </div>
                                                <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-snug">{slideItem['사업명']}</h3>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {splitMemo(slideItem['메모']).report
                                                    ? <button onClick={async () => { const txt = reportToSlack(slideItem, splitMemo(slideItem['메모']).report); await navigator.clipboard.writeText(txt); setCopiedNo(slideItem['공고번호']); setTimeout(() => setCopiedNo(''), 2000); }} className={`px-2 py-1 rounded text-[10px] font-bold ${copiedNo === slideItem['공고번호'] ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'}`} title="슬랙 공유용 보고서 복사">
                                                        {copiedNo === slideItem['공고번호'] ? '✓ 복사됨' : '📋 보고서 복사'}
                                                    </button>
                                                    : <button onClick={() => copyCard(slideItem)} className={`px-2 py-1 rounded text-[10px] font-bold ${copiedNo === slideItem['공고번호'] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`} title="슬랙 카드 형식으로 복사">
                                                        {copiedNo === slideItem['공고번호'] ? '✓ 복사됨' : '📋 복사'}
                                                    </button>}
                                                <button onClick={() => { setSlideItem(null); setRegenMsg(''); }} className="text-slate-400 hover:text-slate-700 text-2xl leading-none px-1">×</button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                            {/* 한줄 요약 — 보고서 유무와 무관하게 항상 맨 위에 표시 */}
                                            <div className="bg-brand-50/60 border border-brand-100 rounded-lg p-3">
                                                <p className="text-[10px] font-bold text-brand-600 mb-1">📌 한줄 요약</p>
                                                <p className="text-sm text-slate-800 leading-relaxed">{taskLine(slideItem) || slideItem['요약'] || '(요약 없음)'}</p>
                                            </div>
                                            {rep ? <ReportView r={rep} /> : (
                                                <div className="space-y-3">
                                                    {(slideItem['PDF첨부'] || slideItem['원본첨부'] || slideItem['첨부폴더']) ? (
                                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                            <p className="text-[12px] text-amber-700 font-bold mb-2">📄 상세 검토 보고서가 없습니다</p>
                                                            <p className="text-[11px] text-amber-600 mb-2">첨부 파일(제안요청서·과업지시서 우선)에서 텍스트를 추출해 보고서를 생성합니다(30초~1분 소요).</p>
                                                            <button onClick={regenReport} disabled={regenBusy} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">
                                                                {regenBusy ? '생성 중…' : '🔄 보고서 생성'}
                                                            </button>
                                                            {regenMsg && <p className="text-[11px] mt-2 text-amber-700">{regenMsg}</p>}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                            <p className="text-[12px] text-slate-500">첨부 파일이 없어 보고서를 생성할 수 없습니다.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex gap-3 flex-wrap pt-1 pb-6">
                                                {slideItem['공고URL'] && <a href={slideItem['공고URL']} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">공고 원문 ↗</a>}
                                                {slideItem['첨부폴더'] && <a href={slideItem['첨부폴더']} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">📁 폴더 바로가기 ↗</a>}
                                                {slideItem['PDF첨부'] && <a href={slideItem['PDF첨부']} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">PDF ↗</a>}
                                            </div>
                                        </div>
                                    </>;
                                })()}
                            </div>
                            {slideItem && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => { setSlideItem(null); setRegenMsg(''); }} />}
        </>
    )
}