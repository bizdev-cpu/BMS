export default function ReportView({ r }) {
    if (!r) return null;

    const gradeColor =
        r.grade === '상'
            ? 'text-emerald-600'
            : r.grade === '하'
            ? 'text-rose-600'
            : 'text-amber-600';

    const qualColor =
        r.qualification === '자격 충족'
            ? 'text-emerald-600'
            : r.qualification === '자격 미달'
            ? 'text-rose-600'
            : 'text-amber-600';

    const Row = ({ k, v }) =>
        v ? (
            <div className="flex gap-2 text-[13px]">
                <span className="w-20 shrink-0 text-slate-400">{k}</span>
                <span className="text-slate-700">{v}</span>
            </div>
        ) : null;

    const List = ({ title, items, mark }) =>
        items && items.length ? (
            <div>
                <p className="mb-1 text-xs font-bold text-slate-500">{title}</p>

                <ul className="space-y-0.5">
                    {items.map((x, i) => (
                        <li
                            key={i}
                            className="flex gap-1.5 text-[13px] text-slate-700"
                        >
                            <span className="text-slate-300">{mark}</span>
                            <span>{x}</span>
                        </li>
                    ))}
                </ul>
            </div>
        ) : null;

    return (
        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold">
                    종합등급{' '}
                    <span className={gradeColor}>{r.grade || '-'}</span>
                </span>

                <span className="text-sm font-bold">
                    🚨 자격판정{' '}
                    <span className={qualColor}>
                        {r.qualification || '-'}
                    </span>
                </span>
            </div>

            {r.qualReason && (
                <p className="text-[12px] text-rose-600">
                    · {r.qualReason}
                </p>
            )}

            <div className="space-y-0.5 border-t border-slate-200 pt-2">
                <Row k="공고번호" v={r.bidNo} />
                <Row k="발주/수요" v={r.agency} />
                <Row k="예산" v={r.budget} />
                <Row k="사업기간" v={r.period} />
                <Row k="투찰기간" v={r.bidPeriod} />
            </div>

            <div className="space-y-0.5 border-t border-slate-200 pt-2">
                <Row k="계약방법" v={r.contractType} />
                <Row k="공동수급" v={r.consortium} />
                <Row k="평가배점" v={r.evalWeight} />
                <Row k="과락" v={r.cutoff} />
                <Row k="제출규격" v={r.submitSpec} />
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-2">
                <List title="핵심 과업" items={r.tasks} mark="•" />
                <List title="자격·제출 서류" items={r.docs} mark="•" />
                <List title="👍 긍정 요인" items={r.pros} mark="+" />
                <List title="⚠️ 리스크" items={r.risks} mark="-" />
            </div>
        </div>
    );
}