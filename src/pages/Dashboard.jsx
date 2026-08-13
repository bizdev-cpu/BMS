import { useMemo, useState } from 'react';
import Icon from '../components/common/Icon';
import { extractYear, getMonthlyAllocation, isDateInRange, parseDateString, parsePeriodRange, splitKdtMonthly } from '../util/date';
import { formatKRWShort, niceStep } from '../util/format';
import { normalizeStage } from '../util/stage';
import { calculateKdtSalesSummary, calculateProjectSalesSummary, calculateRentalSalesSummary } from '../lib/sales';

export default function Dashboard({ 
    projects = [], 
    rentals = [], 
    kdt = [], 
    kdtMonthly = {
        total: Array(12).fill(0), categories: [],
    }, monitoring = [], 
    targets = [], 
    selectedYear = [], formatKRW, kdtSales = [], }) {
            
            // 2026년 이전 데이터 소실 경고 여부
            const showWarning = selectedYear < 2026;

            // 대시보드 소스별 보기 토글 상태 (all / project / rental / kdt)
            const [viewFilter, setViewFilter] = useState('all');
            // 달성도에 예상매출(향후 월) 포함 여부
            const [includeExpected, setIncludeExpected] = useState(true);

            // 1. 매출 계산
            // - 제안 사업: G열(단계)이 '수주' 상태인 것만 매출 집계
            // - 매출 = D열(sales) 우선, 없으면 (지분율% / 100) * 사업비
            const processedProjects = useMemo(() => {
                return projects.map(p => {
                    const parsedPeriod = parsePeriodRange(p.periodText);
                    const calculatedSales = Number(p.sales) || Math.round(((Number(p.shareRatio) || 0) / 100) * (p.cost || 0));
                    
                    return {
                        ...p,
                        calculatedSales,
                        parsedPeriod,    // 파싱된 기간 정보 ({start, end, isValid, durationMonths})
                    };
                });
            }, [projects]);

            // 확정 매출 관련 계산
            const projectSalesSummary = useMemo(
                () => calculateProjectSalesSummary(processedProjects),
                [processedProjects],
            )

            const rentalSalesSummary = useMemo(
                () => calculateRentalSalesSummary(rentals),
                [rentals],
            )

            const kdtSalesSummary = useMemo(
                () => calculateKdtSalesSummary(kdtSales, selectedYear),
                [kdtSales, selectedYear]
            )

            const confirmedSalesTotal = projectSalesSummary.actual + rentalSalesSummary.actual + kdtSalesSummary.actual;
            console.log('용역 수주:', projectSalesSummary.actual);
            console.log('대관 실제:', rentalSalesSummary.actual);
            console.log('KDT 실제:', kdtSalesSummary.actual);
            console.log('확정 사업 발생 매출:', confirmedSalesTotal);
            const expectedSalesTotal = projectSalesSummary.expected + rentalSalesSummary.expected + kdtSalesSummary.expected;

            // 연도별 및 월별 매출 분석
            const monthlyStats = useMemo(() => {
                // 12개월 배열 생성 (0: 1월 ~ 11: 12월)
                const stats = Array.from({ length: 12 }, (_, i) => ({
                    month: `${i + 1}월`,
                    projectSales: 0,
                    rentalSales: 0,
                    kdtSales: 0,
                    kdtEstimate: 0,
                    kdtCats: {}, // 분류별(딥다이브/카테부/케클업) 월 금액
                    totalSales: 0,
                    projectItems: [] // 해당 월 제안사업 매출의 사업명별 내역 [{name, client, amount}]
                }));

                let projectTotal = 0;
                let rentalTotal = 0;
                let kdtTotal = 0;
                let kdtEstimateTotal = 0;
                const projectByType = {}; // 유형별(B2G/B2B/B2C/글로벌) 수주 매출

                // 1) 제안 사업 매출 배분 (매출 = D열 = 이미 지분율 반영된 값)
                processedProjects.forEach(p => {
                    if (normalizeStage(p.stage) !== '수주') return; // 수주 건만 집계
                    const rev = p.calculatedSales;
                    if (!rev) return;
                    const ptype = p.type || '기타';
                    const addType = (amt) => { projectByType[ptype] = (projectByType[ptype] || 0) + amt; };

                    if (p.parsedPeriod.isValid) {
                        // 용역 기간이 명확하면 기간(월)으로 분할 배분
                        const start = p.parsedPeriod.start;
                        const end = p.parsedPeriod.end;
                        const monthlyAlloc = getMonthlyAllocation(rev, p.parsedPeriod.durationMonths);
                        for (let m = 0; m < 12; m++) {
                            const checkDate = new Date(selectedYear, m, 15); // 월 중간 날짜로 비교 안전성 도모
                            if (isDateInRange(checkDate, start, end)) {
                                stats[m].projectSales += monthlyAlloc;
                                stats[m].projectItems.push({ name: p.name, client: p.client, amount: monthlyAlloc });
                                projectTotal += monthlyAlloc;
                                addType(monthlyAlloc);
                            }
                        }
                    } else {
                        // 기간 미상 → 제안시기(proposalPeriod) 연/월에 전액 귀속 (연도 필터 보존, 매출 유실 방지)
                        const py = extractYear(p.proposalPeriod);
                        const pd = parseDateString(p.proposalPeriod);
                        const month = pd ? pd.getMonth() : 0; // 월 정보 없으면 1월로 귀속
                        if (py === selectedYear) {
                            stats[month].projectSales += rev;
                            stats[month].projectItems.push({ name: p.name, client: p.client, amount: rev });
                            projectTotal += rev;
                            addType(rev);
                        }
                    }
                });

                // 2) 대관사업 매출 배분
                // - 시작일(B열) 기준으로 연도/월 대칭 배분
                rentals.forEach(r => {
                    if (r.status !== '확정') return; // 확정된 대관만
                    const date = parseDateString(r.startDate);
                    if (date && date.getFullYear() === selectedYear) {
                        const m = date.getMonth();
                        stats[m].rentalSales += (r.sales || 0);
                        rentalTotal += (r.sales || 0);
                    }
                });

                // 3) KDT 매출 배분
                const kdtCatNames = [];

                kdtSales.forEach((item) => {
                if (Number(item.year) !== Number(selectedYear)) {
                    return;
                }

                const month = Number(
                    String(item.month || '').replace('월', ''),
                );

                if (month < 1 || month > 12) {
                    return;
                }

                const m = month - 1;
                const amount = Number(item.amount) || 0;

                // 실제 매출
                if (item.type === '실제') {
                    stats[m].kdtSales += amount;
                    kdtTotal += amount;
                }

                // 예상 매출
                if (item.type === '예상') {
                    stats[m].kdtEstimate += amount;
                    kdtEstimateTotal += amount;
                }

                // 서비스별 매출
                if (item.service) {
                    stats[m].kdtCats[item.service] =
                    (stats[m].kdtCats[item.service] || 0) + amount;

                    if (!kdtCatNames.includes(item.service)) {
                    kdtCatNames.push(item.service);
                    }
                }
});

                // 총합 계산 + 사업명 내역 정리(동일 사업명 합산 후 금액 내림차순)
                stats.forEach(s => {
                    s.totalSales = s.projectSales + s.rentalSales + s.kdtSales + s.kdtEstimate;
                    if (s.projectItems.length > 1) {
                        const merged = {};
                        s.projectItems.forEach(it => {
                            const key = it.name + '\u0001' + (it.client || '');
                            if (!merged[key]) merged[key] = { name: it.name, client: it.client, amount: 0 };
                            merged[key].amount += it.amount;
                        });
                        s.projectItems = Object.keys(merged).map(k => merged[k]).sort((a, b) => b.amount - a.amount);
                    }
                });

                return {
                    months: stats,
                    kdtCatNames,
                    projectTotal,
                    projectByType,
                    rentalTotal,
                    kdtTotal,
                    kdtEstimateTotal,
                    // 종합 집계 = 전체 연도(예상 포함): 제안+대관(연중 전체) + KDT(발생+예상)
                    grandTotal: projectTotal + rentalTotal + kdtTotal + kdtEstimateTotal
                };
            }, [processedProjects, rentals, kdt, kdtMonthly, selectedYear]);

            // 제안 예상 매출 (파이프라인) — 중복 없이
            //  (A) 제안 사업 진행단계: 제안 중 · 결과 대기 중 (미결정)
            //  (B) 모니터링 미등록: 공고예정(수기입력) · 최종검토완료 & 판정≠'작업 진행'
            const projEstimate = useMemo(() => {
                const isCurY = selectedYear === new Date().getFullYear();
                const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
                const monthly = Array(12).fill(0); // 제안 예상 월별 배분
                const monthlyItems = Array.from({ length: 12 }, () => []); // 월별 사업명 내역
                const curMo = new Date().getMonth();
                // 제안 사업 인덱스: 사업명 → {stage, sales}
                const projByName = {};
                processedProjects.forEach(p => {
                    projByName[norm(p.name)] = { stage: normalizeStage(p.stage), sales: Number(p.calculatedSales) || 0 };
                });
                // (B) 제안 사업 파이프라인: 제안 중 · 결과 대기 중 → 제안시기 월
                let pipeline = 0;
                processedProjects.forEach(p => {
                    const st = normalizeStage(p.stage);
                    if (st === '제안 중' || st === '결과 대기 중') {
                        const py = extractYear(p.proposalPeriod);
                        if (py === selectedYear || !py) {
                            const amt = Number(p.calculatedSales) || 0;
                            pipeline += amt;
                            const pd = parseDateString(p.proposalPeriod);
                            const mo = pd ? pd.getMonth() : curMo;
                            monthly[mo] += amt;
                            monthlyItems[mo].push({ name: p.name || '(제목없음)', amount: amt });
                        }
                    }
                });
                // (A) 모니터링 금액(예산): 공고예정(수기입력) · 최종검토완료 → 마감일 월
                let moni = 0;
                if (isCurY) {
                    (monitoring || []).forEach(row => {
                        const status = String(row['상태'] || '');
                        const isPre = status.indexOf('공고예정') >= 0 || status.indexOf('최종 검토 완료') >= 0 || status.indexOf('최종검토') >= 0;
                        if (!isPre) return;
                        if (status.indexOf('제외') >= 0) return;
                        const linked = projByName[norm(row['사업명'])];
                        if (linked) {
                            if (linked.stage === '수주' || linked.stage === '실주') return; // 결정됨 → 예상 제외
                            if (linked.sales > 0) return; // 제안 사업 매출로 이미 집계 → 중복 방지
                        }
                        const amt = parseFloat(String(row['예산'] == null ? '' : row['예산']).replace(/[^\d.-]/g, '')) || 0;
                        moni += amt;
                        const dm = String(row['마감일'] || '').match(/(\d{4})[.\-\/]\s*(\d{1,2})/);
                        const mo = dm ? Math.min(11, Math.max(0, (+dm[2]) - 1)) : curMo;
                        monthly[mo] += amt;
                        monthlyItems[mo].push({ name: row['사업명'] || '(제목없음)', amount: amt });
                    });
                }
                return { pipeline, monitoring: moni, total: pipeline + moni, monthly, monthlyItems };
            }, [processedProjects, monitoring, selectedYear]);

            // 연도별 목표액 및 달성률 (예상 포함 / 현재시점)
            //  - 발생: 제안(수주)+대관+KDT발생  |  예상: + KDT예상 + 제안예상(파이프라인)
            const targetInfo = useMemo(() => {
                const targetValue = targets
                    .filter(t => t.year === selectedYear)
                    .reduce((sum, t) => sum + (Number(t.target) || 0), 0);
                const P = monthlyStats.projectTotal;          // 제안(수주)
                const R = monthlyStats.rentalTotal;           // 대관
                const Kact = monthlyStats.kdtTotal;           // KDT 발생
                const Kexp = monthlyStats.kdtEstimateTotal;   // KDT 예상
                const PE = projEstimate.total;                // 제안 예상(파이프라인)

                const currentTotal = P + R + Kact;            // 현재 발생
                const fullYearTotal = P + R + Kact + Kexp + PE; // 예상 포함
                const pct = (amt) => targetValue > 0 ? Math.round((amt / targetValue) * 100) : 0;
                const achieved = includeExpected ? fullYearTotal : currentTotal;

                // 달성액 소스별 구성 (KDT·제안은 토글에 따라 예상 가감)
                const kdtForMode = includeExpected ? (Kact + Kexp) : Kact;
                const projForMode = includeExpected ? (P + PE) : P;
                const srcTotal = projForMode + R + kdtForMode;
                const ratio = (v) => srcTotal > 0 ? Math.round((v / srcTotal) * 10000) / 100 : 0; // 소수2자리 %
                const breakdown = [
                    { label: '제안 사업', amount: projForMode, ratio: ratio(projForMode), color: 'bg-violet-500', text: 'text-violet-600' },
                    { label: '대관사업', amount: R, ratio: ratio(R), color: 'bg-cyan-500', text: 'text-cyan-600' },
                    { label: 'KDT', amount: kdtForMode, ratio: ratio(kdtForMode), color: 'bg-amber-500', text: 'text-amber-600' }
                ];

                return {
                    targetValue,
                    fullYearTotal, currentTotal,
                    percentFull: pct(fullYearTotal),
                    percentCurrent: pct(currentTotal),
                    achieved,
                    percent: pct(achieved),
                    breakdown, srcTotal
                };
            }, [targets, selectedYear, monthlyStats, includeExpected, projEstimate]);

            // 제안 결정 대기(모니터링 상태=1차 검토 완료) 건수 — '검토 중'에 합산. 캐시 우선.
            const pendingCount = useMemo(() => {
                return (monitoring || []).filter((row) => {
                    const status = String(row['상태'] || '')
                    .replace(/\s+/g, '');

                    return (
                    status.includes('1차검토완료') ||
                    status.includes('최종검토완료')
                    );
                }).length;
            }, [monitoring]);

            // 수주 현황 및 통계 데이터 (제안 사업 단계별 건수)
            const stageCounts = useMemo(() => {
                const counts = { "검토 중": 0, "제안 중": 0, "결과 대기 중": 0, "중단": 0, "수주": 0, "실주": 0 };
                let total = 0;
                
                projects.forEach(p => {
                    const py = extractYear(p.proposalPeriod);
                    // 제안시기가 선택 연도에 포함되는 경우 카운트
                    if (py === selectedYear) {
                        const st = normalizeStage(p.stage);
                        if (counts[st] !== undefined) {
                            counts[st]++;
                        }
                        total++;
                    }
                });
                
                return { ...counts, total };
            }, [projects, selectedYear]);

            // 소스별 보기 토글에 따른 표시 여부
            const showProject = viewFilter === 'all' || viewFilter === 'project';
            const showRental  = viewFilter === 'all' || viewFilter === 'rental';
            const showKdt     = viewFilter === 'all' || viewFilter === 'kdt';

            // 토글 선택에 맞춰 월별 표시 데이터 재구성
            const KDT_COLORS = { '딥다이브': '#d97706', '카테부': '#f59e0b', '케클업': '#fbbf24' };
            const kdtCatNames = monthlyStats.kdtCatNames || [];
            const _curYear = new Date().getFullYear();
            const _curMonth = new Date().getMonth();
            const monthsView = monthlyStats.months.map((m, idx) => {
                const vProject = showProject ? m.projectSales : 0;
                const vProjEst = showProject ? (projEstimate.monthly[idx] || 0) : 0;
                const vProjEstItems = showProject ? (projEstimate.monthlyItems[idx] || []) : [];
                const vRental  = showRental ? m.rentalSales : 0;
                // KDT 분류별 금액 + 이 달이 예상(미래월)인지
                const kdtExpected = (selectedYear === _curYear) && (idx > _curMonth);
                const vKdtCats = {}; let vKdtTotal = 0;
                if (showKdt) kdtCatNames.forEach(n => { const a = (m.kdtCats && m.kdtCats[n]) || 0; vKdtCats[n] = a; vKdtTotal += a; });
                return { ...m, vProject, vProjEst, vProjEstItems, vRental, vKdtCats, vKdtTotal, kdtExpected, vTotal: vProject + vProjEst + vRental + vKdtTotal };
            });

            // 현재 보기 합계 및 차트 최대값(현재 보기 기준)
            const viewTotal = monthsView.reduce((s, m) => s + m.vTotal, 0);
            const rawMax = Math.max(...monthsView.map(m => m.vTotal), 10000000); // 최소 1천만
            const axisStep = niceStep(rawMax / 4); // 약 4구간이 되도록 깔끔한 step
            const maxMonthSales = Math.ceil(rawMax / axisStep) * axisStep; // 깔끔한 상한(막대 여백 확보)
            const axisTicks = [];
            for (let v = maxMonthSales; v >= 0; v -= axisStep) axisTicks.push(v);

            return (
                <div className="space-y-8 animate-fadeIn">
                    
                    {/* 데이터 소실 경고창 */}
                    {showWarning && (
                        <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-start space-x-4 shadow-xl shadow-amber-950/20">
                            <Icon name="warning" className="w-6 h-6 mt-0.5 text-amber-600 animate-pulse flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-base">⚠️ {selectedYear}년도 데이터 안내 (데이터 소실 주의)</h4>
                                <p className="text-xs text-amber-600 leading-relaxed mt-1">
                                    2026년 이전 데이터는 구글 스프레드시트 마이그레이션 중 일부 실적 데이터가 소실되거나 정상적으로 반영되지 않았을 가능성이 존재합니다. 집계된 금액은 실제 매출과 다를 수 있으니 유의하시기 바랍니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 대시보드 헤더 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">{selectedYear}년 사업본부 매출 현황</h2>
                            <p className="text-sm text-slate-500 mt-1">제안 사업, 대관 및 부트캠프 실적 통합 대시보드</p>
                        </div>
                    </div>
                    {/* 확정 사업 매출 요약 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 확정 사업 발생 매출 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                        <Icon name="project" className="w-24 h-24" />
                        </div>

                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        확정 사업 발생 매출
                        </span>

                        <div className="text-3xl font-black text-emerald-600 mt-2 tracking-tight">
                        {formatKRW(confirmedSalesTotal)}
                        </div>

                        <div className="text-xs text-slate-400 font-medium mt-1">
                        실제 발생한 확정 사업 매출
                        </div>
                    </div>

                    {/* 확정 사업 예상 매출 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                        <Icon name="project" className="w-24 h-24" />
                        </div>

                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        확정 사업 예상 매출
                        </span>

                        <div className="text-3xl font-black text-blue-600 mt-2 tracking-tight">
                        {formatKRW(expectedSalesTotal)}
                        </div>

                        <div className="text-xs text-slate-400 font-medium mt-1">
                        확정됐지만 아직 발생하지 않은 예정 매출
                        </div>
                    </div>

                    </div>
                    {/* KPI 카드 섹션 — 총 매출 · KDT · 제안 사업(유형별) · 대관 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <Icon name="project" className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">총합 집계 매출 (예상 포함)</span>
                            <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatKRW(targetInfo.fullYearTotal)}</div>
                            <div className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5"></span>
                                {selectedYear}년 전체(발생+예상) 기준
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                <Icon name="kdt" className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">KDT 매출</span>
                            <div className="text-2xl font-black text-amber-600 mt-2 tracking-tight">{formatKRW(monthlyStats.kdtTotal)}</div>
                            <div className="text-xs text-slate-400 font-medium mt-1">
                                현재까지 발생 합산
                                {monthlyStats.kdtEstimateTotal > 0 && (
                                    <span className="block text-amber-500 mt-0.5">+ 예상 {formatKRW(monthlyStats.kdtEstimateTotal)} (향후 월)</span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-violet-600 group-hover:scale-110 transition-transform duration-300">
                                <Icon name="project" className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">용역 사업 매출 (수주)</span>
                            <div className="text-2xl font-black text-violet-600 mt-2 tracking-tight">{formatKRW(monthlyStats.projectTotal)}</div>
                            {(() => {
                                const t = monthlyStats.projectByType || {};
                                const order = ['B2G', 'B2B', 'B2C', '글로벌', '기타'];
                                const parts = order.filter(k => (t[k] || 0) > 0);
                                return (
                                    <div className="mt-1.5 space-y-1">
                                        {parts.length > 0 && (
                                            <div className="text-[11px] font-semibold flex flex-wrap gap-x-3 gap-y-0.5">
                                                {parts.map(k => (
                                                    <span key={k} className="text-slate-500"><span className="text-violet-600 font-bold">{k}</span> {formatKRW(t[k])}</span>
                                                ))}
                                            </div>
                                        )}
                                        {projEstimate.total > 0 && (
                                            <div className="text-[11px] text-violet-400 font-semibold">+ 예상 {formatKRW(projEstimate.total)} (수주 시)</div>
                                        )}
                                        {parts.length === 0 && projEstimate.total === 0 && (
                                            <div className="text-xs text-slate-400 font-medium">'수주' 확정 건 매출</div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-cyan-600 group-hover:scale-110 transition-transform duration-300">
                                <Icon name="rental" className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">대관사업 매출</span>
                            <div className="text-2xl font-black text-cyan-600 mt-2 tracking-tight">{formatKRW(monthlyStats.rentalTotal)}</div>
                            <div className="text-xs text-slate-400 font-medium mt-1">
                                확정 상태 대관료 실적 합산
                            </div>
                        </div>
                    </div>

                    {/* 매출 목표 및 달성도 + 수주 현황 파이 차트 대치 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 연간 목표 달성도 */}
                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">🎯 연간 목표 달성률</h3>
                                        <p className="text-xs text-slate-400">지정된 매출 목표 대비 {includeExpected ? '예상 포함' : '현재시점'} 현황</p>
                                    </div>
                                    <button
                                        onClick={() => setIncludeExpected(v => !v)}
                                        className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${includeExpected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-400 border-slate-200'}`}
                                        title="향후 월의 예상매출을 달성도에 포함/제외">
                                        예상매출 포함 {includeExpected ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="my-6 flex flex-col items-center justify-center relative">
                                {/* 목표 도넛 또는 프로그레스 */}
                                <div className="relative w-36 h-36 flex items-center justify-center group cursor-help">
                                    {/* 원형 트랙 */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" stroke="rgba(30, 41, 59, 0.6)" strokeWidth="8" fill="transparent" />
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="40" 
                                            stroke={includeExpected ? "url(#purpleGradient)" : "#2563eb"}
                                            strokeWidth="8" 
                                            fill="transparent" 
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 - (251.2 * Math.min(targetInfo.percent, 100)) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#2563eb" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute text-center">
                                        <span className="text-3xl font-black text-slate-900">{targetInfo.percent}%</span>
                                        <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{includeExpected ? '예상 포함' : '현재시점'}</span>
                                    </div>
                                    {/* 호버 툴팁: 소스별 구성 비율 */}
                                    <div className="hidden group-hover:block absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 text-left">
                                        <div className="text-[11px] font-bold text-slate-500 mb-2">달성액 구성 ({includeExpected ? '예상 포함' : '현재시점'})</div>
                                        {targetInfo.srcTotal > 0 ? (
                                            <div className="space-y-2">
                                                {targetInfo.breakdown.map((b, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-[11px] font-semibold">
                                                            <span className={b.text}>{b.label}</span>
                                                            <span className="text-slate-600">{b.ratio.toFixed(2)}% · {formatKRW(b.amount)}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-0.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.ratio}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 font-semibold">집계된 매출이 없습니다.</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold">
                                    <span className="text-slate-400">현재시점 <span className="text-blue-600">{targetInfo.percentCurrent}%</span></span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-400">예상 포함 <span className="text-pink-600">{targetInfo.percentFull}%</span></span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-500">목표 매출액:</span>
                                    <span className="text-slate-900">{formatKRW(targetInfo.targetValue)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-500">{includeExpected ? '예상 포함 달성액:' : '현재 발생 달성액:'}</span>
                                    <span className="text-blue-700">{formatKRW(targetInfo.achieved)}</span>
                                </div>
                                <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-200">
                                    <div className="bg-gradient-to-r from-brand-500 to-pink-500 h-full rounded-full" style={{ width: `${Math.min(targetInfo.percent, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* 제안 건수 및 단계별 수주 통계 */}
                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">📊 연도별 사업 수주 및 제안 현황</h3>
                                <p className="text-xs text-slate-400">{selectedYear}년 제안 시기 기준 제안 건수 및 수주 확률</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 my-6">
                                {[
                                    { label: '수주 건수', count: stageCounts["수주"], color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                    { label: '제안 중 건수', count: stageCounts["제안 중"], color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
                                    { label: '결과 대기 중 건수', count: stageCounts["결과 대기 중"], color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
                                    { label: '검토 중 건수', count: stageCounts["검토 중"] + pendingCount, color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/20' },
                                    { label: '실주 건수', count: stageCounts["실주"], color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/20' },
                                    { label: '중단 건수', count: stageCounts["중단"], color: 'text-slate-500', bg: 'bg-slate-100 border-slate-500/20' }
                                ].map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border text-center ${item.bg}`}>
                                        <span className="text-[11px] text-slate-500 font-bold block mb-1">{item.label}</span>
                                        <span className={`text-2xl font-black ${item.color}`}>{item.count}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-semibold">총 제안 건수:</span>
                                    <span className="text-slate-900 font-bold">{stageCounts.total} 건</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-semibold">공식 수주율 (수주 / 전체 제안):</span>
                                    <span className="text-emerald-600 font-black">
                                        {stageCounts.total > 0 ? Math.round((stageCounts["수주"] / stageCounts.total) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 인터랙티브 월별 통합 매출 트렌드 그래프 (커스텀 SVG) */}
                    <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">📈 월별 발생 매출 트렌드 시각화</h3>
                                <p className="text-xs text-slate-400">현재 보기 합계: <span className="text-blue-700 font-semibold">{formatKRW(viewTotal)}</span></p>
                            </div>
                            {/* 소스별 보기 토글 (전체 / 제안 사업 / 대관 사업 / KDT) */}
                            <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                {[
                                    { id: 'all', label: '전체 보기' },
                                    { id: 'kdt', label: 'KDT' },
                                    { id: 'project', label: '제안 사업' },
                                    { id: 'rental', label: '대관 사업' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setViewFilter(opt.id)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${viewFilter === opt.id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 현재 보기 기준 범례 */}
                        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500 mb-2 h-4">
                            {showKdt && kdtCatNames.map(n => (
                                <span key={n} className="flex items-center"><span className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: KDT_COLORS[n] || '#f59e0b' }}></span>{n}</span>
                            ))}
                            {showKdt && <span className="flex items-center text-slate-400"><span className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: '#fbbf24', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 2px, transparent 2px, transparent 5px)' }}></span>빗금=예상(미래월)</span>}
                            {showProject && <span className="flex items-center"><span className="w-3 h-3 bg-brand-600 rounded-sm mr-1.5"></span>제안 사업</span>}
                            {showProject && <span className="flex items-center"><span className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: '#a78bfa', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 2px, transparent 2px, transparent 5px)' }}></span>제안 예상</span>}
                            {showRental && <span className="flex items-center"><span className="w-3 h-3 bg-cyan-400 rounded-sm mr-1.5"></span>대관 사업</span>}
                        </div>

                        {/* 그래프 영역 */}
                        <div className="relative w-full h-80 pt-6">
                            {/* Y축 그리드 가이드 및 금액 (깔끔한 눈금 + 축약 표기) */}
                            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-medium pointer-events-none pb-8 pl-2">
                                {axisTicks.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-14 text-right shrink-0">{formatKRWShort(t)}</span>
                                        <div className="border-t border-slate-200 flex-1"></div>
                                    </div>
                                ))}
                            </div>

                            {/* 바 그래프 바디 */}
                            <div className="w-full h-full flex justify-between items-end pb-8 pl-16 pr-4 relative z-10">
                                {monthsView.map((m, idx) => {
                                    // 현재 보기 기준 각 매출의 비중 높이 비율 계산
                                    const projHeight = (m.vProject / maxMonthSales) * 100;
                                    const projEstHeight = (m.vProjEst / maxMonthSales) * 100;
                                    const rentalHeight = (m.vRental / maxMonthSales) * 100;
                                    const kdtTotalHeight = (m.vKdtTotal / maxMonthSales) * 100;
                                    const totalHeight = projHeight + projEstHeight + rentalHeight + kdtTotalHeight;

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            
                                            {/* 마우스 호버 툴팁 */}
                                            <div className="absolute bottom-full mb-2 bg-white border border-slate-200 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 text-left min-w-[210px] max-w-[280px]">
                                                <div className="text-[11px] font-bold text-slate-500 mb-1">{selectedYear}년 {m.month} 실적</div>
                                                <div className="text-[10px] space-y-1">
                                                    {showKdt && kdtCatNames.map(n => ((m.vKdtCats[n] || 0) > 0 && (
                                                        <div key={n} className="flex justify-between"><span className="font-semibold" style={{ color: KDT_COLORS[n] || '#d97706' }}>{n}{m.kdtExpected ? '(예상)' : ''}{m.vTotal > 0 ? ` (${(((m.vKdtCats[n] || 0) / m.vTotal) * 100).toFixed(2)}%)` : ''}:</span> <span className={m.kdtExpected ? 'italic text-amber-600' : ''}>{formatKRW(m.vKdtCats[n] || 0)}</span></div>
                                                    )))}
                                                    {showProject && <div className="flex justify-between"><span className="text-violet-600 font-semibold">제안{m.vTotal > 0 ? ` (${((m.vProject / m.vTotal) * 100).toFixed(2)}%)` : ''}:</span> <span>{formatKRW(m.vProject)}</span></div>}
                                                    {/* 제안사업 사업명별 비중 (제안 매출 대비 %) */}
                                                    {showProject && m.projectItems && m.projectItems.length > 0 && (
                                                        <div className="pl-2 ml-1 border-l border-violet-500/30 space-y-0.5">
                                                            {m.projectItems.slice(0, 8).map((it, i) => (
                                                                <div key={i} className="flex justify-between gap-2 text-[9px] text-slate-500">
                                                                    <span className="truncate max-w-[150px]" title={it.name}>· {it.name}</span>
                                                                    <span className="whitespace-nowrap text-slate-600">{m.vProject > 0 ? `${((it.amount / m.vProject) * 100).toFixed(2)}%` : '0.00%'}</span>
                                                                </div>
                                                            ))}
                                                            {m.projectItems.length > 8 && (
                                                                <div className="text-[9px] text-slate-400">외 {m.projectItems.length - 8}건</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {showProject && m.vProjEst > 0 && <div className="flex justify-between"><span className="text-violet-400 font-semibold">└ 제안 예상{m.vTotal > 0 ? ` (${((m.vProjEst / m.vTotal) * 100).toFixed(2)}%)` : ''}:</span> <span className="italic text-violet-500">{formatKRW(m.vProjEst)}</span></div>}
                                                    {/* 제안 예상 사업명별 비중 (제안 예상 대비 %) */}
                                                    {showProject && projEstimate.monthlyItems[idx] && projEstimate.monthlyItems[idx].length > 0 && (
                                                        <div className="pl-2 ml-1 border-l border-violet-400/30 space-y-0.5">
                                                            {projEstimate.monthlyItems[idx].slice(0, 8).map((it, i) => (
                                                                <div key={i} className="flex justify-between gap-2 text-[9px] text-slate-500">
                                                                    <span className="truncate max-w-[150px]" title={it.name}>· {it.name}</span>
                                                                    <span className="whitespace-nowrap text-slate-600">{m.vProjEst > 0 ? `${((it.amount / m.vProjEst) * 100).toFixed(2)}%` : '0.00%'}</span>
                                                                </div>
                                                            ))}
                                                            {projEstimate.monthlyItems[idx].length > 8 && (
                                                                <div className="text-[9px] text-slate-400">외 {projEstimate.monthlyItems[idx].length - 8}건</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {showRental && <div className="flex justify-between"><span className="text-cyan-600 font-semibold">대관{m.vTotal > 0 ? ` (${((m.vRental / m.vTotal) * 100).toFixed(2)}%)` : ''}:</span> <span>{formatKRW(m.vRental)}</span></div>}
                                                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900"><span>합계:</span> <span>{formatKRW(m.vTotal)}</span></div>
                                                </div>
                                            </div>

                                            {/* 누적 바 기둥 (토글에 따라 분리 표시) */}
                                            <div className="w-10 rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-500 ease-out group-hover:scale-x-105" style={{ height: `${Math.max(totalHeight, 1.5)}%` }}>
                                                {/* 대관 바 (맨 위) */}
                                                {showRental && <div className="bg-cyan-400 w-full" style={{ height: `${(rentalHeight / Math.max(totalHeight, 1)) * 100}%` }}></div>}
                                                {/* 제안 예상 바 (빗금 — 파이프라인/모니터링) */}
                                                {showProject && m.vProjEst > 0 && <div className="w-full" title="제안 예상(파이프라인·모니터링)" style={{ height: `${(projEstHeight / Math.max(totalHeight, 1)) * 100}%`, backgroundColor: '#a78bfa', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 3px, transparent 3px, transparent 7px)' }}></div>}
                                                {/* 제안 사업 바 (중간) */}
                                                {showProject && <div className="bg-brand-600 w-full" style={{ height: `${(projHeight / Math.max(totalHeight, 1)) * 100}%` }}></div>}
                                                {/* KDT 분류별 바 (딥다이브/카테부/케클업, 미래월=빗금 예상) */}
                                                {showKdt && kdtCatNames.map(n => {
                                                    const amt = m.vKdtCats[n] || 0; if (amt <= 0) return null;
                                                    const h = (amt / maxMonthSales) * 100;
                                                    const base = KDT_COLORS[n] || '#f59e0b';
                                                    const style = { height: `${(h / Math.max(totalHeight, 1)) * 100}%`, backgroundColor: base };
                                                    if (m.kdtExpected) style.backgroundImage = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 3px, transparent 3px, transparent 7px)';
                                                    return <div key={n} className="w-full" title={n + (m.kdtExpected ? ' (예상)' : '')} style={style}></div>;
                                                })}
                                            </div>

                                            {/* X축 월 텍스트 */}
                                            <span className="absolute top-full mt-2 text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">{m.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            );
        }