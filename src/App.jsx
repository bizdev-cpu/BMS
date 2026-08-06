import { useState } from 'react';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import ProjectManagement from './pages/ProjectManagement';

import { formatKRW } from './util/format';

const APP_VERSION = '0.0.1';
const APP_UPDATED = '2026-06-26';

const sampleProjects = [
  {
    proposalPeriod: '2026-04',
    type: 'B2G',
    name: '2026년 강남구 청년 AI 아카데미 운영사업',
    sales: 50000000,
    cost: 50000000,
    client: '강남구청',
    stage: '수주',
    participation: '단독',
    consortium: '구름',
    shareRatio: 100,
    periodText: '2026-04-01 ~ 2026-12-31',
    target: '일반성인',
    note: '지자체 매칭 예산',
    managers: '김가인',
    comments: '',
  },
];

const menus = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { id: 'projects', label: '제안 사업', icon: 'project' },
  { id: 'monitoring', label: '공고 모니터링', icon: 'info' },
  { id: 'rental', label: '대관 관리', icon: 'rental' },
  { id: 'kdt', label: 'KDT 관리', icon: 'kdt' },
  { id: 'settings', label: '설정', icon: 'settings' },
];

export default function App() {
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear(),
  );

  const [mode] = useState('mock');
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState(sampleProjects);

  // API 연결 전 임시값
  const buildInfo = null;

  const executeAction = (actionName, payload) => {
    if (actionName === 'addProject') {
      setProjects((prev) => [...prev, payload]);
      return;
    }

    if (actionName === 'updateProject') {
      setProjects((prev) =>
        prev.map((project) =>
          project.name === payload.name
            ? { ...project, ...payload }
            : project,
        ),
      );
      return;
    }

    if (actionName === 'deleteProject') {
      setProjects((prev) =>
        prev.filter((project) => project.name !== payload.name),
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <Header
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        mode={mode}
      />

      <div className="flex flex-1">
        <Sidebar
          menus={menus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="min-w-0 flex-1 p-6">
          {activeTab === 'projects' && (
            <ProjectManagement
              projects={projects}
              executeAction={executeAction}
              formatKRW={formatKRW}
              selectedYear={selectedYear}
            />
          )}

          {activeTab !== 'projects' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
              {menus.find((menu) => menu.id === activeTab)?.label} 페이지는 아직
              이전 중입니다.
            </div>
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