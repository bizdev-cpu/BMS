import { useEffect, useState } from 'react';

import ReportView from '../report/ReportView';
import { gasRun } from '../../api/bmsApi';
export default function PdetailPanel({ pdetail, setPdetail, pField, saveProject, psaving, dday, ddColor, ddText, normalizeStage }) {
            const [rep, setRep] = useState(null);
            const [repState, setRepState] = useState('loading'); // loading | found | none | notfound
            // date input(yyyy-MM-dd만 허용)에 넣기 위해 시:분·요일 등 부가 정보 제거. '.'·'-' 구분자 모두 지원.
            const onlyDate = (s) => {
                const m = String(s || '').match(/(\d{4})[.\-](\d{1,2})[.\-](\d{1,2})/);
                if (!m) return '';
                return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
            };
            useEffect(() => {
                let alive = true;
                setRepState('loading'); setRep(null);
                const bidNoMatch = pdetail._sysTok ? (pdetail._sysTok.match(/NARA:([0-9A-Za-z\-]+)/) || pdetail._sysTok.match(/공고번호\s+([0-9A-Za-z\-:]+)/)) : null;
                const bidNo = bidNoMatch ? bidNoMatch[0].replace(/^공고번호\s+/, '') : '';
                gasRun('apiFindMonitorRow', bidNo, pdetail.name).then(monRow => {
                    if (!alive) return;
                    if (!monRow) { setRepState('notfound'); return; }
                    const r = splitMemo(monRow['메모']).report;
                    if (r) { setRep(r); setRepState('found'); } else { setRepState('none'); }
                }).catch(() => { if (alive) setRepState('notfound'); });
                return () => { alive = false; };
            }, [pdetail.name, pdetail._sysTok]);

            return <>
                <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 shrink-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-brand-600">{normalizeStage(pdetail.stage)}</span>
                            {pdetail.dueDate && <span className={`text-[11px] font-bold ${ddColor(dday(pdetail.dueDate))}`}>{ddText(dday(pdetail.dueDate))}</span>}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">{pdetail.name}</h3>
                        <p className="text-[11px] text-slate-400">{pdetail.client}</p>
                    </div>
                    <button onClick={() => setPdetail(null)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none shrink-0">×</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {/* 보고서 섹션 */}
                    {repState === 'loading' && (
                        <div className="p-4 border-b border-slate-100"><p className="text-xs text-slate-400">보고서 확인 중…</p></div>
                    )}
                    {repState === 'found' && (
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 mb-2">📄 검토 보고서</p>
                            <ReportView r={rep} />
                        </div>
                    )}
                    {repState === 'none' && (
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs text-slate-400">모니터링 건은 찾았지만 보고서가 아직 생성되지 않았습니다.</p>
                        </div>
                    )}
                    {repState === 'notfound' && (
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs text-slate-400">연결된 모니터링 건을 찾지 못했습니다(수동 등록 건이거나 공고번호 불일치).</p>
                        </div>
                    )}
                    {/* 메모 섹션 */}
                    <div className="p-4 border-b border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-500">💬 메모 / 의견 <span className="font-normal text-slate-300">(제안 사업 시트 M열)</span></p>
                        <textarea value={pdetail._memo || ''} onChange={e => pField('_memo', e.target.value)} rows={4}
                            placeholder="검토 의견·논의 내용·특이사항 등 자유 기록"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 leading-relaxed" />
                        {pdetail._sysTok && <p className="text-[11px] text-slate-400">🔒 시스템: <span className="font-mono">{pdetail._sysTok}</span></p>}
                    </div>
                    {/* 사업 정보 수정 섹션 */}
                    <div className="p-4 space-y-3 text-sm">
                        <p className="text-xs font-bold text-slate-500">✏️ 사업 정보 수정</p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block col-span-2"><span className="text-[11px] text-slate-400">사업명</span>
                                <input value={pdetail.name || ''} onChange={e => pField('name', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">발주처</span>
                                <input value={pdetail.client || ''} onChange={e => pField('client', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">단계</span>
                                <select value={normalizeStage(pdetail.stage)} onChange={e => pField('stage', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500">
                                    {['제안 중', '결과 대기', '수주', '실주'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select></label>
                            <label className="block"><span className="text-[11px] text-slate-400">사업비(원)</span>
                                <input type="number" value={pdetail.cost || 0} onChange={e => pField('cost', Number(e.target.value) || 0)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">참여 형태</span>
                                <select value={pdetail.participation || '단독'} onChange={e => pField('participation', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500">
                                    {['단독', '컨소시엄'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select></label>
                            <label className="block"><span className="text-[11px] text-slate-400">지분(%)</span>
                                <input type="number" value={pdetail.shareRatio != null ? pdetail.shareRatio : 100} onChange={e => pField('shareRatio', Number(e.target.value) || 0)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">컨소시엄</span>
                                <input value={pdetail.consortium || ''} onChange={e => pField('consortium', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">제안 담당</span>
                                <input value={pdetail.managers || ''} onChange={e => pField('managers', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">제출마감</span>
                                <input type="date" value={onlyDate(pdetail.dueDate)} onChange={e => pField('dueDate', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">발표일</span>
                                <input type="date" value={onlyDate(pdetail.presentDate)} onChange={e => pField('presentDate', e.target.value)} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                            <label className="block"><span className="text-[11px] text-slate-400">우선순위</span>
                                <select value={String(Number(pdetail.priority) || 2)} onChange={e => pField('priority', Number(e.target.value))} className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500">
                                    <option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option>
                                </select></label>
                        </div>
                        {pdetail.folderUrl && <a href={pdetail.folderUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">📁 폴더 바로가기 ↗</a>}
                    </div>
                </div>
                <div className="shrink-0 pt-4 pb-6 px-4 border-t border-slate-100 flex gap-2">
                    <button onClick={() => setPdetail(null)} className="flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200">취소</button>
                    <button onClick={saveProject} disabled={psaving} className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-xs font-bold disabled:opacity-50">{psaving ? '저장 중…' : '저장'}</button>
                </div>
            </>;
        }