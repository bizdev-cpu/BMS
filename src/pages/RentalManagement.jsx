import { useMemo, useState } from 'react';
import Icon from '../components/common/Icon';
import SortTh from '../components/SortTh';
import { applySort, useSortable } from '../util/sort';
import { formatDate } from '../util/format';

export default function RentalManagement({ 
    rentals = [], 
    executeAction, 
    formatKRW }) {
            const [isFormOpen, setIsFormOpen] = useState(false);
            const [currentRental, setCurrentRental] = useState(null);

            // 필터/검색/정렬 상태
            const RENTAL_LOCATIONS = ['MESSI 1', 'MESSI 2', 'MESSI 3', 'RONALDO 1', 'RONALDO 2', 'TOWN HALL', 'SONNY 1', 'JISUNG 1', 'JISUNG 2', 'PEP 1', 'SONNY 2', 'PEP 2', 'PEP 3'];
            const [statusFilter, setStatusFilter] = useState('All');
            const [locationFilter, setLocationFilter] = useState('All');
            const [searchTerm, setSearchTerm] = useState('');
            const [viewMode, setViewMode] = useState('calendar'); // 기본: 캘린더
            const [calRef, setCalRef] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
            // 장소 필드는 'JISUNG 1, JISUNG 2'처럼 복수일 수 있어 콤마로 파싱
            const parseLocations = (loc) => String(loc || '').split(',').map(s => s.trim()).filter(Boolean);
            const sort = useSortable('startDate', 'desc');
            const rentalSortTypes = {
                id: 'string', title: 'string', startDate: 'date',
                location: 'string', manager: 'string', status: 'string', sales: 'number'
            };

            const filteredRentals = useMemo(() => {
                return rentals.filter(r => {
                    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
                    if (locationFilter !== 'All' && String(r.location || '').indexOf(locationFilter) === -1) return false;
                    if (searchTerm) {
                        const t = searchTerm.toLowerCase();
                        return [r.title, r.manager, r.location, r.id].some(v => String(v || '').toLowerCase().includes(t));
                    }
                    return true;
                });
            }, [rentals, statusFilter, locationFilter, searchTerm]);

            const rentalSalesSummary = useMemo(() => {
                let actual = 0;
                let expected = 0;

                rentals.forEach((rental) => {
                    const sales = Number(rental.sales);

                    // 매출이 없는 대관은 제외
                    if (!Number.isFinite(sales) || sales <= 0) {
                    return;
                    }

                    // 입금 확정 → 발생 매출
                    if (rental.paymentConfirmed) {
                    actual += sales;
                    } else {
                    // 매출은 있지만 입금 미확정 → 예상 매출
                    expected += sales;
                    }
                });

                return {
                    actual,
                    expected,
                    total: actual + expected,
                };
                }, [rentals]);

            const sortedRentals = useMemo(
                () => applySort(filteredRentals, sort.sortKey, sort.sortDir, rentalSortTypes),
                [filteredRentals, sort.sortKey, sort.sortDir]
            );

            // 캘린더 데이터: 해당 월 셀 + 일자별 대관 이벤트(다일 행사는 기간 내 모든 날에 표시)
            const pad2 = (n) => String(n).padStart(2, '0');
            const fmtYmd = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
            const calData = useMemo(() => {
                const { y, m } = calRef;
                const startDow = new Date(y, m, 1).getDay();
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < startDow; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
                while (cells.length % 7 !== 0) cells.push(null);
                const evByDay = {};
                filteredRentals.forEach(r => {
                    if (!r.startDate) return;
                    const s = r.startDate, e = r.endDate || r.startDate;
                    cells.forEach(c => { if (!c) return; const ds = fmtYmd(c); if (ds >= s && ds <= e) { (evByDay[ds] = evByDay[ds] || []).push(r); } });
                });
                return { cells, evByDay, y, m };
            }, [calRef, filteredRentals]);
            const moveMonth = (delta) => setCalRef(p => { const d = new Date(p.y, p.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
            const todayYmd = fmtYmd(new Date());

            // 폼 상태
            const [formTitle, setFormTitle] = useState('');
            const [formStartDate, setFormStartDate] = useState('');
            const [formEndDate, setFormEndDate] = useState('');
            const [formStartTime, setFormStartTime] = useState('09:00');
            const [formEndTime, setFormEndTime] = useState('18:00');
            const [formLocation, setFormLocation] = useState('TOWN HALL');
            const [formManager, setFormManager] = useState('');
            const [formStatus, setFormStatus] = useState('확정');
            const [formSales, setFormSales] = useState('');
            const [formIncludeWeekend, setFormIncludeWeekend] = useState('아니오');

            const openAddForm = () => {
                setCurrentRental(null);
                setFormTitle('');
                setFormStartDate(formatDate(new Date()));
                setFormEndDate(formatDate(new Date()));
                setFormStartTime('09:00');
                setFormEndTime('18:00');
                setFormLocation('TOWN HALL');
                setFormManager('');
                setFormStatus('확정');
                setFormSales('');
                setFormIncludeWeekend('아니오');
                setIsFormOpen(true);
            };

            const openEditForm = (r) => {
                setCurrentRental(r);
                setFormTitle(r.title);
                setFormStartDate(r.startDate || '');
                setFormEndDate(r.endDate || '');
                setFormStartTime(r.startTime || '09:00');
                setFormEndTime(r.endTime || '18:00');
                setFormLocation(r.location || 'TOWN HALL');
                setFormManager(r.manager || '');
                setFormStatus(r.status || '확정');
                setFormSales(String(r.sales || ''));
                setFormIncludeWeekend(r.includeWeekend || '아니오');
                setIsFormOpen(true);
            };

            const handleFormSubmit = async (e) => {
                e.preventDefault();

                if (!formTitle.trim()) return;

                const payload = {
                    title: formTitle,
                    startDate: formStartDate,
                    endDate: formEndDate,
                    startTime: formStartTime,
                    endTime: formEndTime,
                    location: formLocation,
                    manager: formManager,
                    status: formStatus,
                    sales: Number(formSales) || 0,
                    includeWeekend: formIncludeWeekend,
                };

                try {
                    if (currentRental) {
                    await executeAction('updateRental', {
                        ...payload,
                        id: currentRental.id,
                        rowIndex: currentRental.rowIndex,
                    });
                    } else {
                    await executeAction('addRental', payload);
                    }

                    setIsFormOpen(false);
                } catch (error) {
                    console.error('대관 저장 실패:', error);
                    alert(
                    error instanceof Error
                        ? error.message
                        : '대관 정보를 저장하지 못했습니다.',
                    );
                }
                };

            const handleDelete = async (id, rowIndex) => {
                const confirmed = confirm(
                    '이 대관건을 삭제하시겠습니까?\n삭제 내역 시트에 아카이브됩니다.',
                );

                if (!confirmed) return;

                try {
                    await executeAction('deleteRental', {
                    id,
                    rowIndex,
                    });
                } catch (error) {
                    console.error('대관 삭제 실패:', error);
                    alert(
                    error instanceof Error
                        ? error.message
                        : '대관 정보를 삭제하지 못했습니다.',
                    );
                }
                };

            return (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        {/* 상단 영역 */}
                        <div className="w-full space-y-6">
                        {/* 제목 */}
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">
                            대관사업 관리
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                            Town Hall, Classroom 등 강의실/행사장 대관 현황 관리
                            </p>
                        </div>

                        {/* 매출 요약 + 등록 버튼 */}
                        <div className="flex items-center gap-4">
                            {/* 매출 카드 */}
                            <div className="grid grid-cols-3 gap-10">
                            {/* 발생 매출 */}
                            <div className="w-[360px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">
                                발생 매출
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-900">
                                {formatKRW(rentalSalesSummary.actual)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                입금 확정된 대관 매출
                                </p>
                            </div>

                            {/* 예상 매출 */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">
                                예상 매출
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-900">
                                {formatKRW(rentalSalesSummary.expected)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                입금 대기 중인 대관 매출
                                </p>
                            </div>

                            {/* 합계 */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">
                                합계
                                </p>

                                <p className="mt-2 text-2xl font-black text-brand-600">
                                {formatKRW(rentalSalesSummary.total)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                발생 + 예상 매출
                                </p>
                            </div>
                            </div>

                            {/* 기존 크기 그대로 */}
                            <button
                            onClick={openAddForm}
                            className="ml-auto mr-10 flex shrink-0 items-center space-x-2 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-brand-600/20 transition-all duration-200 hover:bg-brand-500"
                            >
                            <Icon name="plus" className="h-5 w-5" />
                            <span>대관 예약 등록</span>
                            </button>
                        </div>
                        </div>
                    </div>

                    {/* 필터 바 */}
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-200 backdrop-blur-md">
                        <div className="flex flex-wrap gap-2 items-center">
                            {['All', '확정', '대기'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${statusFilter === st ? 'bg-brand-600 text-white border-brand-500 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'}`}
                                >
                                    {st === 'All' ? '전체' : st}
                                </button>
                            ))}
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200 focus:outline-none focus:border-brand-500"
                                title="장소별 보기"
                            >
                                <option value="All">📍 전체 장소</option>
                                {RENTAL_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0">
                                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>목록</button>
                                <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>캘린더</button>
                            </div>
                            <div className="w-full md:w-80">
                                <input
                                    type="text"
                                    placeholder="행사명, 담당자, 장소 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 text-sm border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 대관 목록 테이블 */}
                    {viewMode === 'list' && (
                    <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <SortTh label="예약 ID" colKey="id" sort={sort} className="p-4 w-36" />
                                        <SortTh label="구분 / 행사명" colKey="title" sort={sort} className="p-4" />
                                        <SortTh label="대관일시" colKey="startDate" sort={sort} className="p-4" />
                                        <SortTh label="장소" colKey="location" sort={sort} className="p-4" />
                                        <SortTh label="담당자" colKey="manager" sort={sort} className="p-4" />
                                        <SortTh label="상태" colKey="status" sort={sort} className="p-4" />
                                        <SortTh label="대관 매출(원)" colKey="sales" sort={sort} className="p-4 text-right" align="right" />
                                        <th className="p-4 text-center w-28">액션</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sortedRentals.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">등록된 대관 내역이 없습니다.</td>
                                        </tr>
                                    ) : (
                                        sortedRentals.map((r, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-mono font-bold text-slate-500">{r.id}</td>
                                                <td className="p-4 font-bold text-slate-900">{r.title}</td>
                                                <td className="p-4 text-slate-600">
                                                    <div>{r.startDate} ~ {r.endDate}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{r.startTime} ~ {r.endTime}</div>
                                                </td>
                                                <td className="p-4 font-semibold text-slate-600">{r.location}</td>
                                                <td className="p-4 text-slate-600">{r.manager}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === '확정' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-black text-slate-900">{formatKRW(r.sales)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() => openEditForm(r)}
                                                            className="p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-violet-600 transition-colors"
                                                            title="수정"
                                                        >
                                                            <Icon name="edit" className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(r.id, r.rowIndex)}
                                                            className="p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                                                            title="삭제"
                                                        >
                                                            <Icon name="delete" className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}

                    {/* 대관 캘린더 뷰 */}
                    {viewMode === 'calendar' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => moveMonth(-1)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold hover:bg-white">‹ 이전</button>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-extrabold text-slate-900">{calData.y}년 {calData.m + 1}월</span>
                                    <button onClick={() => { const d = new Date(); setCalRef({ y: d.getFullYear(), m: d.getMonth() }); }} className="text-[11px] font-bold text-brand-600 border border-brand-200 rounded px-2 py-1 hover:bg-brand-50">오늘</button>
                                </div>
                                <button onClick={() => moveMonth(1)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold hover:bg-white">다음 ›</button>
                            </div>
                            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                                    <div key={d} className={`bg-slate-50 py-2 text-center text-xs font-bold ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{d}</div>
                                ))}
                                {calData.cells.map((c, idx) => {
                                    if (!c) return <div key={idx} className="bg-slate-50/50 min-h-[96px]"></div>;
                                    const ds = fmtYmd(c);
                                    const evs = calData.evByDay[ds] || [];
                                    const dow = c.getDay();
                                    const isToday = ds === todayYmd;
                                    return (
                                        <div key={idx} className="bg-white min-h-[96px] p-1.5 flex flex-col gap-1">
                                            <div className={`text-[11px] font-bold ${isToday ? 'bg-brand-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : dow === 0 ? 'text-rose-500' : dow === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{c.getDate()}</div>
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                {evs.slice(0, 3).map((r, i2) => {
                                                    const conf = r.status === '확정';
                                                    const isPast = r.endDate && r.endDate < todayYmd;

                                                    // 매출이 입력되어 있는지
                                                    const hasSales =
                                                    r.sales != null &&
                                                    Number(r.sales) > 0;

                                                    return (
                                                    <button
                                                        key={i2}
                                                        onClick={() => openEditForm(r)}
                                                        title={`${r.title} · ${r.location || ''} · ${r.startTime || ''}~${r.endTime || ''}`}
                                                        className={`text-left text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate ${
                                                        isPast
                                                            ? 'bg-slate-200 border-slate-300 text-slate-500'
                                                            : conf
                                                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                            : 'bg-amber-50 border-amber-200 text-amber-700'
                                                        }`}
                                                    >
                                                        {/* 매출 상태 */}
                                                        {hasSales && (
                                                        <span
                                                            className={`mr-1 inline-block h-2.5 w-2.5 align-middle rounded-full ${
                                                            r.paymentConfirmed
                                                                ? 'bg-emerald-500'
                                                                : 'bg-orange-400'
                                                            }`}
                                                        />
                                                        )}

                                                        <span className="font-semibold">
                                                        {r.startTime ? r.startTime + ' ' : ''}
                                                        </span>

                                                        {r.title}
                                                    </button>
                                                    );
                                                })}
                                                {evs.length > 3 && <span className="text-[10px] text-slate-400 pl-1">+{evs.length - 3}건</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-100 border border-brand-300"></span>확정</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>대기</span>
                                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200 border border-slate-300" ></span>지난 일정</span>
                                <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                발생 매출
                                </span>

                                <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-orange-400" />
                                예상 매출
                                </span>
                                <span className="text-slate-400">· 일정 클릭 시 수정</span>
                            </div>
                        </div>
                    )}

                    {/* 대관 CRUD 모달 */}
                    {isFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">{currentRental ? '대관 정보 수정' : '새 대관 등록'}</h3>
                                    <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-slate-900">
                                        <Icon name="close" className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 font-bold mb-1.5">행사명 (필수)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="예: [외부] 구글 테크 밋업 대관"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">대관 시작일</label>
                                            <input
                                                type="date"
                                                required
                                                value={formStartDate}
                                                onChange={(e) => setFormStartDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">대관 종료일</label>
                                            <input
                                                type="date"
                                                required
                                                value={formEndDate}
                                                onChange={(e) => setFormEndDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">시작 시간</label>
                                            <input
                                                type="text"
                                                placeholder="예: 09:00"
                                                value={formStartTime}
                                                onChange={(e) => setFormStartTime(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">종료 시간</label>
                                            <input
                                                type="text"
                                                placeholder="예: 18:00"
                                                value={formEndTime}
                                                onChange={(e) => setFormEndTime(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">대관 장소 <span className="font-normal text-slate-400">(복수 선택 가능)</span></label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {RENTAL_LOCATIONS.map(loc => {
                                                    const sel = parseLocations(formLocation).indexOf(loc) !== -1;
                                                    return (
                                                        <button type="button" key={loc}
                                                            onClick={() => {
                                                                const cur = parseLocations(formLocation);
                                                                const next = sel ? cur.filter(x => x !== loc) : cur.concat([loc]);
                                                                setFormLocation(next.join(','));
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${sel ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'}`}>
                                                            {loc}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {parseLocations(formLocation).some(l => RENTAL_LOCATIONS.indexOf(l) === -1) && (
                                                <p className="text-[11px] text-slate-400 mt-1">기존 값: {formLocation}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">대관 담당자</label>
                                            <input
                                                type="text"
                                                placeholder="예: @김미영"
                                                value={formManager}
                                                onChange={(e) => setFormManager(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">매출(대관료)</label>
                                            <input
                                                type="number"
                                                placeholder="원 단위 입력"
                                                value={formSales}
                                                onChange={(e) => setFormSales(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-bold mb-1.5">상태</label>
                                            <select
                                                value={formStatus}
                                                onChange={(e) => setFormStatus(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                                            >
                                                <option value="확정">확정 (매출통계 반영)</option>
                                                <option value="대기">예약대기</option>
                                            </select>
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
                                            저장
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }