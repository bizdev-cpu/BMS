export default function MonitoringAddModal({
    showAdd,
    setShowAdd,
    form,
    setForm,
    submitManual,
    busy,
}) {
    if (!showAdd) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowAdd(false); setForm({}); }}>
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">수기로 찾은 사업 추가</h3>
                                    <button onClick={() => { setShowAdd(false); setForm({}); }} className="text-slate-500 hover:text-slate-900"><Icon name="close" className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[['name', '사업명 *'], ['client', '발주처'], ['demand', '수요기관'], ['closeDt', '마감일 (예: 2026-07-01)'], ['budget', '예산'], ['url', '공고 URL'], ['source', '출처 (기본: 수기)']].map(([k, ph]) => (
                                            <input key={k} placeholder={ph} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                        ))}
                                    </div>
                                    <textarea rows="2" placeholder="요약 / 메모" value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                    <div className="flex items-center gap-2 pt-1">
                                        <select value={form.verdict || '애매'} onChange={(e) => setForm({ ...form, verdict: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">
                                            <option value="애매">애매</option>
                                            <option value="적합">적합</option>
                                        </select>
                                        <button onClick={submitManual} disabled={busy} className="ml-auto bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm">저장</button>
                                        <button onClick={() => { setShowAdd(false); setForm({}); }} className="bg-slate-100 text-slate-500 font-bold px-4 py-2 rounded-lg text-sm">취소</button>
                                    </div>
                                </div>
                            </div>
                        </div>
    );
}