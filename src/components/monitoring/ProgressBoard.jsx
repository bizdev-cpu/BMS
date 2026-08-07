import { useEffect, useMemo, useRef, useState } from 'react';
import ReportView from '../report/ReportView';
import { joinMemo, splitMemo, taskLine } from '../../util/monitoring';

import PdetailPanel from '../proposal/PdetailPanel';
import { normalizeStage } from '../../util/stage';
import ProposalCalendar from '../proposal/ProposalCalendar';
import { gasRun } from '../../api/bmsApi';
export default function ProgressBoard({ projects, formatKRW, loadData, setActiveTab, embedded, executeAction }) {
            const hosted = true;
            const [mons, setMons] = useState([]);
            const [busy, setBusy] = useState(false);
            const [msg, setMsg] = useState('');
            const [reviewers, setReviewers] = useState({}); // bidNo -> 최종검토자 입력값
            const [approving, setApproving] = useState('');
            const [detail, setDetail] = useState(null);   // 클릭한 건(요약/메모 팝업)
            const [memo, setMemo] = useState('');
            const [memoBusy, setMemoBusy] = useState(false);
            const [pdetail, setPdetail] = useState(null); // 제안 진행 중 카드 팝업(편집)
            const [psaving, setPsaving] = useState(false);
            // 비고에서 '[모니터링 자동등록] 공고번호 …' 시스템 토큰을 분리(공고번호 매칭에 쓰여 보존 필요)
            const SYS_RE = /\[모니터링 자동등록\][^\n]*/;
            const stripSys = (note) => String(note || '').replace(/\[모니터링 자동등록\][^\n]*\n?/, '').replace(/^\n+/, '').trim();
            const openProject = (p) => {
                const note = String(p.note || '');
                const m = note.match(SYS_RE);
                setPdetail({ ...p, _sysTok: m ? m[0] : '', _memo: stripSys(note) });
            };
            const pField = (k, v) => setPdetail(d => ({ ...d, [k]: v }));
            const saveProject = async () => {
                if (!pdetail) return;
                // 시스템 토큰 + 사용자 메모 재결합 → note 보존
                const note = pdetail._sysTok ? (pdetail._sysTok + (pdetail._memo ? '\n' + pdetail._memo : '')) : (pdetail._memo || '');
                setPsaving(true); setMsg('제안 사업 저장 중…');
                try {
                    await executeAction('updateProject', { ...pdetail, note: note, rowIndex: pdetail.rowIndex });
                    setMsg('제안 사업이 수정되었습니다.');
                    setPdetail(null);
                    if (loadData) await loadData();
                } catch (e) { setMsg('수정 실패: ' + ((e && e.message) || e)); }
                setPsaving(false);
            };
            const openDetail = (m) => { setDetail(m); setMemo(splitMemo(m['메모']).human); };
            const saveMemo = async () => {
                if (!detail) return;
                setMemoBusy(true);
                try {
                    const reportRaw = splitMemo(detail['메모']).reportRaw; // AI 블록 보존
                    const merged = joinMemo(memo, reportRaw);
                    await gasRun('apiUpdateMonitoring', { bidNo: detail['공고번호'], memo: merged });
                    setMons(list => { const next = list.map(x => x['공고번호'] === detail['공고번호'] ? { ...x, '메모': merged } : x); window.__pendingCache = next; return next; });
                    setDetail(d => ({ ...d, '메모': merged }));
                    setMsg('메모가 저장되었습니다.');
                } catch (e) { setMsg('메모 저장 실패: ' + ((e && e.message) || e)); }
                setMemoBusy(false);
            };

            const loadMon = async (force) => {
                if (!hosted) return;

                if (!force && Array.isArray(window.__pendingCache)) {
                    console.log('캐시 사용:', window.__pendingCache);
                    setMons(window.__pendingCache);
                    return;
                }

                setBusy(true);
                setMsg('결정 대기 불러오는 중…');

                try {
                    const list = await gasRun('apiReadPendingDecisions');

                    console.log('apiReadPendingDecisions 응답:', list);

                    const arr = Array.isArray(list) ? list : [];

                    console.log('결정 대기 배열:', arr);

                    window.__pendingCache = arr;
                    setMons(arr);
                    setMsg('');
                } catch (e) {
                    console.error('결정 대기 로드 실패:', e);

                    setMsg(
                    '결정 대기 로드 실패: ' +
                        ((e && e.message) || e),
                    );
                }

                setBusy(false);
                };
            useEffect(() => { loadMon(false); }, []);

            // 마감 D-day 계산
            const dday = (s) => {
                const m = String(s || '').match(/(\d{4})[.\-\s]+(\d{1,2})[.\-\s]+(\d{1,2})/);
                if (!m) return null;
                const due = new Date(+m[1], +m[2] - 1, +m[3]);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                return Math.round((due - today) / 86400000);
            };
            const ddText = (d) => d === null ? '' : d < 0 ? `마감 지남` : d === 0 ? 'D-DAY' : `D-${d}`;
            const ddColor = (d) => d === null ? 'text-slate-400' : d <= 3 ? 'text-rose-600' : d <= 7 ? 'text-amber-600' : 'text-slate-500';

            // ① 결정 대기: 슬림 API가 '1차 검토 완료'만 반환 → 그대로 사용
            const pending = useMemo(() => mons
                .map(m => ({ ...m, _d: dday(m['마감일']) }))
                .sort((a, b) => (a._d === null) - (b._d === null) || (a._d ?? 9999) - (b._d ?? 9999)), [mons]);

            // ② 제안 진행 중: 단계 ∈ {제안 중, 결과 대기}. D-day·우선순위·발표경과 계산 후 우선순위 내림차순(발표 지난 건 최하).
            const inProgress = useMemo(() => (projects || [])
                .filter(p => ['제안 중', '결과 대기'].includes(normalizeStage(p.stage)))
                .map(p => {
                    const dueD = dday(p.dueDate);
                    const prD = dday(p.presentDate);
                    const presentPassed = prD !== null && prD < 0;
                    const eff = presentPassed ? -1 : (Number(p.priority) || 2); // 발표 지나면 우선순위 최하
                    return { ...p, _due: dueD, _present: prD, _presentPassed: presentPassed, _eff: eff };
                })
                .sort((a, b) => b._eff - a._eff || (a._due ?? 9999) - (b._due ?? 9999)), [projects]);

            // 발표일 경과 + 단계='제안 중' → '결과 대기'로 자동 전환(화면 열 때 즉시). 중복 실행 방지 가드.
            const flipBusy = useRef(false);
            useEffect(() => {
                if (flipBusy.current || !executeAction) return;
                const toFlip = (projects || []).filter(p => normalizeStage(p.stage) === '제안 중' && (() => { const d = dday(p.presentDate); return d !== null && d < 0; })());
                if (!toFlip.length) return;
                flipBusy.current = true;
                (async () => {
                    for (const p of toFlip) { try { await executeAction('updateProject', { ...p, stage: '결과 대기', rowIndex: p.rowIndex }); } catch (e) { } }
                    if (loadData) await loadData();
                    flipBusy.current = false;
                })();
            }, [projects]);

            // 우선순위 변경
            const setPriority = async (p, val) => {
                try { await executeAction('updateProject', { ...p, priority: val, rowIndex: p.rowIndex }); if (loadData) await loadData(); }
                catch (e) { setMsg('우선순위 저장 실패: ' + ((e && e.message) || e)); }
            };
            const [progView, setProgView] = useState('list'); // list | calendar

            const [simModal, setSimModal] = useState(null); // {m, rf, candidates}
            const runApprove = async (m, rf, linkRowIndex) => {
                const bidNo = m['공고번호'] || '';
                setSimModal(null); setApproving(bidNo); setMsg('승인 처리 중…');
                try {
                    const payload = { name: m['사업명'], bidNo: bidNo, client: m['발주처'], budget: m['예산'], folderUrl: m['첨부폴더'], reviewerFinal: rf, dueDate: m['마감일'] || '' };
                    if (linkRowIndex) payload.linkRowIndex = linkRowIndex;
                    const r = await gasRun('apiApproveToProposal', payload);
                    setMsg((r && r.message) || '승인 완료');
                    await loadMon(true);
                    if (loadData) await loadData();
                    setDetail(d => (d && (d['공고번호'] || d['사업명']) === bidNo) ? null : d); // 패널 열려있었으면 닫기
                } catch (e) { setMsg('승인 실패: ' + ((e && e.message) || e)); }
                setApproving('');
            };
            const approve = async (m) => {
                const bidNo = m['공고번호'] || '';
                const rf = (reviewers[bidNo] || '').trim();
                if (!rf) { setMsg('최종 검토자를 입력하세요.'); return; }
                setApproving(bidNo); setMsg('유사 진행 건 확인 중…');
                let cands = [];
                try { cands = await gasRun('apiCheckSimilarProposal', m['사업명'], m['발주처']) || []; } catch (e) { /* 조회 실패 시 신규로 */ }
                setApproving('');
                if (cands.length) { setSimModal({ m, rf, candidates: cands }); return; } // 후보 있으면 선택 모달
                if (!confirm(`'${m['사업명']}'\n최종 검토자: ${rf}\n승인하면 제안 진행 중(단독·구름100%)으로 등록됩니다. 진행할까요?`)) return;
                runApprove(m, rf, 0);
            };
            const dropPending = async (m) => {
                const bidNo = m['공고번호'] || '';
                const reason = prompt(`'${m['사업명']}' 드랍 사유를 입력하세요`, '');
                if (reason === null) return; // 취소
                setApproving(bidNo); setMsg('드랍 처리 중…');
                try {
                    await gasRun('apiDropMonitoring', bidNo, reason);
                    setMsg('드랍 처리되었습니다.');
                    await loadMon(true);
                    setDetail(d => (d && (d['공고번호'] || d['사업명']) === bidNo) ? null : d); // 패널 열려있었으면 닫기
                } catch (e) { setMsg('드랍 실패: ' + ((e && e.message) || e)); }
                setApproving('');
            };

            if (!hosted) return <div className="p-8 text-sm text-slate-500">이 화면은 배포(웹앱) 환경에서 동작합니다.</div>;

            return (
                <div className={embedded ? 'space-y-6' : 'space-y-6 animate-fadeIn'}>
                    {!embedded && (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">진행 중 제안</h2>
                                <p className="text-sm text-slate-500">제안 결정 대기 <b className="text-rose-600">{pending.length}</b> · 제안 진행 중 <b className="text-brand-600">{inProgress.length}</b></p>
                            </div>
                            {msg && <span className="text-xs text-slate-500">{msg}</span>}
                        </div>
                    )}
                    {embedded && msg && <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{msg}</div>}

                    {/* ② 제안 진행 중 (결정 대기보다 위) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <p className="text-sm font-bold text-slate-700">🔵 제안 진행 중 <span className="font-normal text-slate-400">(우선순위순 · 발표일 경과 시 결과 대기로 전환)</span></p>
                            <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                                <button onClick={() => setProgView('list')} className={`px-2.5 py-1 text-[11px] font-bold ${progView === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500'}`}>목록</button>
                                <button onClick={() => setProgView('calendar')} className={`px-2.5 py-1 text-[11px] font-bold ${progView === 'calendar' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500'}`}>캘린더</button>
                            </div>
                        </div>
                        {inProgress.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">제안 진행 중인 사업이 없습니다.</p>
                        ) : progView === 'calendar' ? (
                            <ProposalCalendar items={inProgress} formatKRW={formatKRW} onPick={openProject} />
                        ) : (
                            <div className="space-y-2">
                                {inProgress.map((p, i) => (
                                    <div key={i} className="border border-slate-200 rounded-xl p-3 hover:border-brand-300 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openProject(p)} title="상세·수정">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-bold text-brand-600">{normalizeStage(p.stage)}</span>
                                                    {p.dueDate
                                                        ? <span className={`text-[11px] font-bold ${ddColor(p._due)}`}>{ddText(p._due)}</span>
                                                        : <span className="text-[11px] font-bold text-slate-400">본 공고 대기 중</span>}
                                                    <span className="font-bold text-slate-800 truncate">{p.name}</span>
                                                    {stripSys(p.note) && <span className="text-[10px] text-brand-500">📝</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {p.client || '-'} · {formatKRW(Number(p.cost) || 0)} · 담당 {p.managers || '-'}
                                                    {p.dueDate ? ` · 제출 ${p.dueDate}` : ''}{p.presentDate ? ` · 발표 ${p.presentDate}` : ''}
                                                </div>
                                            </div>
                                            <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                                {p._presentPassed
                                                    ? <span className="text-[10px] text-slate-400 font-bold">발표 종료</span>
                                                    : <select value={String(Number(p.priority) || 2)} onChange={e => setPriority(p, Number(e.target.value))}
                                                        className="text-[11px] font-bold rounded-md border border-slate-200 px-1.5 py-1 bg-white text-slate-600 focus:outline-none cursor-pointer">
                                                        <option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option>
                                                    </select>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ① 제안 결정 대기 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <p className="text-sm font-bold text-slate-700">🟠 제안 결정 대기 <span className="font-normal text-slate-400">(조건 검토 완료 → 최종 승인 시 제안 등록)</span></p>
                            <button onClick={() => loadMon(true)} disabled={busy} className="text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50 disabled:opacity-50 shrink-0">{busy ? '불러오는 중…' : '↻ 새로고침'}</button>
                        </div>
                        {pending.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">결정 대기 중인 건이 없습니다.</p>
                        ) : (
                            <div className="space-y-2">
                                {pending.map((m, i) => {
                                    const bidNo = m['공고번호'] || ('row' + i);
                                    return (
                                        <div key={bidNo} className="border border-slate-200 rounded-xl p-3 hover:border-brand-300 transition-colors">
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDetail(m)} title="요약·메모 보기">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[11px] font-bold ${m['판정'] === '적합' ? 'text-emerald-600' : 'text-amber-600'}`}>{m['판정']}</span>
                                                        <span className={`text-[11px] font-bold ${ddColor(m._d)}`}>{ddText(m._d)}</span>
                                                        <span className="font-bold text-slate-800 truncate">{m['사업명']}</span>
                                                        {m['메모'] && <span className="text-[10px] text-brand-500">📝</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{m['발주처']} · 예산 {formatKRW(Number(String(m['예산'] || '').replace(/[^\d.-]/g, '')) || 0)} · 조건 검토 {m['1차검토자'] || '-'}</div>
                                                    {taskLine(m) ? <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">📌 {taskLine(m)}</div>
                                                        : (m['요약'] && <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{String(m['요약']).slice(0, 200)}{String(m['요약']).length > 200 ? '…' : ''}</div>)}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <input
                                                        type="text" placeholder="최종 검토자"
                                                        value={reviewers[bidNo] || ''}
                                                        onChange={(e) => setReviewers(s => ({ ...s, [bidNo]: e.target.value }))}
                                                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500"
                                                    />
                                                    <button onClick={() => approve(m)} disabled={approving === bidNo}
                                                        className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 whitespace-nowrap">
                                                        {approving === bidNo ? '처리중…' : '승인 → 제안'}
                                                    </button>
                                                    <button onClick={() => dropPending(m)} disabled={approving === bidNo}
                                                        className="bg-slate-50 border border-slate-200 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 whitespace-nowrap hover:bg-rose-50">
                                                        드랍
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 요약 + 메모 팝업 */}
                    {/* 제안 결정 대기 — 사이드 패널(보고서 + 메모 + 최종검토/승인/드랍) */}
                    <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${detail ? 'translate-x-0' : 'translate-x-full'}`}>
                        {detail && (() => {
                            const bidNo = detail['공고번호'] || detail['사업명'];
                            return <>
                                <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 shrink-0">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[11px] font-bold ${detail['판정'] === '적합' ? 'text-emerald-600' : 'text-amber-600'}`}>{detail['판정']}</span>
                                            <span className={`text-[11px] font-bold ${ddColor(detail._d)}`}>{ddText(detail._d)}</span>
                                        </div>
                                        <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">{detail['사업명']}</h3>
                                        <p className="text-[11px] text-slate-400">{detail['발주처']} · 예산 {formatKRW(Number(String(detail['예산'] || '').replace(/[^\d.-]/g, '')) || 0)} · 마감 {detail['마감일'] || '-'}</p>
                                    </div>
                                    <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none shrink-0">×</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* 한줄 요약 — 보고서 유무와 무관하게 항상 맨 위에 표시 */}
                                    <div className="bg-brand-50/60 border border-brand-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-brand-600 mb-1">📌 한줄 요약</p>
                                        <p className="text-sm text-slate-800 leading-relaxed">{taskLine(detail) || detail['요약'] || '(요약 없음)'}</p>
                                    </div>
                                    <div>
                                        {splitMemo(detail['메모']).report
                                            ? <><p className="text-xs font-bold text-slate-500 mb-1">📄 검토 보고서</p><ReportView r={splitMemo(detail['메모']).report} /></>
                                            : (!taskLine(detail) && !detail['요약'] && <p className="text-xs text-slate-400">보고서 없음 — 자격 미달이거나 본문 미확보</p>)}
                                        <div className="flex gap-3 mt-2">
                                            {detail['공고URL'] && <a href={detail['공고URL']} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">공고 원문 열기 ↗</a>}
                                            {detail['첨부폴더'] && <a href={detail['첨부폴더']} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">📁 폴더 바로가기 ↗</a>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-slate-500">💬 메모 <span className="font-normal text-slate-400">(검토 의견·논의 내용 등 자유 기록)</span></p>
                                            <button onClick={saveMemo} disabled={memoBusy} className="bg-brand-600 text-white px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-50">{memoBusy ? '저장 중…' : '메모 저장'}</button>
                                        </div>
                                        <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={6}
                                            placeholder="이 제안에 대한 메모를 남기세요. (저장 시 모니터링 시트의 메모 칸에 기록됩니다)"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-brand-500 leading-relaxed" />
                                    </div>
                                    {/* 최종 검토자 + 제안 등록/드랍 */}
                                    <div className="border-t border-slate-100 pt-4">
                                        <p className="text-xs font-bold text-slate-500 mb-2">✅ 결정</p>
                                        <label className="block mb-2"><span className="text-[11px] text-slate-400">최종 검토자</span>
                                            <input type="text" placeholder="이름 입력"
                                                value={reviewers[bidNo] || ''}
                                                onChange={(e) => setReviewers(s => ({ ...s, [bidNo]: e.target.value }))}
                                                className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" /></label>
                                        <div className="flex gap-2 mb-6">
                                            <button onClick={() => approve(detail)} disabled={approving === bidNo}
                                                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-xs font-bold disabled:opacity-50">
                                                {approving === bidNo ? '처리중…' : '승인 → 제안 등록'}
                                            </button>
                                            <button onClick={() => dropPending(detail)} disabled={approving === bidNo}
                                                className="flex-1 bg-slate-50 border border-slate-200 text-rose-600 py-2 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-rose-50">
                                                드랍
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>;
                        })()}
                    </div>
                    {detail && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetail(null)} />}
                    {/* 유사 진행 건 발견 → 연결/신규 선택 */}
                    {simModal && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSimModal(null)}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="p-5 border-b border-slate-100">
                                    <h3 className="text-base font-extrabold text-slate-900">유사한 ‘제안 중’ 사업이 있습니다</h3>
                                    <p className="text-xs text-slate-500 mt-1">사전규격 등으로 이미 등록된 건일 수 있어요. 기존 건에 <b>본공고를 연결</b>하면 진행 중 사업이 중복되지 않습니다.</p>
                                </div>
                                <div className="p-5 space-y-2">
                                    <p className="text-xs font-bold text-slate-500">승인 대상: <span className="text-slate-800">{simModal.m['사업명']}</span></p>
                                    {simModal.candidates.map((c, i) => (
                                        <div key={i} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-amber-600">유사도 {c.sim}%{c.sameClient ? ' · 발주처 동일' : ''}</span></div>
                                                <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                                                <p className="text-[11px] text-slate-500">{c.client}</p>
                                            </div>
                                            <button onClick={() => runApprove(simModal.m, simModal.rf, c.rowIndex)} disabled={approving}
                                                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0">이 건에 연결</button>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                                        <button onClick={() => setSimModal(null)} className="text-xs text-slate-500 font-bold px-3 py-1.5">취소</button>
                                        <button onClick={() => runApprove(simModal.m, simModal.rf, 0)} disabled={approving}
                                            className="bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold">새 제안으로 등록</button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 pt-1">연결 시: 기존 건 비고에 본공고번호 추가 · 사업비 본공고로 갱신 · 기존 검토자 유지. 본공고 모니터링 건은 ‘작업 진행’으로 기록됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 제안 진행 중 — 사이드 패널(보고서 + 메모 + 사업 수정) */}
                    <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${pdetail ? 'translate-x-0' : 'translate-x-full'}`}>
                        {pdetail && <PdetailPanel pdetail={pdetail} setPdetail={setPdetail} pField={pField} saveProject={saveProject} psaving={psaving}
                            dday={dday} ddColor={ddColor} ddText={ddText} normalizeStage={normalizeStage} />}
                    </div>
                    {pdetail && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setPdetail(null)} />}
                </div>
            );
        }