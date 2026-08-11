import { useEffect, useState } from 'react';
import { splitKdtMonthly } from '../util/date';
import { readKdtChangeReport, createKdtSnapshot } from '../api/bmsApi';

export default function KdtManagement({ kdtMonthly, formatKRW }) {
            const k = splitKdtMonthly(kdtMonthly);
            const rows = k.rows;
            const cats = k.categories || [];
            const curM = k.curM;
            const actualTotal = k.actualTotal;
            const expectedTotal = k.expectedTotal;
            const grandTotal = k.grandTotal;
            const maxAmt = rows.reduce((m, r) => Math.max(m, r.amount), 1);
            const hasData = grandTotal > 0;
            const KDT_COLORS = { '딥다이브': '#d97706', '카테부': '#f59e0b', '케클업': '#fbbf24' };
            const hatch = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 3px, transparent 3px, transparent 7px)';

            // 예상값 변동 추적 리포트
            const [kdtReport, setKdtReport] = useState(null);
            const [snapBusy, setSnapBusy] = useState(false);
            const [snapMsg, setSnapMsg] = useState('');

            const loadReport = async () => {
            try {
                const report = await readKdtChangeReport();
                setKdtReport(report);
            } catch (error) {
                console.error(
                'KDT 변동 리포트 조회 실패:',
                error,
                );

                setKdtReport({
                months: [],
                snapshotYms: [],
                });
            }
            };

            useEffect(() => {
            loadReport();
            }, []);

            const takeSnapshot = async () => {
            setSnapBusy(true);
            setSnapMsg('스냅샷 저장 중…');

            try {
                const result = await createKdtSnapshot();

                setSnapMsg(
                typeof result === 'string'
                    ? result
                    : '스냅샷 저장 완료',
                );

                await loadReport();
            } catch (error) {
                console.error(
                'KDT 스냅샷 저장 실패:',
                error,
                );

                setSnapMsg(
                `실패: ${
                    error instanceof Error
                    ? error.message
                    : '알 수 없는 오류'
                }`,
                );
            } finally {
                setSnapBusy(false);
            }
            };
            const realized = (kdtReport && kdtReport.months || []).filter(m => m && m.realizedDiff !== null && m.realizedDiff !== undefined && m.lastExpected && m.firstActual);
            const expChanges = (kdtReport && kdtReport.months || []).map(m => {
                const exp = ((m && m.series) || []).filter(s => s && s.kind === '예상' && typeof s.amt === 'number');
                return { month: m.month, exp };
            }).filter(m => m.exp.length >= 2); // 예상 스냅샷이 2회 이상이어야 변동 표시

            return (
                <div className="space-y-6 animate-fadeIn">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">부트캠프 관리</h2>
                        <p className="text-sm text-slate-500">딥다이브 · 카테부 · 케클업 분류별 월 매출 · 현재 월까지는 발생, 이후는 예상</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="text-xs font-bold text-slate-500">발생 매출 (현재까지)</div>
                            <div className="text-2xl font-black text-amber-600 mt-1">{formatKRW(actualTotal)}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="text-xs font-bold text-slate-500">예상 매출 (향후 월)</div>
                            <div className="text-2xl font-black text-slate-500 mt-1">{formatKRW(expectedTotal)}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="text-xs font-bold text-slate-500">연간 합계</div>
                            <div className="text-2xl font-black text-slate-900 mt-1">{formatKRW(grandTotal)}</div>
                        </div>
                    </div>

                    {/* 분류별 요약 */}
                    {cats.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {cats.map(c => (
                                <div key={c.name} className="bg-white border border-slate-200 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: KDT_COLORS[c.name] || '#f59e0b' }}></span>
                                        <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900">{formatKRW(c.grandTotal)}</div>
                                    <div className="text-[11px] text-slate-500 mt-1">발생 {formatKRW(c.actualTotal)} · 예상 {formatKRW(c.expectedTotal)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <p className="text-sm font-bold text-slate-700">월별 부트캠프 매출 (분류별)</p>
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 flex-wrap">
                                {cats.map(c => (
                                    <span key={c.name} className="flex items-center"><span className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: KDT_COLORS[c.name] || '#f59e0b' }}></span>{c.name}</span>
                                ))}
                                <span className="flex items-center text-slate-400"><span className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: '#fbbf24', backgroundImage: hatch }}></span>빗금=예상</span>
                            </div>
                        </div>
                        {!hasData ? (
                            <p className="text-sm text-slate-400 font-semibold py-8 text-center">부트캠프 시트에서 분류별 월 매출을 읽지 못했습니다. 시트의 분류 라벨(딥다이브/카테부/케클업)과 월 범위를 확인하세요.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {rows.map((r, i) => {
                                    const expected = i > curM;
                                    return (
                                        <div key={r.month} className="flex items-center gap-3 group relative">
                                            <div className="w-10 shrink-0 text-xs font-bold text-slate-600">{r.month}월</div>
                                            <div className="flex-grow relative">
                                                <div className="h-6 bg-slate-100 rounded-md overflow-hidden flex">
                                                    {cats.map(c => {
                                                        const amt = (c.monthly || [])[i] || 0; if (amt <= 0) return null;
                                                        const style = { width: `${(amt / maxAmt) * 100}%`, backgroundColor: KDT_COLORS[c.name] || '#f59e0b' };
                                                        if (expected) style.backgroundImage = hatch;
                                                        return <div key={c.name} className="h-full" style={style}></div>;
                                                    })}
                                                </div>
                                                {/* 호버 툴팁: 분류별 금액 범례 */}
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white border border-slate-200 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 text-left min-w-[200px]">
                                                    <div className="text-[11px] font-bold text-slate-500 mb-1">{r.month}월 {expected ? '(예상)' : '(발생)'}</div>
                                                    <div className="text-[10px] space-y-1">
                                                        {cats.map(c => {
                                                            const amt = (c.monthly || [])[i] || 0;
                                                            return (
                                                                <div key={c.name} className="flex justify-between gap-3">
                                                                    <span className="flex items-center font-semibold" style={{ color: KDT_COLORS[c.name] || '#d97706' }}>
                                                                        <span className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: KDT_COLORS[c.name] || '#f59e0b' }}></span>{c.name}
                                                                        {r.amount > 0 ? <span className="ml-1 text-slate-400">({((amt / r.amount) * 100).toFixed(2)}%)</span> : null}
                                                                    </span>
                                                                    <span className="text-slate-700">{formatKRW(amt)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900"><span>합계</span><span>{formatKRW(r.amount)}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-44 shrink-0 text-right text-xs font-bold text-slate-700">
                                                {formatKRW(r.amount)} <span className={`ml-1 text-[10px] font-semibold ${expected ? 'text-slate-400' : 'text-amber-600'}`}>{expected ? '예상' : '발생'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-[11px] text-slate-400 mt-4">* 데이터는 KDT 시트에서 직접 수정합니다(이 화면은 조회 전용). 합계는 소수점 이하 버림.</p>
                    </div>

                    {/* 예상값 변동 추적 리포트 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                            <p className="text-sm font-bold text-slate-700">예상값 변동 추적 <span className="font-normal text-slate-400">(월 1회 스냅샷 기준)</span></p>
                            <div className="flex items-center gap-2">
                                {snapMsg && <span className="text-[11px] text-slate-500">{snapMsg}</span>}
                                <button onClick={takeSnapshot} disabled={snapBusy} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50">{snapBusy ? '저장 중…' : '📸 지금 스냅샷'}</button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">스냅샷: {(kdtReport && kdtReport.snapshotYms || []).join(' · ') || '아직 없음 — 먼저 스냅샷을 한 번 찍어주세요'}</p>

                        {(!kdtReport || !(kdtReport.snapshotYms || []).length) ? (
                            <p className="text-sm text-slate-400 font-semibold py-6 text-center">스냅샷이 없습니다. ‘지금 스냅샷’을 누르면 현재 KDT 값이 기록되고, 다음 달부터 변동을 비교합니다. (매월 1일 자동 저장을 켜려면 <code>setupKdtSnapshotTrigger</code> 1회 실행)</p>
                        ) : (
                            <div className="space-y-6">
                                {/* 예상 → 발생 차액 */}
                                <div>
                                    <p className="text-xs font-bold text-slate-600 mb-2">예상 → 발생 차액 <span className="font-normal text-slate-400">(마지막 예상 대비 실제 발생)</span></p>
                                    {realized.length === 0 ? (
                                        <p className="text-[12px] text-slate-400">아직 예상→발생으로 전환된 달이 없습니다.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead><tr className="text-slate-400 border-b border-slate-100">
                                                    <th className="text-left p-2">대상월</th><th className="text-right p-2">마지막 예상</th><th className="text-right p-2">발생</th><th className="text-right p-2">차액</th>
                                                </tr></thead>
                                                <tbody>
                                                    {realized.map(m => (
                                                        <tr key={m.month} className="border-b border-slate-50">
                                                            <td className="p-2 font-semibold text-slate-700">{m.month}월</td>
                                                            <td className="p-2 text-right text-slate-500">{formatKRW(m.lastExpected.amt)}</td>
                                                            <td className="p-2 text-right font-semibold text-slate-800">{formatKRW(m.firstActual.amt)}</td>
                                                            <td className={`p-2 text-right font-bold ${m.realizedDiff < 0 ? 'text-rose-600' : m.realizedDiff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{m.realizedDiff > 0 ? '+' : ''}{formatKRW(m.realizedDiff)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* 예상값 추이(스냅샷 간 변동) */}
                                <div>
                                    <p className="text-xs font-bold text-slate-600 mb-2">예상값 추이 <span className="font-normal text-slate-400">(스냅샷마다 예상이 어떻게 바뀌었는지 · 빨강=감소)</span></p>
                                    {expChanges.length === 0 ? (
                                        <p className="text-[12px] text-slate-400">예상 스냅샷이 2회 이상 쌓이면 변동이 표시됩니다.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {expChanges.map(m => (
                                                <div key={m.month} className="flex items-center gap-2 flex-wrap text-[12px]">
                                                    <span className="w-10 shrink-0 font-bold text-slate-700">{m.month}월</span>
                                                    {m.exp.map((s, idx) => {
                                                        const prev = idx > 0 ? m.exp[idx - 1].amt : null;
                                                        const delta = prev !== null ? s.amt - prev : null;
                                                        return (
                                                            <span key={s.ym} className="flex items-center gap-1">
                                                                {idx > 0 && <span className="text-slate-300">→</span>}
                                                                <span className="text-slate-400">{s.ym}</span>
                                                                <span className="font-semibold text-slate-700">{formatKRW(s.amt)}</span>
                                                                {delta !== null && delta !== 0 && (
                                                                    <span className={`font-bold ${delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>({delta > 0 ? '+' : ''}{formatKRW(delta)})</span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
