import { useEffect, useState } from 'react';
import { splitKdtMonthly } from '../util/date';
import { readKdtChangeReport, createKdtSnapshot } from '../api/bmsApi';


function KdtSalesTooltip({
  month,
  type,
  items,
  formatKRW,
  colors,
}) {
  const services = ['딥다이브', '카테부', '케클업'];

  const total = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[210px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      {/* 제목 */}
      <p className="text-[11px] font-bold text-slate-700 mb-2">
        {month}월 ({type})
      </p>

      <div className="space-y-1.5">
        {services.map(service => {
          const serviceItems = items.filter(
            item => item.service === service
          );

          const amount = serviceItems.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          );

          const percent =
            total > 0 ? (amount / total) * 100 : 0;

          return (
            <div
              key={service}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{
                    backgroundColor:
                      colors[service] || '#f59e0b',
                  }}
                />

                <span className="text-[11px] font-semibold text-slate-600">
                  {service}
                </span>

                <span className="text-[10px] text-slate-400">
                  ({percent.toFixed(2)}%)
                </span>
              </div>

              <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                {formatKRW(amount)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">
          합계
        </span>

        <span className="text-[11px] font-black text-slate-900">
          {formatKRW(total)}
        </span>
      </div>
    </div>
  );
}

export default function KdtManagement({
  kdtMonthly,
  kdtSales = [],
  formatKRW,
}) {
  // 기존 KDT 월별 데이터
  const k = splitKdtMonthly(kdtMonthly);

  const rows = k.rows;
  const cats = k.categories || [];
  const curM = k.curM;

  const oldactualTotal = k.actualTotal;
  const oldexpectedTotal = k.expectedTotal;
  const oldgrandTotal = k.grandTotal;

  const maxAmt = rows.reduce(
    (m, r) => Math.max(m, r.amount),
    1
  );



  const KDT_COLORS = {
    딥다이브: '#2563eb', // 파랑
    카테부: '#f59e0b',   // 주황
    케클업: '#10b981',   // 초록
  };

  const hatch =
    'repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0, rgba(255,255,255,0.65) 3px, transparent 3px, transparent 7px)';
  

    // 새 KDT 매출 집계 데이터를 월별로 변환
    const salesRows = Array.from({ length: 12 }, (_, index) => {
    const month = `${index + 1}월`;

    const monthData = kdtSales.filter(
        item => item.month === month
    );

    const actualItems = monthData.filter(
        item => item.type === '실제'
    );

    const expectedOperatingItems = monthData.filter(
        item =>
        item.type === '예상' &&
        item.status === '운영 중'
    );

    const expectedScheduledItems = monthData.filter(
        item =>
        item.type === '예상' &&
        item.status === '운영 예정'
    );

    const actual = actualItems.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const expectedOperating = expectedOperatingItems.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const expectedScheduled = expectedScheduledItems.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    return {
        month: index + 1,
        actual,
        expectedOperating,
        expectedScheduled,

        actualItems,
        expectedOperatingItems,
        expectedScheduledItems,
    };
    });

    const salesMaxAmt = Math.max(
    ...salesRows.flatMap(row => [
        row.actual,
        row.expectedOperating + row.expectedScheduled,
    ]),
    1
    );

    const hasSalesData = kdtSales.length > 0;

    // 전체 실제 발생 매출
    const actualTotal = kdtSales
    .filter(item => item.type === '실제')
    .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    // 전체 예상 매출 - 운영 중
    const expectedOperatingTotal = kdtSales
    .filter(
        item =>
        item.type === '예상' &&
        item.status === '운영 중'
    )
    .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    // 전체 예상 매출 - 운영 예정
    const expectedScheduledTotal = kdtSales
    .filter(
        item =>
        item.type === '예상' &&
        item.status === '운영 예정'
    )
    .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    // 전체 예상 매출
    const expectedTotal =
    expectedOperatingTotal + expectedScheduledTotal;

    // 연간 합계
    const grandTotal =
    actualTotal + expectedTotal;

    const services = ['딥다이브', '카테부', '케클업'];

        const serviceSummary = services.map(service => {
        const serviceData = kdtSales.filter(
            item => item.service === service
        );

        const actualTotal = serviceData
            .filter(item => item.type === '실제')
            .reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
            );

        const expectedOperatingTotal = serviceData
            .filter(
                item =>
                item.type === '예상' &&
                item.status === '운영 중'
            )
            .reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            );

        const expectedScheduledTotal = serviceData
            .filter(
                item =>
                item.type === '예상' &&
                item.status === '운영 예정'
            )
            .reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            );

        const expectedTotal =
            expectedOperatingTotal + expectedScheduledTotal;


        return {
            name: service,
            actualTotal,
            expectedTotal,
            expectedOperatingTotal,
            expectedScheduledTotal,
            grandTotal: actualTotal + expectedTotal,
        };
        });

        const [hoveredBar, setHoveredBar] = useState(null);

            // 예상값 변동 추적 리포트
            const [kdtReport, setKdtReport] = useState(null);
            const [snapBusy, setSnapBusy] = useState(false);
            const [snapMsg, setSnapMsg] = useState('');

            const loadReport = async () => {
            try {
                const report = await readKdtChangeReport();
                setKdtReport(report);
            } catch (error) {
                console.error(
                'KDT 변동 리포트 조회 실패:',
                error,
                );

                setKdtReport({
                months: [],
                snapshotYms: [],
                });
            }
            };

            useEffect(() => {
            loadReport();
            }, []);

            const takeSnapshot = async () => {
            setSnapBusy(true);
            setSnapMsg('스냅샷 저장 중…');

            try {
                const result = await createKdtSnapshot();

                setSnapMsg(
                typeof result === 'string'
                    ? result
                    : '스냅샷 저장 완료',
                );

                await loadReport();
            } catch (error) {
                console.error(
                'KDT 스냅샷 저장 실패:',
                error,
                );

                setSnapMsg(
                `실패: ${
                    error instanceof Error
                    ? error.message
                    : '알 수 없는 오류'
                }`,
                );
            } finally {
                setSnapBusy(false);
            }
            };
            const realized = (kdtReport && kdtReport.months || []).filter(m => m && m.realizedDiff !== null && m.realizedDiff !== undefined && m.lastExpected && m.firstActual);
            const expChanges = (kdtReport && kdtReport.months || []).map(m => {
                const exp = ((m && m.series) || []).filter(s => s && s.kind === '예상' && typeof s.amt === 'number');
                return { month: m.month, exp };
            }).filter(m => m.exp.length >= 2); // 예상 스냅샷이 2회 이상이어야 변동 표시

            return (
                <div className="space-y-6 animate-fadeIn">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">부트캠프 관리</h2>
                        <p className="text-sm text-slate-500">딥다이브 · 카테부 · 케클업 분류별 월 매출 · 실제 발생 매출과 예상 매출(운영 중/운영 예정)을 구분하여 표시</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-center h-full">
                            <div className="text-xs font-bold text-slate-500">발생 매출 (현재까지)</div>
                            <div className="text-2xl font-black text-amber-600 mt-1">{formatKRW(actualTotal)}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="text-xs font-bold text-slate-500">
                                예상 매출
                            </div>

                            <div className="text-2xl font-black text-slate-900 mt-1">
                                {formatKRW(expectedTotal)}
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-[11px]">
                                <span className="text-slate-600">
                                운영 중{' '}
                                <strong className="text-slate-700">
                                    {formatKRW(expectedOperatingTotal)}
                                </strong>
                                </span>

                                <span className="text-slate-300">·</span>

                                <span className="text-slate-400">
                                운영 예정{' '}
                                <strong className="text-slate-500">
                                    {formatKRW(expectedScheduledTotal)}
                                </strong>
                                </span>
                            </div>
                            </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500">연간 합계 (발생 매출 + 예상 매출)</div>
                            <div className="text-2xl font-black text-slate-900 mt-1">{formatKRW(grandTotal)}</div>
                        </div>
                    </div>

                    {/* 분류별 요약 */}
                    {serviceSummary.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {serviceSummary.map(c => (
                        <div
                            key={c.name}
                            className="bg-white border border-slate-200 rounded-2xl p-5"
                        >
                            <div className="flex items-center gap-2 mb-1">
                            <span
                                className="w-3 h-3 rounded-sm"
                                style={{
                                backgroundColor:
                                    KDT_COLORS[c.name] || '#f59e0b',
                                }}
                            />
                            <span className="text-sm font-bold text-slate-700">
                                {c.name}
                            </span>
                            </div>

                            <div className="text-xl font-black text-slate-900">
                            {formatKRW(c.grandTotal)}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1">
                                발생 {formatKRW(c.actualTotal)}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1">
                                예상 {formatKRW(c.expectedTotal)}
                                <span className="text-slate-400 ml-1">
                                    (운영 중 {formatKRW(c.expectedOperatingTotal)}
                                    {' / '}
                                    운영 예정 {formatKRW(c.expectedScheduledTotal)})
                                </span>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <p className="text-sm font-bold text-slate-700">
                            월별 부트캠프 매출
                            </p>

                            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 flex-wrap">
                            <span className="flex items-center">
                                <span className="w-3 h-3 rounded-sm mr-1.5 bg-amber-500" />
                                실제 발생
                            </span>

                            <span className="flex items-center">
                                <span
                                className="w-3 h-3 rounded-sm mr-1.5 bg-amber-400"
                                style={{ backgroundImage: hatch }}
                                />
                                예상
                            </span>

                            <span className="text-slate-400">
                                예상: 운영 중 / 운영 예정 구분
                            </span>
                            </div>
                        </div>

                        {!hasSalesData ? (
                            <p className="text-sm text-slate-400 font-semibold py-8 text-center">
                            KDT 매출 집계 데이터를 읽지 못했습니다.
                            </p>
                        ) : (
                            <div className="space-y-5">
                            {salesRows.map(row => {
                                const expectedTotal =
                                row.expectedOperating +
                                row.expectedScheduled;

                                return (
                                <div
                                    key={row.month}
                                    className="flex items-start gap-3"
                                >
                                    {/* 월 */}
                                    <div className="w-10 shrink-0 pt-1 text-xs font-bold text-slate-600">
                                    {row.month}월
                                    </div>

                                    {/* 막대 영역 */}
                                    <div className="flex-grow space-y-2">
                                        <div
                                            className="flex items-center gap-2 relative"
                                            onMouseEnter={() =>
                                                setHoveredBar({
                                                month: row.month,
                                                type: '발생',
                                                })
                                            }
                                            onMouseLeave={() => setHoveredBar(null)}
                                            >
                                            <div className="w-10 shrink-0 text-[10px] font-semibold text-amber-600">
                                                발생
                                            </div>

                                            <div className="flex-grow h-6 bg-slate-100 rounded-md overflow-hidden flex">
                                                {row.actualItems.map((item, index) => {
                                                    if (item.amount <= 0) return null;

                                                    return (
                                                    <div
                                                        key={`${item.service}-${index}`}
                                                        className="h-full"
                                                        style={{
                                                        width: `${(item.amount / salesMaxAmt) * 100}%`,
                                                        backgroundColor:
                                                            KDT_COLORS[item.service] || '#f59e0b',
                                                        }}
                                                    />
                                                    );
                                                })}
                                            </div>

                                            <div className="w-28 shrink-0 text-right text-xs font-bold text-slate-700">
                                                {formatKRW(row.actual)}
                                            </div>

                                            {hoveredBar?.month === row.month &&
                                                hoveredBar?.type === '발생' && (
                                                <KdtSalesTooltip
                                                    month={row.month}
                                                    type="발생"
                                                    items={row.actualItems}
                                                    formatKRW={formatKRW}
                                                    colors={KDT_COLORS}
                                                />
                                                )}
                                            </div>

                                            {/* 예상 */}
                                            <div
                                                className="flex items-center gap-2 relative"
                                                onMouseEnter={() =>
                                                    setHoveredBar({
                                                        month: row.month,
                                                        type: '예상',
                                                    })
                                                }
                                                onMouseLeave={() => setHoveredBar(null)}
                                            >
                                                <div className="w-10 shrink-0 text-[10px] font-semibold text-slate-400">
                                                    예상
                                                </div>

                                                <div className="flex-grow h-6 bg-slate-100 rounded-md overflow-hidden flex">

                                                    {/* 운영 중 예상 */}
                                                    {row.expectedOperatingItems.map((item, index) => {
                                                        if (item.amount <= 0) return null;

                                                        return (
                                                            <div
                                                                key={`operating-${item.service}-${index}`}
                                                                className="h-full"
                                                                style={{
                                                                    width: `${(item.amount / salesMaxAmt) * 100}%`,
                                                                    backgroundColor:
                                                                        KDT_COLORS[item.service] || '#f59e0b',
                                                                    backgroundImage: hatch,
                                                                }}
                                                            />
                                                        );
                                                    })}

                                                    {/* 운영 예정 예상 */}
                                                    {row.expectedScheduledItems.map((item, index) => {
                                                        if (item.amount <= 0) return null;

                                                        return (
                                                            <div
                                                                key={`scheduled-${item.service}-${index}`}
                                                                className="h-full opacity-50"
                                                                style={{
                                                                    width: `${(item.amount / salesMaxAmt) * 100}%`,
                                                                    backgroundColor:
                                                                        KDT_COLORS[item.service] || '#f59e0b',
                                                                    backgroundImage: hatch,
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                <div className="w-28 shrink-0 text-right text-xs font-bold text-slate-500">
                                                    {formatKRW(expectedTotal)}
                                                </div>

                                                {hoveredBar?.month === row.month &&
                                                    hoveredBar?.type === '예상' && (
                                                        <KdtSalesTooltip
                                                            month={row.month}
                                                            type="예상"
                                                            items={[
                                                                ...row.expectedOperatingItems,
                                                                ...row.expectedScheduledItems,
                                                            ]}
                                                            formatKRW={formatKRW}
                                                            colors={KDT_COLORS}
                                                        />
                                                    )}
                                            </div>

                                    {/* 예상 상태 표시 */}
                                    {expectedTotal > 0 && (
                                        <div className="pl-12 flex gap-3 text-[10px] text-slate-400">
                                        {row.expectedOperating > 0 && (
                                            <span>
                                            운영 중 {formatKRW(row.expectedOperating)}
                                            </span>
                                        )}

                                        {row.expectedScheduled > 0 && (
                                            <span>
                                            운영 예정 {formatKRW(row.expectedScheduled)}
                                            </span>
                                        )}
                                        </div>
                                    )}
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">

                            {/* 서비스 색상 */}
                            {services.map(service => (
                                <div
                                key={service}
                                className="flex items-center gap-2"
                                >
                                <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{
                                    backgroundColor: KDT_COLORS[service],
                                    }}
                                />
                                <span>{service}</span>
                                </div>
                            ))}

                            <span className="text-slate-300">|</span>

                            {/* 매출 상태 */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-3 rounded-sm bg-slate-500" />
                                <span>실제 발생</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div
                                className="w-8 h-3 rounded-sm bg-slate-500"
                                style={{
                                    backgroundImage: hatch,
                                }}
                                />
                                <span>예상 · 운영 중</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div
                                className="w-8 h-3 rounded-sm bg-slate-500 opacity-40"
                                style={{
                                    backgroundImage: hatch,
                                }}
                                />
                                <span>예상 · 운영 예정</span>
                            </div>

                            <p className="w-full text-slate-400">
                                * 실제/예상 매출 데이터는 KDT 매출 집계 시트를 기준으로 표시합니다.
                            </p>
                            </div>
                    </div>
                    {/* 예상값 변동 추적 리포트 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                            <p className="text-sm font-bold text-slate-700">예상값 변동 추적 <span className="font-normal text-slate-400">(월 1회 스냅샷 기준)</span></p>
                            <div className="flex items-center gap-2">
                                {snapMsg && <span className="text-[11px] text-slate-500">{snapMsg}</span>}
                                <button onClick={takeSnapshot} disabled={snapBusy} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50">{snapBusy ? '저장 중…' : '📸 지금 스냅샷'}</button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">스냅샷: {(kdtReport && kdtReport.snapshotYms || []).join(' · ') || '아직 없음 — 먼저 스냅샷을 한 번 찍어주세요'}</p>

                        {(!kdtReport || !(kdtReport.snapshotYms || []).length) ? (
                            <p className="text-sm text-slate-400 font-semibold py-6 text-center">스냅샷이 없습니다. ‘지금 스냅샷’을 누르면 현재 KDT 값이 기록되고, 다음 달부터 변동을 비교합니다. (매월 1일 자동 저장을 켜려면 <code>setupKdtSnapshotTrigger</code> 1회 실행)</p>
                        ) : (
                            <div className="space-y-6">
                                {/* 예상 → 발생 차액 */}
                                <div>
                                    <p className="text-xs font-bold text-slate-600 mb-2">예상 → 발생 차액 <span className="font-normal text-slate-400">(마지막 예상 대비 실제 발생)</span></p>
                                    {realized.length === 0 ? (
                                        <p className="text-[12px] text-slate-400">아직 예상→발생으로 전환된 달이 없습니다.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead><tr className="text-slate-400 border-b border-slate-100">
                                                    <th className="text-left p-2">대상월</th><th className="text-right p-2">마지막 예상</th><th className="text-right p-2">발생</th><th className="text-right p-2">차액</th>
                                                </tr></thead>
                                                <tbody>
                                                    {realized.map(m => (
                                                        <tr key={m.month} className="border-b border-slate-50">
                                                            <td className="p-2 font-semibold text-slate-700">{m.month}월</td>
                                                            <td className="p-2 text-right text-slate-500">{formatKRW(m.lastExpected.amt)}</td>
                                                            <td className="p-2 text-right font-semibold text-slate-800">{formatKRW(m.firstActual.amt)}</td>
                                                            <td className={`p-2 text-right font-bold ${m.realizedDiff < 0 ? 'text-rose-600' : m.realizedDiff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{m.realizedDiff > 0 ? '+' : ''}{formatKRW(m.realizedDiff)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* 예상값 추이(스냅샷 간 변동) */}
                                <div>
                                    <p className="text-xs font-bold text-slate-600 mb-2">예상값 추이 <span className="font-normal text-slate-400">(스냅샷마다 예상이 어떻게 바뀌었는지 · 빨강=감소)</span></p>
                                    {expChanges.length === 0 ? (
                                        <p className="text-[12px] text-slate-400">예상 스냅샷이 2회 이상 쌓이면 변동이 표시됩니다.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {expChanges.map(m => (
                                                <div key={m.month} className="flex items-center gap-2 flex-wrap text-[12px]">
                                                    <span className="w-10 shrink-0 font-bold text-slate-700">{m.month}월</span>
                                                    {m.exp.map((s, idx) => {
                                                        const prev = idx > 0 ? m.exp[idx - 1].amt : null;
                                                        const delta = prev !== null ? s.amt - prev : null;
                                                        return (
                                                            <span key={s.ym} className="flex items-center gap-1">
                                                                {idx > 0 && <span className="text-slate-300">→</span>}
                                                                <span className="text-slate-400">{s.ym}</span>
                                                                <span className="font-semibold text-slate-700">{formatKRW(s.amt)}</span>
                                                                {delta !== null && delta !== 0 && (
                                                                    <span className={`font-bold ${delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>({delta > 0 ? '+' : ''}{formatKRW(delta)})</span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
