import { useState } from 'react';

// 정렬 상태 관리
export function useSortable(initialKey, initialDir = 'asc') {
    const [sortKey, setSortKey] = useState(initialKey || null);
    const [sortDir, setSortDir] = useState(initialDir);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return {
        sortKey,
        sortDir,
        toggleSort,
    };
}

// 실제 정렬 수행
export function applySort(rows, sortKey, sortDir, typeMap) {
    if (!sortKey) return rows;

    const type = (typeMap && typeMap[sortKey]) || 'string';
    const dir = sortDir === 'desc' ? -1 : 1;

    const arr = rows.slice();

    arr.sort((a, b) => {
        let va = a[sortKey];
        let vb = b[sortKey];

        if (type === 'number') {
            return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
        }

        va = String(va == null ? '' : va);
        vb = String(vb == null ? '' : vb);

        if (type === 'date') {
            // yyyy-mm-dd 문자열 비교
            return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
        }

        return va.localeCompare(vb, 'ko') * dir;
    });

    return arr;
}