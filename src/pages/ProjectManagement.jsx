import {useState, useMemo} from 'react';
import Icon from '../components/common/Icon';
import SortTh from '../components/SortTh';

import { formatDate } from '../util/format';
import { applySort, useSortable } from '../util/sort';
import {normalizeStage} from '../util/stage';
import { parsePeriodRange, extractYear } from '../util/date';

function ProjectManagement({ projects, executeAction, formatKRW, selectedYear }) {
            const [filterStage, setFilterStage] = useState('All');
            const [searchTerm, setSearchTerm] = useState('');
            const [isFormOpen, setIsFormOpen] = useState(false);
            const [isRepairOpen, setIsRepairOpen] = useState(false);
            const [isCommentOpen, setIsCommentOpen] = useState(false);
            
            // 현재 타겟 프로젝트 상태 객체
            const [currentProject, setCurrentProject] = useState(null);
            
            // CRUD 폼 상태
            const [formName, setFormName] = useState('');
            const [formProposalPeriod, setFormProposalPeriod] = useState('');
            const [formType, setFormType] = useState('B2G');
            const [formCost, setFormCost] = useState('');
            const [formClient, setFormClient] = useState('');
            const [formStage, setFormStage] = useState('검토 중');
            const [formParticipation, setFormParticipation] = useState('단독');
            const [formConsortium, setFormConsortium] = useState('');
            const [formShareRatio, setFormShareRatio] = useState('100');
            const [formPeriodText, setFormPeriodText] = useState('');
            const [formTarget, setFormTarget] = useState('');
            const [formNote, setFormNote] = useState('');
            const [formFolderUrl, setFormFolderUrl] = useState('');
            const [formManagers, setFormManagers] = useState('');
            
            // 날짜 수정 팝업 폼 상태
            const [repairStart, setRepairStart] = useState('');
            const [repairEnd, setRepairEnd] = useState('');

            // 코멘트 관련
            const [newCommentAuthor, setNewCommentAuthor] = useState('');
            const [newCommentText, setNewCommentText] = useState('');

            // 정렬 상태 (기본: 제안시기 내림차순)
            const sort = useSortable('proposalPeriod', 'desc');
            const projectSortTypes = {
                proposalPeriod: 'string', type: 'string', name: 'string',
                cost: 'number', shareRatio: 'number', sharePct: 'number', computedSales: 'number',
                normalizedStage: 'string', durationMonths: 'number'
            };

            // 프로젝트 리스트 파싱 및 필터링 적용
            const parsedProjects = useMemo(() => {
                return projects.map(p => {
                    const periodParse = parsePeriodRange(p.periodText);
                    const isDateIncomplete = !periodParse.isValid;
                    // 매출 = D열(sales, 이미 지분율 반영). D가 비었을 때만 (지분율%/100)*사업비로 폴백
                    const computedSales = Number(p.sales) || Math.round(((Number(p.shareRatio) || 0) / 100) * (Number(p.cost) || 0));
                    // 자사 지분율은 J열 대신 매출÷사업비로 역산 (J열 값이 불규칙해 신뢰 불가, 매출 열과 항상 일치)
                    const costNum = Number(p.cost) || 0;
                    const sharePct = costNum > 0 ? Math.round((computedSales / costNum) * 100) : null;

                    return {
                        ...p,
                        isDateIncomplete,
                        computedSales,
                        sharePct,
                        periodParse,
                        normalizedStage: normalizeStage(p.stage), // 정렬/표시용
                        durationMonths: periodParse.durationMonths // 정렬용
                    };
                });
            }, [projects]);

            // 필터링 및 검색 처리
            const filteredProjects = useMemo(() => {
                return parsedProjects.filter(p => {
                    // 연도 필터: 제안 과정 트래킹용이므로 '제안시기(proposalPeriod)' 연도만 기준
                    // (월별 매출 계산은 용역제공기간 기준으로 별도 처리됨)
                    if (extractYear(p.proposalPeriod) !== selectedYear) return false;

                    // 단계 필터
                    const normalizedStage = normalizeStage(p.stage);
                    if (filterStage !== 'All' && normalizedStage !== filterStage) return false;
                    
                    // 검색어 필터
                    if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        return (
                            p.name.toLowerCase().includes(term) ||
                            p.client.toLowerCase().includes(term) ||
                            (p.note && p.note.toLowerCase().includes(term))
                        );
                    }
                    return true;
                });
            }, [parsedProjects, filterStage, searchTerm, selectedYear]);

            // 정렬 적용
            const sortedProjects = useMemo(
                () => applySort(filteredProjects, sort.sortKey, sort.sortDir, projectSortTypes),
                [filteredProjects, sort.sortKey, sort.sortDir]
            );

            // 폼 오픈 핸들러 (추가)
            const openAddForm = () => {
                setCurrentProject(null);
                setFormName('');
                setFormProposalPeriod(formatDate(new Date()).substring(0, 7));
                setFormType('B2G');
                setFormCost('');
                setFormClient('');
                setFormStage('검토 중');
                setFormParticipation('단독');
                setFormConsortium('');
                setFormShareRatio('100');
                setFormPeriodText('');
                setFormTarget('');
                setFormNote('');
                setFormFolderUrl('');
                setFormManagers('');
                setIsFormOpen(true);
            };

            // 폼 오픈 핸들러 (수정)
            const openEditForm = (p) => {
                setCurrentProject(p);
                setFormName(p.name);
                setFormProposalPeriod(p.proposalPeriod || '');
                setFormType(p.type || 'B2G');
                setFormCost(String(p.cost || ''));
                setFormClient(p.client || '');
                setFormStage(p.stage || '검토 중');
                setFormParticipation(p.participation || '단독');
                setFormConsortium(p.consortium || '');
                setFormShareRatio(String(p.shareRatio || 100)); // 퍼센트 그대로
                setFormPeriodText(p.periodText || '');
                setFormTarget(p.target || '');
                setFormNote(p.note || '');
                setFormFolderUrl(p.folderUrl || p['자료폴더'] || p['폴더링크'] || '');
                setFormManagers(p.managers || p['진행담당자'] || '');
                setIsFormOpen(true);
            };

            // 폼 서브밋 처리 (추가 또는 수정 완료)
            const handleFormSubmit = (e) => {
                e.preventDefault();
                if (!formName.trim()) return;

                const ratioPct = Number(formShareRatio) || 100;        // 퍼센트 (100 = 100%)
                const costVal = Number(formCost) || 0;
                const computedSales = Math.round((ratioPct / 100) * costVal);

                const payload = {
                    proposalPeriod: formProposalPeriod,
                    type: formType,
                    name: formName,
                    cost: costVal,
                    sales: computedSales, // 매출액 = (지분율% / 100) * 사업비
                    client: formClient,
                    stage: formStage,
                    participation: formParticipation,
                    consortium: formConsortium,
                    shareRatio: ratioPct, // 퍼센트 저장
                    periodText: formPeriodText,
                    target: formTarget,
                    note: formNote,
                    folderUrl: formFolderUrl,
                    managers: formManagers
                };

                if (currentProject) {
                    executeAction('updateProject', { ...payload, rowIndex: currentProject.rowIndex });
                } else {
                    executeAction('addProject', payload);
                }
                setIsFormOpen(false);
            };

            // 삭제 처리
            const handleDelete = (name, index) => {
                if (confirm(`'${name}' 사업을 삭제하시겠습니까?\n삭제된 내용은 '삭제 내역' 시트에 기록됩니다.`)) {
                    executeAction('deleteProject', { name, rowIndex: index });
                }
            };

            // 인라인 단계 변경 (전체 필드 보존 + 새 단계만 교체 → updateProject)
            const changeStage = (p, newStage) => {
                if (normalizeStage(p.stage) === normalizeStage(newStage)) return;
                executeAction('updateProject', {
                    proposalPeriod: p.proposalPeriod || '',
                    type: p.type || 'B2G',
                    name: p.name,
                    cost: Number(p.cost) || 0,
                    sales: Number(p.sales) || 0,           // 기존 매출 그대로 보존
                    client: p.client || '',
                    stage: newStage,
                    participation: p.participation || '단독',
                    consortium: p.consortium || '',
                    shareRatio: p.shareRatio !== undefined && p.shareRatio !== null ? p.shareRatio : 100,
                    periodText: p.periodText || '',
                    target: p.target || '',
                    note: p.note || '',
                    folderUrl: p.folderUrl || p['자료폴더'] || '',
                    managers: p.managers || p['진행담당자'] || '',
                    rowIndex: p.rowIndex
                });
            };

            // 불완전한 기간 수정 모달 오픈
            const openRepairModal = (p) => {
                setCurrentProject(p);
                setRepairStart('');
                setRepairEnd('');
                // 기존 기입 텍스트에서 혹시 날짜가 추출되는지 체크
                if (p.periodParse && p.periodParse.start) {
                    setRepairStart(formatDate(p.periodParse.start));
                }
                if (p.periodParse && p.periodParse.end) {
                    setRepairEnd(formatDate(p.periodParse.end));
                }
                setIsRepairOpen(true);
            };

            // 불완전한 날짜 포맷 강제 보정 저장
            const saveRepairedDates = () => {
                if (!repairStart || !repairEnd) {
                    alert('시작일과 종료일을 모두 올바르게 입력해 주세요.');
                    return;
                }
                if (new Date(repairStart) > new Date(repairEnd)) {
                    alert('시작일은 종료일보다 이전 날짜여야 합니다.');
                    return;
                }

                // 텍스트 형태로 yyyy-mm-dd ~ yyyy-mm-dd 로 덮어씌움
                const repairedText = `${repairStart} ~ ${repairEnd}`;
                const payload = {
                    ...currentProject,
                    periodText: repairedText,
                    sales: currentProject.sales // 기존 계산식/매출 유지
                };

                executeAction('updateProject', payload);
                setIsRepairOpen(false);
            };

            // 코멘트 모달 오픈
            const openCommentModal = (p) => {
                setCurrentProject(p);
                setNewCommentAuthor('');
                setNewCommentText('');
                setIsCommentOpen(true);
            };

            // 코멘트 저장 기능
            // - 기존 텍스트 형태의 코멘트란에 줄바꿈으로 추가 이력 누적
            const handleAddComment = () => {
                if (!newCommentText.trim()) return;
                
                const author = newCommentAuthor.trim() || '익명';
                const dateStr = formatDate(new Date());
                const newCommentLine = `${dateStr} [${author}]: ${newCommentText.trim()}`;
                
                const existingComments = currentProject.comments ? String(currentProject.comments).trim() : '';
                const updatedComments = existingComments 
                    ? `${existingComments}\n${newCommentLine}` 
                    : newCommentLine;

                const payload = {
                    ...currentProject,
                    comments: updatedComments
                };

                executeAction('updateProject', payload);
                
                // 모달 갱신용 타겟 상태 반영
                setCurrentProject(prev => ({ ...prev, comments: updatedComments }));
                setNewCommentText('');
            };

            return (
                <div className="space-y-6 animate-fadeIn">
                    
                    {/* 타이틀 및 추가 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">제안 사업</h2>
                            <p className="text-sm text-slate-500">제안 사업의 제안 시기별 현황 및 매출 분석</p>
                        </div>
                        <button
                            onClick={openAddForm}
                            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all duration-200"
                        >
                            <Icon name="plus" className="w-5 h-5" />
                            <span>새 사업 등록</span>
                        </button>
                    </div>

                    {/* 필터 바 */}
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-200 backdrop-blur-md">
                        {/* 단계 필터 단추들 */}
                        <div className="flex flex-wrap gap-2">
                            {['All', '검토 중', '제안 중', '결과 대기 중', '수주', '실주', '중단'].map(stage => (
                                <button
                                    key={stage}
                                    onClick={() => setFilterStage(stage)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${filterStage === stage ? 'bg-brand-600 text-white border-brand-500 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'}`}
                                >
                                    {stage === 'All' ? '전체' : stage}
                                </button>
                            ))}
                        </div>
                        {/* 검색창 */}
                        <div className="w-full md:w-80">
                            <input
                                type="text"
                                placeholder="사업명, 발주처 등 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 text-sm border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                            />
                        </div>
                    </div>

                    {/* 테이블 컨테이너 */}
                    <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <SortTh label="제안시기" colKey="proposalPeriod" sort={sort} className="p-4 w-20" />
                                        <SortTh label="유형" colKey="type" sort={sort} className="p-4 w-16" />
                                        <SortTh label="사업명 (발주처)" colKey="name" sort={sort} className="p-4" />
                                        <SortTh label="사업비" colKey="cost" sort={sort} className="p-4 text-right" align="right" />
                                        <SortTh label="자사 지분" colKey="sharePct" sort={sort} className="p-4 text-right" align="right" />
                                        <SortTh label="매출액(지분)" colKey="computedSales" sort={sort} className="p-4 text-right" align="right" />
                                        <SortTh label="단계" colKey="normalizedStage" sort={sort} className="p-4" />
                                        <SortTh label="용역제공기간 (월)" colKey="durationMonths" sort={sort} className="p-4" />
                                        <th className="p-4 w-24">자료폴더</th>
                                        <th className="p-4 w-28">제안 담당자</th>
                                        <th className="p-4 text-center w-36">액션</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sortedProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="p-8 text-center text-slate-400 font-semibold">조건에 맞는 사업이 없습니다.</td>
                                        </tr>
                                    ) : (
                                        sortedProjects.map((p, idx) => {
                                            const normalizedStage = normalizeStage(p.stage);
                                            const badgeColors = {
                                                "수주": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                                "제안 중": "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                                "결과 대기 중": "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                                "검토 중": "bg-violet-500/10 text-violet-600 border-violet-500/20",
                                                "중단": "bg-slate-100 text-slate-500 border-slate-200",
                                                "실주": "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                            };

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-semibold text-slate-500">{p.proposalPeriod}</td>
                                                    <td className="p-4">
                                                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-600">{p.type}</span>
                                                    </td>
                                                    <td className="p-4 max-w-xs">
                                                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{p.client}</div>
                                                    </td>
                                                    <td className="p-4 text-right font-medium text-slate-600">{formatKRW(p.cost)}</td>
                                                    <td className="p-4 text-right font-semibold text-blue-700">{p.sharePct === null ? '—' : `${p.sharePct}%`}</td>
                                                    <td className="p-4 text-right font-black text-slate-900">{formatKRW(p.computedSales)}</td>
                                                    <td className="p-4">
                                                        <select
                                                            value={normalizedStage}
                                                            onChange={(e) => changeStage(p, e.target.value)}
                                                            className={`text-[10px] font-bold rounded-full border px-2 py-1 cursor-pointer focus:outline-none ${badgeColors[normalizedStage] || 'bg-slate-100 text-slate-500'}`}
                                                        >
                                                            {['검토 중', '제안 중', '결과 대기 중', '수주', '실주', '중단'].map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        {p.isDateIncomplete ? (
                                                            <div className="flex items-center space-x-1.5">
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse-slow">불완전한 기간</span>
                                                                <button
                                                                    onClick={() => openRepairModal(p)}
                                                                    className="text-amber-600 hover:text-amber-600 underline font-bold text-[10px]"
                                                                >
                                                                    수정
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-600">
                                                                <div className="text-[10px] text-slate-500">{p.periodText}</div>
                                                                <div className="text-[10px] font-bold text-blue-600 mt-0.5">{p.periodParse.durationMonths}개월</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {(() => {
                                                            const url = p.folderUrl || p['자료폴더'] || p['폴더링크'] || '';
                                                            return url
                                                                ? <a href={url} target="_blank" className="text-[11px] font-bold text-brand-600 hover:underline whitespace-nowrap">📁 폴더 열기</a>
                                                                : <span className="text-[11px] text-slate-300 font-semibold whitespace-nowrap">링크 미등록</span>;
                                                        })()}
                                                    </td>
                                                    <td className="p-4">
                                                        {(() => {
                                                            const names = String(p.managers || p['진행담당자'] || '').split(',').map(s => s.trim()).filter(Boolean);
                                                            return names.length
                                                                ? <div className="flex flex-wrap gap-1">{names.map((n, j) => <span key={j} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-semibold">{n}</span>)}</div>
                                                                : <span className="text-[11px] text-slate-300 font-semibold">미지정</span>;
                                                        })()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <button
                                                                onClick={() => openCommentModal(p)}
                                                                className="p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                                                                title="코멘트 및 히스토리"
                                                            >
                                                                <Icon name="comment" className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditForm(p)}
                                                                className="p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-violet-600 transition-colors"
                                                                title="수정"
                                                            >
                                                                <Icon name="edit" className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p.name, p.rowIndex)}
                                                                className="p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                                                                title="삭제"
                                                            >
                                                                <Icon name="delete" className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CRUD 다이얼로그 모달 */}
                    {isFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">{currentProject ? '사업 정보 수정' : '새 사업 추가'}</h3>
                                    <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-slate-900">
                                        <Icon name="close" className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">사업명 (필수)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="예: 2026년 OO 스마트 교육 사업"
                                                value={formName}
                                                onChange={(e) => setFormName(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">발주처 / 매출처</label>
                                            <input
                                                type="text"
                                                placeholder="예: 한국정보화진흥원"
                                                value={formClient}
                                                onChange={(e) => setFormClient(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">제안 시기</label>
                                            <input
                                                type="text"
                                                placeholder="예: 2026-04"
                                                value={formProposalPeriod}
                                                onChange={(e) => setFormProposalPeriod(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">사업 유형</label>
                                            <select
                                                value={formType}
                                                onChange={(e) => setFormType(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            >
                                                <option value="B2G">B2G (공공)</option>
                                                <option value="B2B">B2B (기업)</option>
                                                <option value="B2C">B2C (개인)</option>
                                                <option value="글로벌">글로벌</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">총 사업비(원)</label>
                                            <input
                                                type="number"
                                                placeholder="예: 100000000"
                                                value={formCost}
                                                onChange={(e) => setFormCost(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">자사 지분율(%)</label>
                                            <input
                                                type="number"
                                                placeholder="예: 100"
                                                value={formShareRatio}
                                                onChange={(e) => setFormShareRatio(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">단계</label>
                                            <select
                                                value={formStage}
                                                onChange={(e) => setFormStage(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            >
                                                <option value="검토 중">검토 중</option>
                                                <option value="제안 중">제안 중</option>
                                                <option value="결과 대기 중">결과 대기 중</option>
                                                <option value="수주">수주 (매출집계 대상)</option>
                                                <option value="실주">실주</option>
                                                <option value="중단">중단</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">참여 형태</label>
                                            <select
                                                value={formParticipation}
                                                onChange={(e) => setFormParticipation(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            >
                                                <option value="단독">단독</option>
                                                <option value="참여(컨소시엄)">참여(컨소시엄)</option>
                                                <option value="주관(컨소시엄)">주관(컨소시엄)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">구성사 정보</label>
                                            <input
                                                type="text"
                                                placeholder="예: 구름, 에이럭스"
                                                value={formConsortium}
                                                onChange={(e) => setFormConsortium(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">용역 제공 기간</label>
                                            <input
                                                type="text"
                                                placeholder="예: 2026-03-01 ~ 2026-08-31"
                                                value={formPeriodText}
                                                onChange={(e) => setFormPeriodText(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">서비스 대상</label>
                                            <input
                                                type="text"
                                                placeholder="예: 일반성인 / K-12"
                                                value={formTarget}
                                                onChange={(e) => setFormTarget(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">자료 폴더 링크</label>
                                            <input
                                                type="text"
                                                placeholder="구글 드라이브 폴더 URL (비우면 '링크 미등록')"
                                                value={formFolderUrl}
                                                onChange={(e) => setFormFolderUrl(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">제안 담당자 <span className="font-normal text-slate-400">(여러 명은 쉼표로)</span></label>
                                            <input
                                                type="text"
                                                placeholder="예: 김OO, 이OO"
                                                value={formManagers}
                                                onChange={(e) => setFormManagers(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:text-slate-900"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-bold text-white"
                                        >
                                            저장 완료
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 날짜 보정/수정 팝업 모달 */}
                    {isRepairOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">불완전한 용역 기간 데이터 정제</h3>
                                    <button onClick={() => setIsRepairOpen(false)} className="text-slate-500 hover:text-slate-900">
                                        <Icon name="close" className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-xs leading-relaxed">
                                        <span className="font-bold">기존 용역 제공 기간 텍스트:</span>
                                        <p className="font-mono mt-1 text-slate-900 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                                            {currentProject?.periodText || '(비어있음)'}
                                        </p>
                                        <p className="mt-2">계약체결일~ 등으로 적힌 불분명한 텍스트 데이터의 시작/종료일을 날짜 형식으로 보정하여 정확한 월 매출 분할 집계를 반영할 수 있게 합니다.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] text-slate-500 font-bold mb-1">용역 시작일</label>
                                            <input
                                                type="date"
                                                value={repairStart}
                                                onChange={(e) => setRepairStart(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-slate-500 font-bold mb-1">용역 종료일</label>
                                            <input
                                                type="date"
                                                value={repairEnd}
                                                onChange={(e) => setRepairEnd(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsRepairOpen(false)}
                                            className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-500 hover:text-slate-900"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveRepairedDates}
                                            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold text-white"
                                        >
                                            기간 보정 저장
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 코멘트 사이드 판넬 또는 간이 모달 서랍 */}
                    {isCommentOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
                            <div className="bg-white border-l border-slate-200 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-slideLeft">
                                <div>
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">히스토리 및 코멘트 관리</h3>
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[280px]">{currentProject?.name}</p>
                                        </div>
                                        <button onClick={() => setIsCommentOpen(false)} className="text-slate-500 hover:text-slate-900">
                                            <Icon name="close" className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    {/* 코멘트 목록 표시 */}
                                    <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                                        <label className="block text-xs text-slate-500 font-bold mb-2">등록된 이력 목록</label>
                                        {currentProject?.comments ? (
                                            <div className="space-y-3">
                                                {String(currentProject.comments).split('\n').filter(c => c.trim()).map((line, idx) => {
                                                    // 날짜 / 담당자 / 내용 파싱을 시도
                                                    const match = line.match(/^(\d{4}-\d{2}-\d{2})\s+\[(.*?)\]:\s*(.*)$/);
                                                    if (match) {
                                                        return (
                                                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
                                                                    <span className="text-violet-600 font-bold">[{match[2]}]</span>
                                                                    <span>{match[1]}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-700 leading-normal">{match[3]}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                                                            {line}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-400 text-xs font-semibold">등록된 코멘트나 이력이 없습니다.</div>
                                        )}
                                    </div>
                                </div>

                                {/* 새 코멘트 달기 폼 (맨 아래 고정) */}
                                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500">새 코멘트 등록</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="작성자(이름)"
                                            value={newCommentAuthor}
                                            onChange={(e) => setNewCommentAuthor(e.target.value)}
                                            className="col-span-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="내용을 입력하세요..."
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddComment}
                                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs"
                                    >
                                        코멘트 추가 저장
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            );
        }

export default ProjectManagement;