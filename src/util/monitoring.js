const AI_MARK = '<<<AI_REPORT>>>';

export const splitMemo = (raw) => {
  const s = String(raw || '');

  const i = s.indexOf(AI_MARK);

  if (i === -1) {
    return {
      human: s.trim(),
      reportRaw: '',
      report: null,
    };
  }

  const human = s.slice(0, i).replace(/\s+$/, '');

  const reportRaw = s.slice(i + AI_MARK.length);

  let report = null;

  try {
    report = JSON.parse(reportRaw);
  } catch (e) {}

  return {
    human,
    reportRaw,
    report,
  };
};

export const joinMemo = (human, reportRaw) => {
  return reportRaw
    ? (human ? human + '\n' : '') + AI_MARK + reportRaw
    : human || '';
};

export const taskLine = (m) => {
  const r = splitMemo(m['메모']).report;

  return r && r.taskSummary ? r.taskSummary : '';
};