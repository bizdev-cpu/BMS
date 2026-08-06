// 정렬 가능한 테이블 헤더 셀 (클릭 시 정렬, 방향 화살표 표시)
export default function SortTh({ label, colKey, sort, className, align }) {
    const active = sort.sortKey === colKey;
    const arrow = active ? (sort.sortDir === 'asc' ? '▲' : '▼') : '↕';
    return (
        <th className={className}>
            <button
                type="button"
                onClick={() => sort.toggleSort(colKey)}
                className={`flex w-full items-center gap-1 font-bold hover:text-slate-900 transition-colors ${align === 'right' ? 'justify-end' : ''} ${active ? 'text-blue-700' : 'text-slate-500'}`}
            >
                <span>{label}</span>
                <span className={`text-[9px] leading-none ${active ? 'opacity-100' : 'opacity-40'}`}>{arrow}</span>
            </button>
        </th>
    );
}