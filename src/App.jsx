import { useEffect, useState, useMemo } from 'react';

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
  readAllData, readAllIntegratedData, getCurrentUser, setAuthIdToken,
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
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear(),
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);

  const handleLogin = ({ idToken, user }) => {
    console.log('BMS 로그인 성공:', user);
    setAuthIdToken(idToken);

    setIdToken(idToken);
    setCurrentUser(user);
  };
  

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

  const loadData = async () => {
    setLoading(true);
    setError('');

    const start = performance.now();

    try {
      const data = await readAllIntegratedData();

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
    if (!idToken) {
      return;
    }

    loadData();
  }, [idToken]);

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

  if (!idToken) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <Header
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        mode={mode}

        dataSources={dataSources}
        selectedSourceId={selectedSourceId}
        setSelectedSourceId={setSelectedSourceId}
      />

      <div className="flex flex-1">
        <Sidebar
          menus={menus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="min-w-0 flex-1 p-6">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Google Sheet 데이터를 불러오는 중입니다.
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
            !error &&
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
            activeTab === 'projects' && (
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
              activeTab === 'rental' && (
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
                activeTab === 'kdt' && (
                  <KdtManagement
                    kdtMonthly={kdtMonthly}
                    formatKRW={formatKRW}
                    kdtSales={filteredKdtSales}
                    selectedYear={selectedYear}
                  />
                )}

                {!loading &&
                  !error &&
                  activeTab === 'settings' && (
                    <Settings
                      mode={mode}
                      setMode = {setMode}
                      deletedHistory={[]}
                      loadData={loadData}
                    />
                  )}
                  {!loading &&
                    !error &&
                    activeTab === 'monitoring' && (
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
                      <DataSourceManager />
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