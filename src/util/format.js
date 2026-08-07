
// 날짜 출력, 원화 출력, 차트 눈금 계산
export function cleanString(str) {
    if (!str) return '';
    return String(str).replace(/\s+/g, ''); // 모든 공백 제거
}

// 날짜 객체를 YYYY-MM-DD 스트링으로 포맷
export function formatDate(date) {
    if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
}

// 원화 포맷
export function formatKRW(val) {
    if (val === undefined || val === null || isNaN(val)) return '0원';
    return new Intl.NumberFormat('ko-KR').format(val) + '원';
}

// 축약 원화 포맷 (억/만 단위) — 차트 축 라벨용
export function formatKRWShort(val) {
    val = Number(val) || 0;
    const neg = val < 0;
    const a = Math.abs(val);
    let out;
    if (a >= 1e8) {
        const v = Math.round((a / 1e8) * 10) / 10; // 억, 소수 1자리
        out = v.toLocaleString('ko-KR') + '억';
    } else if (a >= 1e4) {
        out = Math.round(a / 1e4).toLocaleString('ko-KR') + '만';
    } else if (a === 0) {
        out = '0';
    } else {
        out = Math.round(a).toLocaleString('ko-KR');
    }
    return (neg ? '-' : '') + out + '원';
}

// 눈금용 '깔끔한' step 계산 ({1,2,5}×10^n)
export function niceStep(rough) {
    if (!rough || rough <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const f = rough / mag;
    let nf;
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
    return nf * mag;
}
