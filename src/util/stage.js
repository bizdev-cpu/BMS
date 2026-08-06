export function normalizeStage(raw) {
    const s = String(raw || '').replace(/\s+/g, '');
    if (!s) return '';
    if (s.indexOf('실주') >= 0) return '실주';
    if (s.indexOf('수주') >= 0) return '수주';
    if (s.indexOf('중단') >= 0) return '중단';
    if (s.indexOf('결과') >= 0 || s.indexOf('대기') >= 0) return '결과 대기 중';
    if (s.indexOf('제안') >= 0) return '제안 중';
    if (s.indexOf('작업') >= 0) return '제안 중'; // 레거시 '작업 중' → '제안 중'
    if (s.indexOf('검토') >= 0) return '검토 중';
    return s; // 알 수 없는 값은 원문 유지
}