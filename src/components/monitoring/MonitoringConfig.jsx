import React from 'react';

export default function MonitoringConfig({
  cfg,
  busy,
  llmStats,
  digestOn,

  field,
  area,
  toggle,
  selectField,

  loadLlmStats,
  resetLlmStats,

  digestTrig,
  digestNow,

  saveCfg,
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {field('DATA_GO_KR_KEY', '나라장터 인증키(Decoding)', { secret: true })}
                                {field('BIZINFO_KEY', '기업마당 키', { secret: true })}
                                {field('REVIEW_FOLDER_ID', '공고문 저장 폴더 URL (공유 드라이브 가능)', { ph: '공유 드라이브 폴더 URL 붙여넣기 · 비우면 시트와 같은 폴더에 자동 생성' })}
                                {field('REVIEW_FOLDER_NAME', '폴더명(위 URL 비울 때만 사용)')}
                                {field('LOOKBACK_HOURS', '수집 기간(시간)', { ph: '48=2일 · 168=1주 · 720=한 달' })}
                                {field('NOTIFY_VERDICTS', '기록할 판정(쉼표)')}
                                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                                    {selectField('LLM_PROVIDER', 'LLM 판정 엔진', [['gemini', 'Gemini'], ['anthropic', 'Anthropic (Claude)'], ['openai', 'OpenAI (ChatGPT)']])}
                                </div>
                                {(() => {
                                    const prov = cfg.LLM_PROVIDER || 'gemini';
                                    const kf = prov === 'anthropic' ? 'ANTHROPIC_API_KEY' : prov === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
                                    const mf = prov === 'anthropic' ? 'ANTHROPIC_MODEL' : prov === 'openai' ? 'OPENAI_MODEL' : 'GEMINI_MODEL';
                                    const mph = prov === 'anthropic' ? 'claude-3-5-haiku-latest' : prov === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash';
                                    const lbl = prov === 'anthropic' ? 'Anthropic' : prov === 'openai' ? 'OpenAI' : 'Gemini';
                                    return (<React.Fragment>
                                        {field(kf, lbl + ' API Key', { secret: true })}
                                        {field(mf, lbl + ' 모델', { ph: mph })}
                                    </React.Fragment>);
                                })()}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-slate-500">LLM 호출량{llmStats && llmStats.since ? ` · 집계 시작 ${llmStats.since}` : ''}</p>
                                    <div className="flex gap-2">
                                        <button onClick={loadLlmStats} className="text-[11px] font-bold text-slate-500 border border-slate-200 rounded px-2 py-1">새로고침</button>
                                        <button onClick={resetLlmStats} className="text-[11px] font-bold text-rose-500 border border-rose-200 rounded px-2 py-1">초기화</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[['gemini', 'Gemini'], ['anthropic', 'Anthropic'], ['openai', 'OpenAI']].map(([k, l]) => {
                                        const active = (cfg.LLM_PROVIDER || 'gemini') === k;
                                        return (
                                            <div key={k} className={`rounded-lg p-3 text-center border ${active ? 'bg-brand-50 border-brand-200' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="text-[11px] font-bold text-slate-500">{l}{active ? ' ●' : ''}</div>
                                                <div className="text-xl font-black text-slate-900">{llmStats ? (llmStats.calls[k] || 0) : 0}<span className="text-xs font-bold text-slate-400">회</span></div>
                                                {llmStats && llmStats.errors[k] > 0 && <div className="text-[10px] text-rose-500 font-semibold">오류 {llmStats.errors[k]}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-slate-500 mb-2">선택 연동 (HWP 변환 · Slack)</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {field('CONVERT_API_URL', 'HWP 변환 서비스 URL')}
                                    {field('CONVERT_API_KEY', '변환 서비스 키', { secret: true })}
                                    {field('SLACK_WEBHOOK_URL', 'Slack Webhook', { secret: true })}
                                    {field('SLACK_DIGEST_HOUR', 'Slack 다이제스트 시각 (시, 0~23)')}
                                    {field('DIGEST_DAYS', '포함 기간 (일, 1=오늘만)')}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2">매일 지정 시각에 ‘오늘 수집된 적합·애매’ 공고를 한 건의 다이제스트로 슬랙에 보냅니다.</p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {digestOn && (
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${digestOn.enabled ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            {digestOn.enabled ? `📨 자동 발송 ON (매일 ${digestOn.hour}시)` : '📨 자동 발송 OFF'}
                                        </span>
                                    )}
                                    <button type="button" onClick={() => digestTrig(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold">📨 매일 발송 켜기</button>
                                    <button type="button" onClick={() => digestTrig(false)} className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-600">끄기</button>
                                    <button type="button" onClick={digestNow} className="bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold">▶ 지금 보내기(테스트)</button>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                    <p className="text-[11px] text-slate-500 mb-2"><strong>실시간 개별 알림</strong>(선택): 위 다이제스트와 <strong>별개</strong>로, 공고가 <strong>수집될 때마다 건별로 즉시</strong> 슬랙에 보냅니다. 채널이 도배될 수 있어 보통은 꺼둡니다. (다이제스트만 쓰면 OFF 권장)</p>
                                    <div className="w-fit">{toggle('ENABLE_SLACK_REALTIME', 'Slack 실시간 개별알림 (수집 즉시·건별)')}</div>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-slate-500 mb-2">수집 소스 / 옵션</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {toggle('ENABLE_NARA', '나라장터(용역)')}
                                    {toggle('ENABLE_HRCSP', '나라장터(사전규격)')}
                                    {toggle('ENABLE_BIZINFO', '기업마당')}
                                    {toggle('ENABLE_CRAWL', '사이트 크롤(창의재단 등)')}
                                    {toggle('ENABLE_ATTACH', '첨부 저장')}
                                    {toggle('SAVE_PDF', 'PDF 변환본')}
                                    {toggle('ENABLE_AWARD', '낙찰 자동확인')}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                                {area('KEYWORDS', '키워드')}
                                {area('WATCHLIST', '발주처 워치리스트')}
                                {area('EXCLUDE', '제외 신호')}
                                {area('CRAWL_SOURCES', '크롤 사이트 (이름|URL, 한 줄에 하나)')}
                                {area('SECTION_ANCHORS', '섹션 앵커 (핵심 명사 — 본문에서 이 단어가 든 제목 줄만 추출)')}
                            </div>
                            <div className="flex justify-end">
                                <button onClick={saveCfg} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm">설정 저장</button>
                            </div>
                        </div>
    );
}