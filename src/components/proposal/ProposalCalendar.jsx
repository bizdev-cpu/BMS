import { useState } from 'react';

export default function ProposalCalendar({ items, formatKRW, onPick }) {
    const [cur, setCur] = useState(() => {
        const d = new Date();
        return {
            y: d.getFullYear(),
            m: d.getMonth(),
        };
    });

    const parseD = (s) => {
        const mm = String(s || '').match(/(\d{4})[.\-\s]+(\d{1,2})[.\-\s]+(\d{1,2})/);
        return mm ? new Date(+mm[1], +mm[2] - 1, +mm[3]) : null;
    };

    // 제안시기: yyyy-MM-dd 또는 yyyy-MM(→1일)
    const parseStart = (s) => {
        const f = parseD(s);
        if (f) return f;

        const mm = String(s || '').match(/(\d{4})[.\-\s]+(\d{1,2})/);
        return mm ? new Date(+mm[1], +mm[2] - 1, 1) : null;
    };

    const dayDiff = (a, b) => Math.round((a - b) / 86400000);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 등록→마감 / 마감→발표 구간 생성
    const segs = [];

    (items || []).forEach((p) => {
        const due = parseD(p.dueDate);

        if (!due) return;

        let start = parseStart(p.proposalPeriod) || today;

        if (start > due) start = due;

        segs.push({
            p,
            s: start,
            e: due,
            kind: '제안',
        });

        const pres = parseD(p.presentDate);

        if (pres && pres >= due) {
            segs.push({
                p,
                s: due,
                e: pres,
                kind: '발표',
            });
        }
    });

    // 6주 달력
    const firstOfMonth = new Date(cur.y, cur.m, 1);
    const gridStart = new Date(cur.y, cur.m, 1 - firstOfMonth.getDay());

    const weeks = [];

    for (let w = 0; w < 6; w++) {
        const row = [];

        for (let d = 0; d < 7; d++) {
            const dt = new Date(gridStart);
            dt.setDate(gridStart.getDate() + w * 7 + d);
            row.push(dt);
        }

        weeks.push(row);
    }

    const move = (delta) =>
        setCur((c) => {
            const nm = c.m + delta;

            return {
                y: c.y + Math.floor(nm / 12),
                m: ((nm % 12) + 12) % 12,
            };
        });

    const barsForWeek = (week) => {
        const ws = week[0];
        const we = week[6];

        const out = [];

        segs.forEach((sg) => {
            if (sg.e < ws || sg.s > we) return;

            const sCol = Math.max(0, dayDiff(sg.s, ws));
            const eCol = Math.min(6, dayDiff(sg.e, ws));

            out.push({
                sg,
                sCol,
                eCol,
                showLabel: sg.s >= ws && sg.s <= we,
            });
        });

        return out;
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <button
                    onClick={() => move(-1)}
                    className="rounded px-2 py-1 text-slate-500 hover:bg-slate-50"
                >
                    ‹
                </button>

                <span className="text-sm font-bold text-slate-700">
                    {cur.y}년 {cur.m + 1}월
                </span>

                <button
                    onClick={() => move(1)}
                    className="rounded px-2 py-1 text-slate-500 hover:bg-slate-50"
                >
                    ›
                </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-100 text-[11px]">
                <div className="grid grid-cols-7">
                    {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                        <div
                            key={w}
                            className={`border-b border-slate-100 bg-slate-50 py-1 text-center font-bold ${
                                i === 0
                                    ? 'text-rose-500'
                                    : i === 6
                                    ? 'text-blue-500'
                                    : 'text-slate-500'
                            }`}
                        >
                            {w}
                        </div>
                    ))}
                </div>

                {weeks.map((week, wi) => {
                    const bars = barsForWeek(week);

                    return (
                        <div
                            key={wi}
                            className="relative border-b border-slate-100 last:border-b-0"
                        >
                            <div className="grid grid-cols-7">
                                {week.map((dt, di) => {
                                    const inMonth = dt.getMonth() === cur.m;
                                    const isToday =
                                        dt.getTime() === today.getTime();

                                    return (
                                        <div
                                            key={di}
                                            className="h-6 border-r border-slate-50 px-1 text-right last:border-r-0"
                                        >
                                            <span
                                                className={
                                                    isToday
                                                        ? 'font-bold text-brand-600'
                                                        : inMonth
                                                        ? 'text-slate-400'
                                                        : 'text-slate-300'
                                                }
                                            >
                                                {dt.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-0.5 pb-1">
                                {bars.map((b, bi) => (
                                    <div
                                        key={bi}
                                        className="grid grid-cols-7"
                                    >
                                        <div
                                            onClick={() =>
                                                onPick?.(b.sg.p)
                                            }
                                            title={`${b.sg.p.name} · ${formatKRW(
                                                Number(b.sg.p.cost) || 0
                                            )}`}
                                            style={{
                                                gridColumn: `${b.sCol + 1} / ${
                                                    b.eCol + 2
                                                }`,
                                            }}
                                            className={`cursor-pointer truncate rounded px-1 py-0.5 text-white ${
                                                b.sg.kind === '제안'
                                                    ? 'bg-blue-500'
                                                    : 'bg-violet-500'
                                            }`}
                                        >
                                            {b.showLabel
                                                ? `${
                                                      b.sg.kind === '발표'
                                                          ? '🎤'
                                                          : '📄'
                                                  } ${b.sg.p.name} · ${formatKRW(
                                                      Number(b.sg.p.cost) || 0
                                                  )}`
                                                : '…'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                    등록→제출마감
                </span>

                <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-violet-500" />
                    제출→발표
                </span>
            </div>
        </div>
    );
}