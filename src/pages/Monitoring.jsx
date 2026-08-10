import { useEffect, useMemo, useState } from 'react';

import Icon from '../components/common/Icon';
import ProgressBoard from '../components/monitoring/ProgressBoard';
import MonitoringDashboard from '../components/monitoring/MonitoringDashboard';
import ReportView from '../components/report/ReportView';
import SortTh from '../components/SortTh';
import DataSourceManager from './DataSourceManager';
import {
  applySort,
  useSortable,
} from '../util/sort';

import {
  splitMemo,
  taskLine,
} from '../util/monitoring';

import MonitoringList from '../components/monitoring/MonitoringList';
import MonitoringConfig from '../components/monitoring/MonitoringConfig';
import { gasRun } from '../api/bmsApi';
import MonitoringSlidePanel from '../components/monitoring/MonitoringSlidePanel';

export default function Monitoring({
  formatKRW,
  loadData,
  mode,
  projects,
  executeAction,
}) {
  const hosted = mode === 'api';

  const [sub, setSub] = useState('progress');
  const [items, setItems] = useState([]);
  const sort = useSortable('수집일', 'desc');

  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [statusFilter, setStatusFilter] = useState([
    '사전규격',
    '공고예정(수기입력)',
    '공고 감지',
    '1차 검토 완료',
    '최종 검토 완료',
  ]);

  const [trigStatus, setTrigStatus] = useState(null);
  const [nextRunText, setNextRunText] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [showNextRun, setShowNextRun] = useState(false);

  const [llmStats, setLlmStats] = useState(null);
  const [editRow, setEditRow] = useState(null);

  const [dailyAgg, setDailyAgg] = useState(null);

  const [slideItem, setSlideItem] = useState(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenMsg, setRegenMsg] = useState('');

  const [copiedNo, setCopiedNo] = useState('');
  const [digestOn, setDigestOn] = useState(null);

  const regenReport = async () => {
    if (!slideItem) return;

    setRegenBusy(true);
    setRegenMsg('보고서 생성 중… (30초~1분 소요)');

    try {
      const r = await gasRun(
        'apiRegenReport',
        slideItem['공고번호'] || '',
        slideItem['사업명'] || '',
      );

      if (r && r.ok) {
        setRegenMsg('✅ ' + r.msg);

        const newMemo = r.memo || '';

        setItems((list) =>
          list.map((x) =>
            x['공고번호'] === slideItem['공고번호']
              ? { ...x, 메모: newMemo }
              : x,
          ),
        );

        setSlideItem((s) => ({
          ...s,
          메모: newMemo,
        }));
      } else {
        setRegenMsg(
          '❌ ' + ((r && r.msg) || '생성 실패'),
        );
      }
    } catch (e) {
      setRegenMsg(
        '❌ ' + ((e && e.message) || e),
      );
    }

    setRegenBusy(false);
  };

  const STATUSES = ['사전규격','공고예정(수기입력)','공고 감지','1차 검토 완료','최종 검토 완료',];

  const ALL_STATUSES = [
    ...STATUSES,
    '제외',
  ];

  const dashStats = useMemo(() => {
    if (dailyAgg && dailyAgg.rows) {
      const maxTotal = dailyAgg.rows.reduce(
        (m, r) => Math.max(m, r.total),
        1,
      );

      return {
        rows: dailyAgg.rows,
        total: dailyAgg.total,
        proposed: dailyAgg.proposed,
        rate: dailyAgg.rate,
        maxTotal,
      };
    }

    const map = {};

    items.forEach((r) => {
      const d =
        String(r['수집일'] || '').slice(0, 10) ||
        '(미상)';

      if (!map[d]) {
        map[d] = {
          date: d,
          total: 0,
          proposed: 0,
        };
      }

      map[d].total++;

      if (r['판정'] === '작업 진행') {
        map[d].proposed++;
      }
    });

    const rows = Object.values(map).sort(
      (a, b) =>
        String(b.date).localeCompare(
          String(a.date),
        ),
    );

    const total = items.length;

    const proposed = items.filter(
      (r) => r['판정'] === '작업 진행',
    ).length;

    const maxTotal = rows.reduce(
      (m, r) => Math.max(m, r.total),
      1,
    );

    return {
      rows,
      total,
      proposed,
      rate: total
        ? Math.round((proposed / total) * 100)
        : 0,
      maxTotal,
    };
  }, [items, dailyAgg]);

  const normStatus = (s) => {
    const v = (s || '').trim();

    if (
      STATUSES.includes(v) ||
      v === '제외'
    ) {
      return v;
    }

    if (v === '제외' || v === '드랍') {
      return '제외';
    }

    if (
      v === '검토완료' ||
      v === '작업중' ||
      v === '작업 중'
    ) {
      return '1차 검토 완료';
    }

    if (
      v === '신규' ||
      v === '검토전' ||
      v === ''
    ) {
      return '공고 감지';
    }

    if (v === '조건 부합') {
      return '공고 감지';
    }

    return v;
  };

  const toggleStatusFilter = (s) => {
    setStatusFilter((f) =>
      f.includes(s)
        ? f.filter((x) => x !== s)
        : [...f, s],
    );
  };

  const setStatus = async (row, status) => {
    try {
      await gasRun(
        'apiSetMonitorStatus',
        row['공고번호'],
        status,
      );

      setItems((prev) =>
        prev.map((r) =>
          r['공고번호'] === row['공고번호']
            ? { ...r, 상태: status }
            : r,
        ),
      );
    } catch (e) {
      setMsg(
        '상태 변경 실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  const reload = async () => {
    if (!hosted) return;

    setBusy(true);

    try {
      const list =
        await gasRun('apiReadMonitoring');

      const norm = (list || []).map((row) => {
        const o = { ...row };

        for (const k in o) {
          if (o[k] instanceof Date) {
            o[k] = o[k]
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
              .replace(/ 00:00$/, '');
          }
        }

        return o;
      });

      setItems(norm);
      setMsg(`목록 ${norm.length}건 로드됨`);

      try {
        setDailyAgg(
          await gasRun(
            'apiMonitoringDailyStats',
          ),
        );
      } catch {
        // 집계 실패 시 items 기반 계산 사용
      }
    } catch (e) {
      setMsg(
        '목록 로드 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const loadCfg = async () => {
    if (!hosted) return;

    try {
      setCfg(
        await gasRun(
          'apiGetMonitorConfig',
        ),
      );
    } catch (e) {
      setMsg(
        '설정 로드 실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  const loadTrig = async () => {
    if (!hosted) return;

    try {
      setTrigStatus(
        await gasRun(
          'apiGetMonitorTriggerStatus',
        ),
      );
    } catch {
      // 무시
    }
  };

  const loadLlmStats = async () => {
    if (!hosted) return;

    try {
      setLlmStats(
        await gasRun('apiGetLlmStats'),
      );
    } catch {
      // 무시
    }
  };

  const resetLlmStats = async () => {
    if (
      !confirm(
        'LLM 호출량 집계를 0으로 초기화할까요?',
      )
    ) {
      return;
    }

    try {
      setLlmStats(
        await gasRun(
          'apiResetLlmStats',
        ),
      );

      setMsg(
        '호출량 집계를 초기화했습니다.',
      );
    } catch (e) {
      setMsg(
        '초기화 실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  useEffect(() => {
    reload();
    loadCfg();
    loadTrig();
    loadLlmStats();
  }, []);

  const fmtRemain = (s) => {
    if (s == null) return '';

    const h = Math.floor(s / 3600);
    const m = Math.floor(
      (s % 3600) / 60,
    );
    const sec = s % 60;

    return `${h}시간 ${m}분 ${sec}초`;
  };

  const archiveExcluded = async () => {
    if (
      !confirm(
        "제외/드랍된 항목을 '모니터링 보관' 시트로 옮깁니다. (활성 목록이 가벼워져 로딩이 빨라집니다) 진행할까요?",
      )
    ) {
      return;
    }

    setBusy(true);
    setMsg('제외/드랍 항목 보관 중…');

    try {
      const r = await gasRun(
        'apiArchiveMonitoring',
      );

      setMsg(r || '보관 완료');

      await reload();
    } catch (e) {
      setMsg(
        '보관 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const checkNextRun = async () => {
    try {
      const st = await gasRun(
        'apiGetMonitorTriggerStatus',
      );

      setTrigStatus(st);

      setNextRunText(
        st.enabled
          ? `다음 수집까지 ${fmtRemain(
              st.secondsRemaining,
            )} (매일 ${st.hour}시)`
          : '트리거가 꺼져 있습니다. ⏰ 트리거를 먼저 켜주세요.',
      );
    } catch (e) {
      setNextRunText(
        '확인 실패: ' +
          ((e && e.message) || e),
      );
    }

    setShowNextRun(true);
  };

  const submitManual = async () => {
    if (!(form.name || '').trim()) {
      setMsg('사업명을 입력하세요.');
      return;
    }

    setBusy(true);

    try {
      const r = await gasRun(
        'apiAddManualMonitoring',
        form,
      );

      setMsg(
        (r && r.message) || '추가됨',
      );

      setShowAdd(false);
      setForm({});

      await reload();
    } catch (e) {
      setMsg(
        '추가 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const bulkDownload = async () => {
    const shown = items.filter((r) =>
      statusFilter.includes(
        normStatus(r['상태']),
      ),
    );

    const bidNos = shown
      .map((r) => r['공고번호'])
      .filter(Boolean);

    if (!bidNos.length) {
      setMsg(
        '필터에 걸린 사업이 없습니다.',
      );
      return;
    }

    setBusy(true);

    setMsg(
      `${bidNos.length}건의 공고 첨부를 압축 중… (잠시 걸릴 수 있어요)`,
    );

    try {
      const r = await gasRun(
        'apiBulkDownloadAttachments',
        bidNos,
      );

      if (r && r.url) {
        let m =
          `${r.fileCount}개 파일(${r.sizeMB}MB) 압축 완료. 다운로드를 시작합니다.`;

        if (r.skipped) {
          m += ` 용량 초과로 ${r.skipped}개 제외.`;
        }

        if (r.noAttach) {
          m += ` 첨부 없는 ${r.noAttach}건 제외.`;
        }

        setMsg(m);

        window.open(
          r.url,
          '_blank',
        );
      } else {
        setMsg(
          (r && r.message) ||
            '다운로드할 첨부가 없습니다.',
        );
      }
    } catch (e) {
      setMsg(
        '일괄 다운로드 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const runNow = async () => {
    setBusy(true);
    setMsg('수집 시작...');

    let polling = true;

    const poll = async () => {
      while (polling) {
        try {
          const p = await gasRun(
            'apiGetMonitorProgress',
          );

          if (
            polling &&
            p &&
            p.label
          ) {
            setMsg(
              `(${p.n}/${p.N}단계) ${p.pct}% · ${p.label}${
                p.detail
                  ? ' — ' + p.detail
                  : ''
              }`,
            );
          }
        } catch {
          // 폴링 실패 무시
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1200),
        );
      }
    };

    poll();

    try {
      const r = await gasRun(
        'apiRunMonitorNow',
      );

      polling = false;

      setMsg(r);

      await reload();
    } catch (e) {
      polling = false;

      setMsg(
        '실행 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const startWork = async (row) => {
    if (
      !confirm(
        `'${row['사업명']}' 건을 '전체 사업'에 제안 중으로 등록할까요?`,
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await gasRun(
        'apiStartWork',
        {
          name: row['사업명'],
          client: row['발주처'],
          bidNo: row['공고번호'],
          type: 'B2G',
          folderUrl:
            row['첨부폴더'] || '',
          budget: row['예산'] || '',
        },
      );

      window.__pendingCache = null;

      setMsg(
        '제안 중으로 등록되었습니다.',
      );

      await reload();
      await loadData();
    } catch (e) {
      setMsg(
        '등록 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const exclude = async (row) => {
    const reason = prompt(
      `'${row['사업명']}' 드랍 사유를 입력하세요`,
      '',
    );

    if (reason === null) return;

    setBusy(true);

    try {
      await gasRun(
        'apiDropMonitoring',
        row['공고번호'],
        reason,
      );

      setMsg(
        '드랍 처리되었습니다.',
      );

      await reload();
    } catch (e) {
      setMsg(
        '실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const ddayParts = (closeDt) => {
    const m = String(
      closeDt || '',
    ).match(
      /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/,
    );

    if (!m) {
      return {
        date: '',
        label: '',
      };
    }

    const d = new Date(
      +m[1],
      +m[2] - 1,
      +m[3],
    );

    const t = new Date();

    d.setHours(0, 0, 0, 0);
    t.setHours(0, 0, 0, 0);

    const n = Math.round(
      (d - t) / 86400000,
    );

    return {
      date: `${m[1]}-${(
        '0' + m[2]
      ).slice(-2)}-${(
        '0' + m[3]
      ).slice(-2)}`,

      label:
        n < 0
          ? '마감'
          : n === 0
            ? 'D-DAY'
            : `D-${n}`,
    };
  };

  const wonComma = (v) => {
    const n =
      typeof v === 'number'
        ? v
        : parseFloat(
            String(
              v == null ? '' : v,
            ).replace(/[^\d.-]/g, ''),
          );

    if (
      Number.isNaN(n) ||
      n <= 0
    ) {
      return '';
    }

    return (
      String(Math.round(n)).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ',',
      ) + '원'
    );
  };

  const reportToSlack = (row, r) => {
    if (!r) return '';

    const gradeEmoji =
      r.grade === '상'
        ? '🟢'
        : r.grade === '하'
          ? '🔴'
          : '🟡';

    const qualEmoji =
      r.qualification === '자격 충족'
        ? '✅'
        : r.qualification ===
            '자격 미달'
          ? '❌'
          : '⚠️';

    const lines = [];

    lines.push(
      '*' +
        (row['사업명'] ||
          r.taskSummary ||
          '') +
        '*',
    );

    lines.push('');

    lines.push(
      `${gradeEmoji} *종합 등급: ${
        r.grade || '-'
      }*   ${qualEmoji} *자격 판정: ${
        r.qualification || '-'
      }*`,
    );

    if (r.qualReason) {
      lines.push(
        '   ↳ ' + r.qualReason,
      );
    }

    lines.push('');
    lines.push('📋 *사업 개요*');

    if (r.agency) {
      lines.push(
        '  🏛 발주/수요: ' +
          r.agency,
      );
    }

    if (r.budget) {
      lines.push(
        '  💰 예산: ' + r.budget,
      );
    }

    if (r.period) {
      lines.push(
        '  📅 사업기간: ' +
          r.period,
      );
    }

    if (r.bidPeriod) {
      lines.push(
        '  ⏰ 투찰기간: ' +
          r.bidPeriod,
      );
    }

    if (r.bidNo) {
      lines.push(
        '  🔢 공고번호: ' +
          r.bidNo,
      );
    }

    lines.push('');
    lines.push('📝 *입찰 조건*');

    if (r.contractType) {
      lines.push(
        '  • 계약방법: ' +
          r.contractType,
      );
    }

    if (r.consortium) {
      lines.push(
        '  • 공동수급: ' +
          r.consortium,
      );
    }

    if (r.evalWeight) {
      lines.push(
        '  • 평가배점: ' +
          r.evalWeight,
      );
    }

    if (r.cutoff) {
      lines.push(
        '  • 과락기준: ' +
          r.cutoff,
      );
    }

    if (r.submitSpec) {
      lines.push(
        '  • 제출규격: ' +
          r.submitSpec,
      );
    }

    if (r.tasks?.length) {
      lines.push('');
      lines.push('🔧 *핵심 과업*');

      r.tasks.forEach((t) =>
        lines.push('  • ' + t),
      );
    }

    if (r.docs?.length) {
      lines.push('');
      lines.push(
        '📎 *자격 및 제출 서류*',
      );

      r.docs.forEach((d) =>
        lines.push('  • ' + d),
      );
    }

    if (r.pros?.length) {
      lines.push('');
      lines.push('👍 *긍정 요인*');

      r.pros.forEach((p) =>
        lines.push('  + ' + p),
      );
    }

    if (r.risks?.length) {
      lines.push('');
      lines.push('⚠️ *리스크*');

      r.risks.forEach((risk) =>
        lines.push('  - ' + risk),
      );
    }

    if (row['공고URL']) {
      lines.push('');
      lines.push(
        '🔗 공고 원문: ' +
          row['공고URL'],
      );
    }

    if (row['첨부폴더']) {
      lines.push(
        '📁 폴더: ' +
          row['첨부폴더'],
      );
    }

    return lines.join('\n');
  };

  const buildCardText = (row) => {
    const title =
      row['사업명'] || '(제목없음)';

    const spec =
      String(
        row['소스'] || '',
      ).includes('사전규격') ||
      String(
        row['상태'] || '',
      ).includes('사전규격');

    const org =
      row['수요기관'] &&
      String(
        row['수요기관'],
      ).trim()
        ? row['수요기관']
        : row['발주처'] || '';

    const {
      date,
      label,
    } = ddayParts(row['마감일']);

    const lines = [];

    lines.push(
      '*' +
        title +
        '*' +
        (spec
          ? '  📄 사전규격'
          : ''),
    );

    if (org) {
      lines.push('🏛 ' + org);
    }

    if (date) {
      lines.push(
        `📅 마감 ${date}${
          label
            ? ` (${label})`
            : ''
        }`,
      );
    } else {
      lines.push(
        '📅 마감일 미정' +
          (spec
            ? ' (사전규격)'
            : ''),
      );
    }

    const b = wonComma(row['예산']);

    if (b) {
      lines.push('💰 ' + b);
    }

    if (row['요약']) {
      lines.push(
        '📝 ' + row['요약'],
      );
    }

    if (row['공고URL']) {
      lines.push(
        '🔗 공고: ' +
          row['공고URL'],
      );
    }

    if (row['첨부폴더']) {
      lines.push(
        '📁 공고문 폴더: ' +
          row['첨부폴더'],
      );
    }

    return lines.join('\n');
  };

  const copyCard = async (row) => {
    const text = buildCardText(row);

    try {
      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(
          text,
        );
      } else {
        const ta =
          document.createElement(
            'textarea',
          );

        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';

        document.body.appendChild(ta);

        ta.select();
        document.execCommand('copy');

        document.body.removeChild(ta);
      }

      setCopiedNo(
        row['공고번호'],
      );

      setTimeout(
        () => setCopiedNo(''),
        1500,
      );
    } catch {
      window.prompt(
        '아래 내용을 복사하세요 (Ctrl/Cmd+C)',
        text,
      );
    }
  };

  const submitEdit = async () => {
    if (
      !editRow ||
      !(editRow.name || '').trim()
    ) {
      setMsg('사업명을 입력하세요.');
      return;
    }

    setBusy(true);

    try {
      await gasRun(
        'apiUpdateMonitoring',
        {
          bidNo: editRow.bidNo,
          name: editRow.name,
          client: editRow.client,
          demand: editRow.demand,
          closeDt: editRow.closeDt,
          budget: editRow.budget,
          summary: editRow.summary,
          url: editRow.url,
          solution: editRow.solution,
          reviewer1:
            editRow.reviewer1,
          reviewerFinal:
            editRow.reviewerFinal,
        },
      );

      setMsg('수정되었습니다.');
      setEditRow(null);

      await reload();
    } catch (e) {
      setMsg(
        '수정 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const openEdit = (row) =>
    setEditRow({
      bidNo: row['공고번호'],
      name: row['사업명'] || '',
      client: row['발주처'] || '',
      demand:
        row['수요기관'] || '',
      closeDt: row['마감일'] || '',
      budget: row['예산'] || '',
      summary: row['요약'] || '',
      url: row['공고URL'] || '',
      solution:
        row['매칭솔루션'] || '',
      reviewer1:
        row['1차검토자'] || '',
      reviewerFinal:
        row['최종검토자'] || '',
    });

  const saveCfg = async () => {
    setBusy(true);
    setMsg('저장 중...');

    try {
      const r = await gasRun(
        'apiSaveMonitorConfig',
        cfg,
      );

      setMsg(r);

      await loadCfg();
    } catch (e) {
      setMsg(
        '저장 실패: ' +
          ((e && e.message) || e),
      );
    }

    setBusy(false);
  };

  const trig = async (on) => {
    try {
      const r = await gasRun(
        on
          ? 'apiSetupMonitorTrigger'
          : 'apiRemoveMonitorTrigger',
      );

      setMsg(r);

      await loadTrig();

      if (!on) {
        setNextRunText('');
      }
    } catch (e) {
      setMsg(
        '실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  const loadDigest = async () => {
    try {
      const s = await gasRun(
        'apiGetDigestTriggerStatus',
      );

      setDigestOn(s);
    } catch {
      // 무시
    }
  };

  useEffect(() => {
    loadDigest();
  }, []);

  const digestTrig = async (on) => {
    try {
      const r = await gasRun(
        on
          ? 'apiSetupDigestTrigger'
          : 'apiRemoveDigestTrigger',
      );

      setMsg(r);

      await loadDigest();
    } catch (e) {
      setMsg(
        '실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  const digestNow = async () => {
    setMsg(
      '다이제스트 전송 중...',
    );

    try {
      const r = await gasRun(
        'apiSendDigestNow',
      );

      setMsg(r);
    } catch (e) {
      setMsg(
        '전송 실패: ' +
          ((e && e.message) || e),
      );
    }
  };

  const statusColor = (s) =>
    ({
      사전규격:
        'bg-violet-50 text-violet-700 border-violet-200',

      '공고예정(수기입력)':
        'bg-sky-50 text-sky-700 border-sky-200',

      '공고 감지':
        'bg-amber-50 text-amber-700 border-amber-200',

      '1차 검토 완료':
        'bg-blue-50 text-blue-700 border-blue-200',

      '최종 검토 완료':
        'bg-emerald-50 text-emerald-700 border-emerald-200',

      제외:
        'bg-slate-100 text-slate-400 border-slate-200',
    })[s] ||
    'bg-slate-50 text-slate-600 border-slate-200';

  const verdictBadge = (v) =>
    ({
      적합:
        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',

      애매:
        'bg-amber-500/10 text-amber-600 border-amber-500/20',

      검토필요:
        'bg-amber-500/10 text-amber-600 border-amber-500/20',

      '작업 진행':
        'bg-blue-500/10 text-blue-600 border-blue-500/20',

      드랍:
        'bg-rose-500/10 text-rose-600 border-rose-500/20',

      제외:
        'bg-slate-100 text-slate-500 border-slate-200',
    })[v] ||
    'bg-slate-100 text-slate-500';

  const verdictLabel = (v) =>
    v === '검토필요'
      ? '애매'
      : v;

  if (!hosted) {
    return (
      <div className="p-8 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl text-sm leading-relaxed">
        제안 모니터링은{' '}
        <strong>
          구글 시트 연동 모드
        </strong>
        에서만 동작합니다.
        배포된 웹앱(
        <code>/exec</code>) 주소로
        접속해 사용하세요. (Mock 데모
        모드에서는 비활성화됩니다.)
      </div>
    );
  }

  const field = (
    key,
    label,
    opt = {},
  ) => (
    <div>
      <label className="block text-xs text-slate-500 font-bold mb-1.5">
        {label}

        {opt.secret &&
          cfg[key + '_set'] && (
            <span className="ml-1 text-[10px] text-emerald-600">
              (설정됨)
            </span>
          )}
      </label>

      <input
        type={
          opt.secret
            ? 'password'
            : 'text'
        }
        placeholder={
          opt.ph ||
          (opt.secret &&
          cfg[key + '_set']
            ? '변경 시에만 입력'
            : '')
        }
        value={cfg[key] || ''}
        onChange={(e) =>
          setCfg({
            ...cfg,
            [key]: e.target.value,
          })
        }
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
      />
    </div>
  );

  const selectField = (
    key,
    label,
    options,
  ) => (
    <div>
      <label className="block text-xs text-slate-500 font-bold mb-1.5">
        {label}
      </label>

      <select
        value={
          cfg[key] ||
          options[0][0]
        }
        onChange={(e) =>
          setCfg({
            ...cfg,
            [key]: e.target.value,
          })
        }
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
      >
        {options.map(([v, l]) => (
          <option
            key={v}
            value={v}
          >
            {l}
          </option>
        ))}
      </select>
    </div>
  );

  const toggle = (
    key,
    label,
  ) => (
    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        checked={
          cfg[key] === 'true'
        }
        onChange={(e) =>
          setCfg({
            ...cfg,
            [key]: e.target.checked
              ? 'true'
              : 'false',
          })
        }
      />

      <span>{label}</span>
    </label>
  );

  const area = (
    key,
    label,
  ) => (
    <div>
      <label className="block text-xs text-slate-500 font-bold mb-1.5">
        {label}{' '}
        <span className="text-[10px] text-slate-400">
          (줄바꿈 또는 쉼표로 구분)
        </span>
      </label>

      <textarea
        rows="4"
        value={cfg[key] || ''}
        onChange={(e) =>
          setCfg({
            ...cfg,
            [key]: e.target.value,
          })
        }
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-6 animate-fadeIn">
        <MonitoringSlidePanel
            slideItem={slideItem}
            setSlideItem={setSlideItem}
            splitMemo={splitMemo}
            taskLine={taskLine}
            verdictLabel={verdictLabel}
            regenBusy={regenBusy}
            regenMsg={regenMsg}
            regenReport={regenReport}
            setRegenMsg={setRegenMsg}
            copiedNo={copiedNo}
            setCopiedNo={setCopiedNo}
            copyCard={copyCard}
            reportToSlack={reportToSlack}
            />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">제안 모니터링</h2>
                            <p className="text-sm text-slate-500">공공 입찰·지원사업 공고 자동 수집 및 AI 적합성 판정</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                {trigStatus && (
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${trigStatus.enabled ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        {trigStatus.enabled ? `● 트리거 ON (매일 ${trigStatus.hour}시)` : '○ 트리거 OFF'}
                                    </span>
                                )}
                                <button onClick={runNow} disabled={busy} className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-sm">▶ 지금 수집</button>
                                <button onClick={() => trig(true)} className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600">⏰ 트리거</button>
                                <button onClick={() => trig(false)} className="bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600">해제</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={checkNextRun} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600">⏱ 다음 수집 확인</button>
                                <button onClick={archiveExcluded} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600" title="제외/드랍 항목을 보관 시트로 이동(로딩 단축)">🗄 제외 보관</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 w-fit">
                        {[{ id: 'progress', l: '진행 중 건' }, { id: 'list', l: '수집 목록' }, { id: 'config', l: '설정 / API 키' }, { id: 'dash', l: '대시보드' }].map(t => (
                            <button key={t.id} onClick={() => setSub(t.id)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md ${sub === t.id ? 'bg-brand-600 text-white shadow' : 'text-slate-500'}`}>{t.l}</button>
                        ))}
                    </div>

                    {msg && <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{msg}</div>}

                    {sub === 'progress' && (
                        <ProgressBoard projects={projects} formatKRW={formatKRW} loadData={loadData} executeAction={executeAction} embedded={true} />
                    )}

                    {sub === 'list' && (
                        <MonitoringList
                            items={items}
                            sort={sort}
                            statusFilter={statusFilter}
                            ALL_STATUSES={ALL_STATUSES}
                            normStatus={normStatus}
                            toggleStatusFilter={toggleStatusFilter}
                            bulkDownload={bulkDownload}
                            busy={busy}
                            setShowAdd={setShowAdd}
                            verdictBadge={verdictBadge}
                            verdictLabel={verdictLabel}
                            wonComma={wonComma}
                            taskLine={taskLine}
                            setSlideItem={setSlideItem}
                            statusColor={statusColor}
                            setStatus={setStatus}
                            copiedNo={copiedNo}
                            copyCard={copyCard}
                            openEdit={openEdit}
                            startWork={startWork}
                            exclude={exclude}
                        />
                        )}

                    {showAdd && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowAdd(false); setForm({}); }}>
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">수기로 찾은 사업 추가</h3>
                                    <button onClick={() => { setShowAdd(false); setForm({}); }} className="text-slate-500 hover:text-slate-900"><Icon name="close" className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[['name', '사업명 *'], ['client', '발주처'], ['demand', '수요기관'], ['closeDt', '마감일 (예: 2026-07-01)'], ['budget', '예산'], ['url', '공고 URL'], ['source', '출처 (기본: 수기)']].map(([k, ph]) => (
                                            <input key={k} placeholder={ph} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                        ))}
                                    </div>
                                    <textarea rows="2" placeholder="요약 / 메모" value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                    <div className="flex items-center gap-2 pt-1">
                                        <select value={form.verdict || '애매'} onChange={(e) => setForm({ ...form, verdict: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">
                                            <option value="애매">애매</option>
                                            <option value="적합">적합</option>
                                        </select>
                                        <button onClick={submitManual} disabled={busy} className="ml-auto bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm">저장</button>
                                        <button onClick={() => { setShowAdd(false); setForm({}); }} className="bg-slate-100 text-slate-500 font-bold px-4 py-2 rounded-lg text-sm">취소</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {editRow && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditRow(null)}>
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">모니터링 내용 수정</h3>
                                    <button onClick={() => setEditRow(null)} className="text-slate-500 hover:text-slate-900"><Icon name="close" className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[['name', '사업명 *'], ['client', '발주처'], ['demand', '수요기관'], ['closeDt', '마감일'], ['budget', '예산'], ['url', '공고 URL'], ['solution', '매칭 솔루션']].map(([k, ph]) => (
                                            <input key={k} placeholder={ph} value={editRow[k] || ''} onChange={(e) => setEditRow({ ...editRow, [k]: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                        ))}
                                    </div>
                                    <textarea rows="3" placeholder="요약" value={editRow.summary || ''} onChange={(e) => setEditRow({ ...editRow, summary: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] text-slate-500 font-bold mb-1">조건 검토담당자 <span className="font-normal text-slate-400">(여러 명은 쉼표로)</span></label>
                                            <input placeholder="예: 김OO, 이OO" value={editRow.reviewer1 || ''} onChange={(e) => setEditRow({ ...editRow, reviewer1: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-slate-500 font-bold mb-1">최종 검토담당자 <span className="font-normal text-slate-400">(여러 명은 쉼표로)</span></label>
                                            <input placeholder="예: 박OO" value={editRow.reviewerFinal || ''} onChange={(e) => setEditRow({ ...editRow, reviewerFinal: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <button onClick={submitEdit} disabled={busy} className="ml-auto bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm">저장</button>
                                        <button onClick={() => setEditRow(null)} className="bg-slate-100 text-slate-500 font-bold px-4 py-2 rounded-lg text-sm">취소</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showNextRun && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowNextRun(false)}>
                            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">⏱ 다음 자동 수집</h3>
                                    <button onClick={() => setShowNextRun(false)} className="text-slate-500 hover:text-slate-900"><Icon name="close" className="w-5 h-5" /></button>
                                </div>
                                <div className="p-8 text-center">
                                    {trigStatus && trigStatus.enabled
                                        ? <div className="space-y-2">
                                            <div className="text-2xl font-black text-brand-600 tracking-tight">{fmtRemain(trigStatus.secondsRemaining)}</div>
                                            <div className="text-xs font-bold text-slate-500">남음 · 매일 {trigStatus.hour}시 자동 수집</div>
                                        </div>
                                        : <div className="text-sm font-bold text-slate-600">{nextRunText || '트리거가 꺼져 있습니다.'}</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {sub === 'config' && cfg && (
                        <MonitoringConfig
                            cfg={cfg}
                            busy={busy}
                            llmStats={llmStats}
                            digestOn={digestOn}

                            field={field}
                            area={area}
                            toggle={toggle}
                            selectField={selectField}

                            loadLlmStats={loadLlmStats}
                            resetLlmStats={resetLlmStats}

                            digestTrig={digestTrig}
                            digestNow={digestNow}

                            saveCfg={saveCfg}
                        />
                        )}

                    {sub === 'dash' && (
                        <MonitoringDashboard
                            dashStats={dashStats}
                        />
                    )}
                </div>
    </div>
  );
}