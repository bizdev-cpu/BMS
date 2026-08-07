import { useEffect, useState } from 'react';
import { getSheetConfig, saveSheetConfig } from '../api/bmsApi';
export default function Settings({ mode, setMode, apiUrl, setApiUrl, deletedHistory = [], loadData, }) {
            const [urlInput, setUrlInput] = useState(apiUrl);

            // 시트 이름 설정 (Script Properties)
            const [sheetCfg, setSheetCfg] = useState(null);
            const [sheetMsg, setSheetMsg] = useState('');
            useEffect(() => {
                let alive = true;

                async function loadSheetConfig() {
                    try {
                    const cfg = await getSheetConfig();

                    if (alive) {
                        setSheetCfg(cfg);
                    }
                    } catch (error) {
                    console.error(
                        '시트 설정 조회 실패:',
                        error,
                    );

                    if (alive) {
                        setSheetCfg({
                        projects: '전체 사업',
                        rentals: '대관사업',
                        kdt: 'KDT(AI캠퍼스제외)',
                        targets: '연도별목표',
                        deleted: '삭제 내역',
                        monitoring: '모니터링',
                        });

                        setSheetMsg(
                        '시트 설정을 불러오지 못했습니다.',
                        );
                    }
                    }
                }

                loadSheetConfig();

                return () => {
                    alive = false;
                };
            }, []);
            const saveSheetCfg = async () => {
                if (!sheetCfg) return;

                setSheetMsg('저장 중...');

                try {
                    await saveSheetConfig(sheetCfg);

                    setSheetMsg(
                    '저장되었습니다. 데이터를 다시 불러옵니다.',
                    );

                    await loadData();
                } catch (error) {
                    console.error(
                    '시트 설정 저장 실패:',
                    error,
                    );

                    setSheetMsg(
                    `저장 실패: ${
                        error instanceof Error
                        ? error.message
                        : '알 수 없는 오류'
                    }`,
                    );
                }
                };

            const handleSave = (e) => {
                e.preventDefault();
                setApiUrl(urlInput.trim());
                alert('연결 주소 설정이 완료되었습니다.');
            };

            const resetMockData = () => {
                if (confirm('로컬 데모 데이터를 기본 초기 데이터 상태로 리셋하시겠습니까?')) {
                    localStorage.removeItem('bms_mock_projects');
                    localStorage.removeItem('bms_mock_rentals');
                    localStorage.removeItem('bms_mock_kdt');
                    localStorage.removeItem('bms_mock_targets');
                    localStorage.removeItem('bms_mock_deleted');
                    loadData();
                }
            };

            return (
                <div className="space-y-6 animate-fadeIn">
                    
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">시스템 설정</h2>
                        <p className="text-sm text-slate-500">데이터베이스 연동 방식(구글 시트 API) 설정 및 감사 로그</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 연동 모드 설정 */}
                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">🔗 데이터 베이스 연동 방식</h3>
                                <p className="text-xs text-slate-400">구글 Apps Script 웹 앱 URL을 연동하여 실제 구글 시트를 DB로 사용합니다.</p>
                            </div>

                            <div className="flex items-center space-x-4 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                <button
                                    onClick={() => setMode('mock')}
                                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'mock' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Mock 로컬 데모 모드
                                </button>
                                <button
                                    onClick={() => setMode('api')}
                                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'api' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    구글 스프레드시트 API 연동 모드
                                </button>
                            </div>

                            {mode === 'api' ? (
                                <form onSubmit={handleSave} className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-xs text-slate-500 font-bold mb-2">Google Apps Script Web App URL</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://script.google.com/macros/s/.../exec"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                                            💡 Apps Script를 배포할 때 액세스 대상을 '모든 사람(Anyone)'으로 설정해야 웹 프론트엔드에서 정상적으로 통신할 수 있습니다.
                                        </p>
                                        <button
                                            type="submit"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs"
                                        >
                                            API 연동 저장
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-4">
                                    <div className="text-xs text-blue-700 leading-relaxed">
                                        현재 <strong>로컬 데모 모드</strong>로 구동 중입니다. 모든 데이터 추가, 수정, 삭제 내역은 사용 중이신 웹 브라우저의 <code>LocalStorage</code>에 실시간 기록되며, 실제 구글 시트에는 영향을 주지 않습니다.
                                    </div>
                                    <button
                                        onClick={resetMockData}
                                        className="bg-slate-50 hover:bg-white border border-slate-200 hover:text-rose-600 font-semibold px-4 py-2 rounded-lg text-xs text-slate-500 transition-colors"
                                    >
                                        초기 데모 데이터 리셋
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 연동 방법 안내 가이드 */}
                        <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6 space-y-4">
                            <h3 className="text-base font-bold text-slate-900">⚙️ 구글 스프레드시트 세팅 가이드</h3>
                            <div className="text-xs text-slate-500 space-y-3 leading-relaxed">
                                <p><strong>1단계 · 시트 생성:</strong> 스프레드시트에 아래 시트를 만듭니다. 이름이 다르면 위쪽 <strong>‘시트 이름’</strong> 설정에서 실제 이름으로 맞추면 됩니다(코드 수정 불필요).</p>
                                <ul className="list-disc list-inside pl-1 space-y-1 font-mono text-[11px] text-violet-600">
                                    <li>전체 사업 <span className="text-slate-400">(제안 사업)</span></li>
                                    <li>대관사업</li>
                                    <li>KDT(AI캠퍼스제외) <span className="text-slate-400">(KDT 월별 합계)</span></li>
                                    <li>연도별목표</li>
                                    <li>모니터링 <span className="text-slate-400">(제안 모니터링)</span></li>
                                    <li>삭제 내역</li>
                                </ul>
                                <p><strong>2단계 · 시트 구조:</strong></p>
                                <ul className="list-disc list-inside pl-1 space-y-1 text-[11px]">
                                    <li><strong>전체 사업</strong>: A~Q열. <code>N</code>=자료폴더 링크, <code>O</code>=제안 담당자(쉼표로 여러 명), <code>P</code>=수주업체, <code>Q</code>=참여업체(결과 후).</li>
                                    <li><strong>KDT(AI캠퍼스제외)</strong>: 분류(딥다이브·카테부·케클업)별 1월~12월 월 매출. (현재 월까지는 발생, 이후는 예상으로 자동 계산. 소수점 버림)</li>
                                    <li><strong>모니터링</strong>: 수집 시 헤더 자동 생성. <code>1차검토자·최종검토자</code> 열이 자동 추가됩니다.</li>
                                    <li><strong>연도별목표</strong>: 연도별 매출 목표액.</li>
                                </ul>
                                <p><strong>3단계 · 코드 등록:</strong> <code>확장 프로그램 &gt; Apps Script</code>에서 <code>Code.gs</code>, <code>Monitor.gs</code>, <code>LLM.gs</code>를 각각 붙여넣고, HTML 파일을 <code>index</code> 이름으로 추가해 <code>index.html</code> 내용을 붙여넣습니다.</p>
                                <p><strong>4단계 · 배포:</strong> <code>배포 &gt; 새 배포</code>에서 유형을 <strong>‘웹 앱(Web App)’</strong>, <strong>[액세스 권한]을 ‘모든 사람’</strong>으로 지정해 배포합니다.</p>
                                <p className="text-amber-600"><strong>참고:</strong> 화면(UI) 변경을 반영하려면 저장만으로는 부족하고 <strong>‘배포 관리 → 버전: 새 버전’</strong>으로 재배포해야 합니다. 백엔드(.gs)만 바꿨다면 저장으로 충분합니다. 모니터링 LLM 키·설정은 <strong>제안 모니터링 → 설정/ API 키</strong> 탭에서 입력합니다.</p>
                            </div>
                        </div>

                    </div>

                    {/* 시트 이름 설정 (연동 방식 아래) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-slate-900">시트 이름</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">각 탭이 데이터를 읽어오는 구글 시트 이름. 대소문자·공백·괄호까지 정확히 일치해야 합니다.</p>
                        </div>
                        {!sheetCfg ? (
                            <p className="text-sm text-slate-400 font-semibold py-4">불러오는 중…</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[['projects', '제안 사업 시트'], ['rentals', '대관사업 시트'], ['kdt', 'KDT 시트'], ['targets', '연도별목표 시트'], ['monitoring', '제안 모니터링 시트'], ['deleted', '삭제 내역 시트']].map(([k, label]) => (
                                    <div key={k}>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label>
                                        <input value={sheetCfg[k] || ''} onChange={(e) => setSheetCfg({ ...sheetCfg, [k]: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-4">
                            <button onClick={saveSheetCfg} disabled={!sheetCfg}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm">시트 이름 저장</button>
                            {sheetMsg && <span className="text-[11px] font-semibold text-amber-600">{sheetMsg}</span>}
                        </div>
                    </div>

                    {/* 안전 삭제 아카이브 로그 (삭제 내역 시트 미러링) */}
                    <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">🗑️ 안전 삭제 내역 아카이브 감사 로그</h3>
                            <p className="text-xs text-slate-400">실수로 데이터가 소실되는 것을 예방하기 위해, 데이터 삭제 요청 시 삭제 내역 시트에 백업된 내역 로그</p>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <th className="p-3 w-36">삭제 일시</th>
                                        <th className="p-3 w-28">원본 시트</th>
                                        <th className="p-3 w-48">식별값(사업명/ID)</th>
                                        <th className="p-3">삭제 데이터 요약 내용</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {deletedHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-6 text-center text-slate-400 font-semibold">아카이브된 삭제 로그가 없습니다.</td>
                                        </tr>
                                    ) : (
                                        deletedHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 text-slate-600">
                                                <td className="p-3 font-semibold text-slate-500">{item.deletedAt}</td>
                                                <td className="p-3">
                                                    <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {item.originalSheet}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold text-slate-700 max-w-xs truncate">{item.keyIdentifier}</td>
                                                <td className="p-3 text-slate-500">{item.summary}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            );
        }