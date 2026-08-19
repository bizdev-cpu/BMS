import { useEffect, useState, useMemo, useRef } from 'react';
import { filterAccessibleSources } from './api/googleSheetsApi';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import RentalManagement from './pages/RentalManagement';
import KdtManagement from './pages/KdtManagement';
import Settings from './pages/Settings';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';

import {
  executeBmsAction,
  readAllData, readAllIntegratedData, getCurrentUser, setAuthIdToken, gasRun,
} from './api/bmsApi';

import DataSourceManager from './pages/DataSourceManager';

import { formatKRW } from './util/format';

const APP_VERSION = '0.0.1';
const APP_UPDATED = '2026-06-26';


const menus = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { id: 'projects', label: '용역 사업', icon: 'project' },
  { id: 'rental', label: '대관사업 관리', icon: 'rental' },
  { id: 'kdt', label: '부트캠프 관리', icon: 'kdt' },
  { id: 'monitoring', label: '제안 모니터링', icon: 'info' },
  { id: 'dataSource', label: '데이터 소스 관리', icon: 'database'},
  { id: 'settings', label: '시스템 설정', icon: 'settings' },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear(),
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('bmsCurrentUser');

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [idToken, setIdToken] = useState(
    () => sessionStorage.getItem('bmsIdToken'),
  );

  const [sheetsAccessToken, setSheetsAccessToken] = useState(
    () => sessionStorage.getItem('bmsSheetsAccessToken'),
  );

  useEffect(() => {
    if (idToken) {
      setAuthIdToken(idToken);
    }
  }, [idToken]);

  const handleLogin = ({ idToken, user }) => {
    setAuthIdToken(idToken);

    setIdToken(idToken);
    setCurrentUser(user);

    sessionStorage.setItem('bmsIdToken', idToken);
    sessionStorage.setItem(
      'bmsCurrentUser',
      JSON.stringify(user),
    );
    localStorage.removeItem('bmsLoggedOut');
  };

  const handleSheetsAccess = (accessToken) => {

    setSheetsAccessToken(accessToken);
    sessionStorage.setItem(
      'bmsSheetsAccessToken',
      accessToken,
    );
  };

  const handleLogout = () => {
    window.google?.accounts.id.disableAutoSelect();

    setCurrentUser(null);
    setIdToken(null);
    setSheetsAccessToken(null);

    setAuthIdToken(null);

    setHasDataAccess(null);
    setHasDataSources(null);

    setProjects([]);
    setRentals([]);
    setKdt([]);

    // 로그인 유지 정보 삭제
    sessionStorage.removeItem('bmsCurrentUser');
    sessionStorage.removeItem('bmsIdToken');
    sessionStorage.removeItem('bmsSheetsAccessToken');

    localStorage.setItem('bmsLoggedOut', 'true');
  };

  const hasInitializedRef = useRef(false);
  

  const [mode, setMode] = useState('api');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [projects, setProjects] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [kdt, setKdt] = useState([]);
  const [kdtSales, setKdtSales] = useState([]);

  const [kdtMonthly, setKdtMonthly] = useState({
    total: Array(12).fill(0),
    categories: [],
  });

  const [monitoring, setMonitoring] = useState([]);
  const [targets, setTargets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 빌드 정보 API는 나중에 연결
  const buildInfo = null;

  const checkDataSourceAccess = async () => {
    try {
      // 실제 사업 데이터를 읽지 않고
      // 등록된 데이터 소스 목록만 가져옴
      const sourceStart = performance.now();
      const sources = await gasRun('apiGetDataSources');

      const sourceList = Array.isArray(sources)
        ? sources
        : [];

      if (sourceList.length === 0) {
        setHasDataSources(false);
        setHasDataAccess(false);

        return [];
      }

      setHasDataSources(true);

      // 현재 로그인 사용자의 Access Token으로
      // 각각의 Google Sheet 권한 확인

      const accessStart = performance.now();

      const accessibleSources =
        await filterAccessibleSources(
          sourceList,
          sheetsAccessToken,
        );

      if (accessibleSources.length === 0) {
        setHasDataAccess(false);
        return [];
      }

      setHasDataAccess(true);

      return accessibleSources;
    } catch (error) {
      console.error(
        '데이터 소스 권한 확인 실패:',
        error,
      );

      setHasDataAccess(false);

      return false;
    }
  };

  const loadData = async (accessibleSources) => {
    setLoading(true);
    setError('');

    const sourceIds = accessibleSources.map(
      (source) => source.id,
    );

    try {
      const start = performance.now();

      const data =
        await readAllIntegratedData(sourceIds);

    // 아래 기존 setProjects, setRentals 등 그대로

      setProjects(
        Array.isArray(data.projects) ? data.projects : [],
      );

      setRentals(
        Array.isArray(data.rentals) ? data.rentals : [],
      );

      setKdt(
        Array.isArray(data.kdt) ? data.kdt : [],
      );

      setKdtMonthly(
        data.kdtMonthly || {
          total: Array(12).fill(0),
          categories: [],
        },
      );

      setMonitoring(
        Array.isArray(data.monitoring)
          ? data.monitoring
          : [],
      );

      setTargets(
        Array.isArray(data.targets)
          ? data.targets
          : [],
      );

      setDataSources(
        Array.isArray(data.dataSources)
          ? data.dataSources
          : [],
      );

      setKdtSales(
        Array.isArray(data.kdtSales)
        ? data.kdtSales
        : [],
      )

    } catch (err) {
      console.error('BMS 데이터 로드 실패:', err);

      setError(
        err instanceof Error
          ? err.message
          : '데이터를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!idToken || !sheetsAccessToken) {
    return;
  }

  if (hasInitializedRef.current) {
    return;
  }

  hasInitializedRef.current = true;

  const initializeData = async () => {
      setLoading(true);
      setError('');

      const accessibleSources =
        await checkDataSourceAccess();

      if (accessibleSources.length === 0) {
        setLoading(false);
        return;
      }


      await loadData(accessibleSources);
    };

    initializeData();
  }, [idToken, sheetsAccessToken]);

  const executeAction = async (actionName, payload) => {
    const result = await executeBmsAction(
      actionName,
      payload,
    );

    await loadData();

    return result;
  };

  const [selectedSourceId, setSelectedSourceId] = useState('all');
  const [dataSources, setDataSources] = useState([]);
  const [hasDataAccess, setHasDataAccess] = useState(null);
  const [hasDataSources, setHasDataSources] = useState(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const proposalPeriod =
        String(item.proposalPeriod || '').trim();

      // "2022", "2022-02", "2022-09" 모두 2022로 인식
      const proposalYear = proposalPeriod.slice(0, 4);

      const matchesYear =
        proposalYear === String(selectedYear);

      const matchesSource =
        selectedSourceId === 'all' ||
        item.sourceId === selectedSourceId;

      return matchesYear && matchesSource;
    });
  }, [projects, selectedYear, selectedSourceId]);


  const filteredRentals = useMemo(() => {
    return rentals.filter((item) => {
      // 대관 시작일의 연도
      const rentalYear = String(item.startDate || '').slice(0, 4);

      // 연도 필터
      const matchesYear =
        rentalYear === String(selectedYear);

      // 부서 필터
      const matchesSource =
        selectedSourceId === 'all' ||
        item.sourceId === selectedSourceId;

      return matchesYear && matchesSource;
    });
  }, [rentals, selectedYear, selectedSourceId]);

  const filteredKdtSales = useMemo(() => {
    if (selectedSourceId === 'all') {
      return kdtSales;
    }

    return kdtSales.filter(
      (item) => item.sourceId === selectedSourceId,
    );
  }, [kdtSales, selectedSourceId]);

  const filteredMonitoring = useMemo(() => {
    return monitoring.filter((item) => {
      // 수집일에서 연도 추출
      const year = String(item['수집일'] || '').slice(0, 4);

      // 연도 일치 여부
      const matchesYear =
        year === String(selectedYear);

      // 부서 일치 여부
      const matchesSource =
        selectedSourceId === 'all' ||
        item.sourceId === selectedSourceId;

      return matchesYear && matchesSource;
    });
  }, [monitoring, selectedYear, selectedSourceId]);

  const filteredTargets = useMemo(() => {
    if (selectedSourceId === 'all') {
      return targets;
    }

    return targets.filter(
      (item) => item.sourceId === selectedSourceId,
    );
  }, [targets, selectedSourceId]);

  if (!idToken || !sheetsAccessToken) {
    return (
      <Login
        onLogin={handleLogin}
        onSheetsAccess={handleSheetsAccess}
        isGoogleLoggedIn={!!idToken}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <Header
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        mode={mode}
        onMenuOpen={() => setMobileMenuOpen(true)}
        dataSources={dataSources}
        selectedSourceId={selectedSourceId}
        setSelectedSourceId={setSelectedSourceId}
      />

      <div className="flex flex-1">
        <Sidebar
          menus={menus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 p-6">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Google Sheet 데이터를 불러오는 중입니다.
            </div>
          )}

          {!loading && hasDataAccess === false && hasDataSources === true && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center mb-10">
              <p className="text-lg font-bold text-amber-800">
                데이터 접근 권한이 없습니다.
              </p>

              <p className="mt-2 text-sm text-amber-700">
                현재 로그인한 Google 계정으로
                등록된 데이터 소스에 접근할 수 없습니다.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Google Spreadsheet 관리자에게
                열람 권한을 요청해주세요.
              </p>
            </div>
          )}

          {!loading &&
            hasDataSources === false &&
            activeTab !== 'dataSource' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center mb-10">
                <p className="text-lg font-bold text-slate-800">
                  등록된 데이터 소스가 없습니다.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  BMS에서 사용할 Google Spreadsheet를 등록해주세요.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab('dataSource')}
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                >
                  데이터 소스 등록하기
                </button>
              </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              <p className="font-bold">
                데이터 연결에 실패했습니다.
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={loadData}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 font-bold text-white"
              >
                다시 불러오기
              </button>
            </div>
          )}

          {!loading &&
            !error && hasDataAccess === true &&
            activeTab === 'dashboard' && (
              <Dashboard
                projects={filteredProjects}
                rentals={filteredRentals}
                kdt={kdt}
                kdtMonthly={kdtMonthly}
                monitoring={filteredMonitoring}
                targets={filteredTargets}
                selectedYear={selectedYear}
                formatKRW={formatKRW}
                kdtSales={filteredKdtSales}
              />
            )}

          {!loading &&
            !error &&
            activeTab === 'projects' && hasDataAccess === true && (
              <ProjectManagement
                projects={filteredProjects}
                executeAction={executeAction}
                formatKRW={formatKRW}
                selectedYear={selectedYear}
              />
            )}

          {!loading &&
            !error &&
            !['dashboard', 'projects','rental', 'kdt', 'settings', 'monitoring', 'dataSource'].includes(activeTab) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
                {
                  menus.find(
                    (menu) => menu.id === activeTab,
                  )?.label
                }{' '}
                페이지는 아직 이전 중입니다.
              </div>
            )}

            {!loading &&
              !error &&
              activeTab === 'rental' && hasDataAccess === true && (
                <RentalManagement
                  rentals={filteredRentals}
                  executeAction={executeAction}
                  formatKRW={formatKRW}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              )}

              {!loading &&
                !error &&
                activeTab === 'kdt' && hasDataAccess === true && (
                  <KdtManagement
                    kdtMonthly={kdtMonthly}
                    formatKRW={formatKRW}
                    kdtSales={filteredKdtSales}
                    selectedYear={selectedYear}
                  />
                )}

                {!loading &&
                  !error &&
                  activeTab === 'settings' && hasDataAccess === true && (
                    <Settings
                      mode={mode}
                      setMode = {setMode}
                      deletedHistory={[]}
                      loadData={loadData}
                    />
                  )}
                  {!loading &&
                    !error &&
                    activeTab === 'monitoring' && hasDataAccess === true && (
                      <Monitoring
                        monitoring={filteredMonitoring}
                        executeAction={executeAction}
                        loadData={loadData}
                        formatKRW={formatKRW}
                        mode = {mode}
                        projects={filteredProjects}
                      />
                  )}
                  {!loading &&
                    !error &&
                    activeTab === 'dataSource' && (
                      <DataSourceManager
                        sheetsAccessToken={sheetsAccessToken}
                      />
                  )}
        </main>
      </div>

      <Footer
        buildInfo={buildInfo}
        APP_VERSION={APP_VERSION}
        APP_UPDATED={APP_UPDATED}
      />
    </div>
  );
}