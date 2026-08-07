import SortTh from '../SortTh';
import { applySort } from '../../util/sort';

export default function MonitoringList({
  items,
  sort,
  statusFilter,
  ALL_STATUSES,
  normStatus,
  toggleStatusFilter,
  bulkDownload,
  busy,
  setShowAdd,
  verdictBadge,
  verdictLabel,
  wonComma,
  taskLine,
  setSlideItem,
  statusColor,
  setStatus,
  copiedNo,
  copyCard,
  openEdit,
  startWork,
  exclude,
}) {
  const filtered = items.filter((r) =>
    statusFilter.includes(normStatus(r['상태'])),
  );

  const shown = applySort(
    filtered,
    sort.sortKey,
    sort.sortDir,
    {
      수집일: 'date',
      마감일: 'date',
      점수: 'number',
    },
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500">상태</span>

        {ALL_STATUSES.map((s) => {
          const on = statusFilter.includes(s);

          const cnt = items.filter(
            (r) => normStatus(r['상태']) === s,
          ).length;

          const onCls =
            s === '제외'
              ? 'bg-slate-500 text-white border-slate-500'
              : 'bg-brand-600 text-white border-brand-600';

          return (
            <button
              key={s}
              onClick={() => toggleStatusFilter(s)}
              className={`px-3 py-1 rounded-full font-bold border ${
                on
                  ? onCls
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {s === '1차 검토 완료' ? '조건 검토 완료' : s}{' '}
              <span className="opacity-70">{cnt}</span>
            </button>
          );
        })}

        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={bulkDownload}
            disabled={busy}
            className="px-3 py-1 rounded-lg font-bold border bg-slate-50 text-slate-600 border-slate-200 disabled:opacity-50"
          >
            ⬇ 공고 일괄 다운로드
          </button>

          <button
            onClick={() => setShowAdd((v) => !v)}
            className="px-3 py-1 rounded-lg font-bold border bg-brand-50 text-brand-600 border-brand-200"
          >
            ➕ 수기 추가
          </button>
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <SortTh label="수집일" colKey="수집일" sort={sort} className="p-3" />
                <SortTh label="소스" colKey="소스" sort={sort} className="p-3" />
                <SortTh label="판정" colKey="판정" sort={sort} className="p-3" />
                <SortTh label="사업명 / 발주처" colKey="사업명" sort={sort} className="p-3" />
                <SortTh label="마감" colKey="마감일" sort={sort} className="p-3" />
                <SortTh label="금액" colKey="예산" sort={sort} className="p-3 text-right" />
                <th className="p-3">요약/보고서</th>
                <th className="p-3">첨부</th>
                <SortTh label="상태" colKey="상태" sort={sort} className="p-3" />
                <th className="p-3">검토담당자</th>
                <th className="p-3 text-center">액션</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="p-8 text-center text-slate-400 font-semibold"
                  >
                    {items.length === 0
                      ? "수집된 공고가 없습니다. '지금 수집'을 눌러보세요."
                      : '선택한 상태에 해당하는 공고가 없습니다.'}
                  </td>
                </tr>
              ) : (
                shown.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 align-top">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {row['수집일']}
                    </td>

                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {row['소스']}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${verdictBadge(
                          row['판정'],
                        )}`}
                      >
                        {verdictLabel(row['판정'])}
                      </span>
                    </td>

                    <td className="p-3 max-w-xs">
                      <a
                        href={row['공고URL']}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-slate-900 hover:text-brand-600 line-clamp-2"
                      >
                        {row['사업명']}
                      </a>

                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {row['발주처']}
                      </div>
                    </td>

                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {row['마감일']}
                    </td>

                    <td className="p-3 text-right text-slate-700 font-semibold whitespace-nowrap">
                      {wonComma(row['예산']) || '-'}
                    </td>

                    <td
                      className="p-3 text-slate-600 max-w-[220px] cursor-pointer group transition-colors hover:bg-brand-50/60 rounded-lg"
                      onClick={() => setSlideItem(row)}
                      title="클릭하여 요약/보고서 보기"
                    >
                      <div className="line-clamp-3 group-hover:text-brand-700 group-hover:underline decoration-brand-300 underline-offset-2 transition-colors">
                        {taskLine(row) && (
                          <span className="text-[10px] font-bold text-brand-500 mr-1">
                            📄보고서
                          </span>
                        )}

                        {row['요약'] || (
                          <span className="text-slate-300 no-underline">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap space-x-1">
                      {normStatus(row['상태']) === '제외' ? (
                        <span className="text-slate-300">-</span>
                      ) : row['첨부폴더'] || row['PDF첨부'] ? (
                        <>
                          {row['첨부폴더'] && (
                            <a
                              href={row['첨부폴더']}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              폴더
                            </a>
                          )}

                          {row['PDF첨부'] && (
                            <a
                              href={row['PDF첨부']}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-600 underline"
                            >
                              PDF
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <select
                        value={normStatus(row['상태'])}
                        onChange={(e) => setStatus(row, e.target.value)}
                        className={`text-[11px] font-bold rounded-md border px-2 py-1 focus:outline-none cursor-pointer ${statusColor(
                          normStatus(row['상태']),
                        )}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s === '1차 검토 완료'
                              ? '조건 검토 완료'
                              : s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 whitespace-nowrap text-[10px]">
                      {(() => {
                        const chips = (txt) =>
                          String(txt || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);

                        const r1 = chips(row['1차검토자']);
                        const rf = chips(row['최종검토자']);

                        if (!r1.length && !rf.length) {
                          return (
                            <span className="text-slate-300">-</span>
                          );
                        }

                        return (
                          <div className="space-y-1">
                            {r1.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-slate-400 font-bold">
                                  1차
                                </span>

                                {r1.map((n, j) => (
                                  <span
                                    key={j}
                                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            )}

                            {rf.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-slate-400 font-bold">
                                  최종
                                </span>

                                {rf.map((n, j) => (
                                  <span
                                    key={j}
                                    className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => copyCard(row)}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            copiedNo === row['공고번호']
                              ? 'bg-emerald-500 text-white'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                          title="슬랙 카드 형식으로 복사"
                        >
                          {copiedNo === row['공고번호']
                            ? '✓ 복사됨'
                            : '📋 복사'}
                        </button>

                        <button
                          onClick={() => openEdit(row)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold"
                        >
                          ✎ 수정
                        </button>

                        {row['판정'] !== '작업 진행' ? (
                          <button
                            onClick={() => startWork(row)}
                            disabled={busy}
                            className="px-2 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            제안 등록
                          </button>
                        ) : (
                          <span className="text-[10px] text-blue-500 font-semibold self-center">
                            제안 등록됨
                          </span>
                        )}

                        {normStatus(row['상태']) !== '제외' && (
                          <button
                            onClick={() => exclude(row)}
                            disabled={busy}
                            className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            드랍
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}