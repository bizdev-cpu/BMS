import { cleanString } from './format';

export function parseDateString(str) {
    const cleaned = cleanString(str);
    if (!cleaned) return null;

    // 1) yyyy-mm-dd, yyyy.mm.dd, yyyy/mm/dd 포맷 매칭 (끝의 마침표 허용)
    const ymdMatch = cleaned.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
    if (ymdMatch) {
        const y = parseInt(ymdMatch[1], 10);
        const m = parseInt(ymdMatch[2], 10) - 1;
        const d = parseInt(ymdMatch[3], 10);
        const date = new Date(y, m, d);
        return isNaN(date.getTime()) ? null : date;
    }

    // 2) yyyy-mm, yyyy.mm, yyyy/mm 포맷 매칭 (끝의 마침표 허용)
    const ymMatch = cleaned.match(/^(\d{4})[.\-/](\d{1,2})\.?$/);
    if (ymMatch) {
        const y = parseInt(ymMatch[1], 10);
        const m = parseInt(ymMatch[2], 10) - 1;
        const date = new Date(y, m, 1);
        return isNaN(date.getTime()) ? null : date;
    }

    // 3) yyyy년mm월dd일 포맷 매칭
    const korYmdMatch = cleaned.match(/^(\d{4})년(\d{1,2})월(\d{1,2})일?$/);
        if (korYmdMatch) {
            const y = parseInt(korYmdMatch[1], 10);
            const m = parseInt(korYmdMatch[2], 10) - 1;
            const d = parseInt(korYmdMatch[3], 10);
            const date = new Date(y, m, d);
            return isNaN(date.getTime()) ? null : date;
        }

    // 4) yyyy년mm월 포맷 매칭
    const korYmMatch = cleaned.match(/^(\d{4})년(\d{1,2})월$/);
        if (korYmMatch) {
            const y = parseInt(korYmMatch[1], 10);
            const m = parseInt(korYmMatch[2], 10) - 1;
            const date = new Date(y, m, 1);
            return isNaN(date.getTime()) ? null : date;
        }

    // 5) yyyymmdd 8자리 포맷 매칭
    if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
        const y = parseInt(cleaned.substring(0, 4), 10);
        const m = parseInt(cleaned.substring(4, 6), 10) - 1;
        const d = parseInt(cleaned.substring(6, 8), 10);
        const date = new Date(y, m, d);
        return isNaN(date.getTime()) ? null : date;
    }

    return null;
}

    // 용역 기간 텍스트(Start ~ End) 분석
export function parsePeriodRange(rangeText) {
        if (!rangeText) return { start: null, end: null, isValid: false, durationMonths: 0 };
            
        // 물결 기호 및 대시 문자 표준화
        const normalized = rangeText.replace(/[∼～~]/g, '~');
        const parts = normalized.split('~');
        if (parts.length !== 2) return { start: null, end: null, isValid: false, durationMonths: 0 };
            
        const start = parseDateString(parts[0].trim());
        const end = parseDateString(parts[1].trim());
            
        if (start && end && start <= end) {
            // 개월 수 계산 (한 달 단위로 올림 계산)
            const yearDiff = end.getFullYear() - start.getFullYear();
            const monthDiff = end.getMonth() - start.getMonth();
            let months = yearDiff * 12 + monthDiff;
                
            // 시작일과 종료일 날짜 차이에 따른 일수 보정
            const dayDiff = end.getDate() - start.getDate();
            if (dayDiff >= 0) {
                months += 1; // 시작일 포함 월 계산
            } else {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                months = Math.max(1, Math.round(diffDays / 30.4));
            }
            return { start, end, isValid: true, durationMonths: Math.max(1, months) };
        }
            
        return { start: null, end: null, isValid: false, durationMonths: 0 };
    }

// 특정 날짜가 기간 범위 내에 포함되는지 확인
export function isDateInRange(date, start, end) {
    if (!date || !start || !end) return false;
    return date >= start && date <= end;
}

// 월별 매출 분할 금액 계산
export function getMonthlyAllocation(sales, durationMonths) {
        if (!sales || durationMonths <= 0) return 0;
        return Math.round(sales / durationMonths);
}

// KDT 월별 합계(신 구조)를 현재 월 기준으로 발생/예상 분할 (대시보드·KDT탭 공용)
export function splitKdtMonthly(kdtMonthly) {
        // 신규 구조: { total:[12], categories:[{name, monthly:[12]}] } / 구버전: [12] 배열
        const isObj = kdtMonthly && !Array.isArray(kdtMonthly) && typeof kdtMonthly === 'object';
        const totalArr = isObj ? (kdtMonthly.total || []) : (kdtMonthly || []);
        const cats = isObj ? (kdtMonthly.categories || []) : [];
        const monthly = Array.from({ length: 12 }, (_, i) => Math.floor(Number(totalArr[i]) || 0));
        const curM = new Date().getMonth(); // 0-based, 현재 월 포함하여 '발생'
        let actualTotal = 0, expectedTotal = 0;
        const rows = monthly.map((amount, i) => {
            const kind = i <= curM ? 'actual' : 'expected';
            if (kind === 'actual') actualTotal += amount; else expectedTotal += amount;
            return { month: i + 1, amount, kind };
        });
        // 분류별: 월배열 + 발생/예상 합계
        const categories = cats.map(c => {
            const m = Array.from({ length: 12 }, (_, i) => Math.floor(Number((c.monthly || [])[i]) || 0));
            let a = 0, e = 0;
            m.forEach((amt, i) => { if (i <= curM) a += amt; else e += amt; });
            return { name: c.name, monthly: m, actualTotal: a, expectedTotal: e, grandTotal: a + e };
        });

    return { monthly, rows, curM, actualTotal, expectedTotal, grandTotal: actualTotal + expectedTotal, categories };
}