import { useEffect, useState } from 'react';

import { gasRun } from '../api/bmsApi';
export default function DataSourceManager({sheetsAccessToken, }) {
  const [sources, setSources] = useState([]);

  const [name, setName] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

  const [testResult, setTestResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSources = async () => {
    try {
      const result = await gasRun('apiGetDataSources');

      setSources(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error(e);
      setMessage('데이터 소스 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleTest = async () => {
    if (!spreadsheetUrl.trim()) {
      setMessage('Spreadsheet URL을 입력해주세요.');
      return;
    }

    if (!sheetsAccessToken) {
      setMessage('Google Sheets 권한 정보가 없습니다.');
      return;
    }

    setLoading(true);
    setMessage('');
    setTestResult(null);

    try {
      // 1. URL에서 spreadsheetId 추출
      const match = spreadsheetUrl.match(
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      );

      if (!match) {
        setMessage('올바른 Google Spreadsheet URL이 아닙니다.');
        return;
      }

      const spreadsheetId = match[1];

      // 2. 현재 로그인 사용자의 권한으로 Google Sheets API 호출
      const permissionResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`,
        {
          headers: {
            Authorization: `Bearer ${sheetsAccessToken}`,
          },
        },
      );

      // 3. 읽을 수 없는 시트라면 여기서 중단
      if (!permissionResponse.ok) {
        if (
          permissionResponse.status === 403 ||
          permissionResponse.status === 404
        ) {
          setMessage(
            '현재 로그인한 Google 계정으로 접근할 수 없는 Spreadsheet입니다.',
          );
          return;
        }

        if (permissionResponse.status === 401) {
          setMessage(
            'Google 인증이 만료되었습니다. 다시 로그인해주세요.',
          );
          return;
        }

        setMessage(
          'Spreadsheet 접근 권한을 확인하지 못했습니다.',
        );
        return;
      }

      // 4. 사용자 권한 확인 성공
      // 그 다음 기존 Apps Script 데이터 소스 검사 실행
      const result = await gasRun(
        'apiTestDataSource',
        spreadsheetUrl,
      );

      setTestResult(result);

      if (!result.ok) {
        setMessage(result.message);
      }
    } catch (e) {
      console.error(e);

      setMessage(
        e?.message ||
          'Spreadsheet 연결 확인에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('부서명을 입력해주세요.');
      return;
    }

    if (!spreadsheetUrl.trim()) {
      setMessage('Spreadsheet URL을 입력해주세요.');
      return;
    }

    if (!testResult?.ok) {
      setMessage('먼저 Spreadsheet 연결 확인을 해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await gasRun('apiSaveDataSource', {
        name: name.trim(),
        spreadsheetUrlOrId: spreadsheetUrl.trim(),
      });

      setName('');
      setSpreadsheetUrl('');
      setTestResult(null);

      setMessage('데이터 소스가 등록되었습니다.');

      await loadSources();
    } catch (e) {
      console.error(e);
      setMessage(
        e?.message || '데이터 소스 등록에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (source) => {
  const confirmed = window.confirm(
    `'${source.name}' 데이터 소스 연결을 삭제하시겠습니까?\n\n원본 Google Spreadsheet는 삭제되지 않습니다.`,
  );

  if (!confirmed) return;

  setLoading(true);
  setMessage('');

  try {
    await gasRun('apiDeleteDataSource', source.id);

    setMessage(`'${source.name}' 데이터 소스가 삭제되었습니다.`);

    await loadSources();
  } catch (e) {
    console.error(e);
    setMessage(
      e?.message || '데이터 소스 삭제에 실패했습니다.',
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          데이터 소스 관리
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          새로운 부서의 Google Spreadsheet를 BMS에 연결합니다.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">
          새 데이터 소스 등록
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              부서명
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 교육사업부"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Google Spreadsheet URL
            </label>

            <input
              value={spreadsheetUrl}
              onChange={(e) => {
                setSpreadsheetUrl(e.target.value);

                // URL을 바꿨으면 이전 연결 성공 결과는 무효
                setTestResult(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {loading ? '확인 중...' : '연결 확인'}
          </button>

          {testResult?.ok && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs font-bold text-emerald-700">
                ✓ Spreadsheet 연결 성공
              </p>

              <p className="text-xs text-emerald-600 mt-1">
                {testResult.spreadsheetName}
              </p>

              <p className="text-[11px] text-slate-500 mt-2">
                확인된 시트: {testResult.sheets?.join(', ')}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !testResult?.ok}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-40"
            >
              등록
            </button>
          </div>

          {message && (
            <p className="text-xs text-slate-500">
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">
          등록된 데이터 소스
        </h3>

        {sources.length === 0 ? (
          <p className="text-xs text-slate-400">
            등록된 데이터 소스가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
            <div
                key={source.id}
                className="border border-slate-200 rounded-lg p-4"
            >
                <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                        {source.name}
                    </p>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                        활성
                    </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 truncate">
                    {source.spreadsheetName}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <a
                    href={`https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                    시트 열기 ↗
                    </a>

                    <button
                    type="button"
                    onClick={() => handleDelete(source)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-40"
                    >
                    삭제
                    </button>
                </div>
                </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}