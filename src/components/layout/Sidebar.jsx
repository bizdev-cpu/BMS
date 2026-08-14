import Icon from '../common/Icon';

export default function Sidebar({
  menus,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      {/* 메뉴 */}
      <nav className="space-y-1">
        {menus.map((menu) => {
          const active = activeTab === menu.id;

          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => setActiveTab(menu.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                active
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon name={menu.icon} className="h-5 w-5" />
              <span>{menu.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 로그인 사용자 */}
      {currentUser && (
        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            {currentUser.picture && (
              <img
                src={currentUser.picture}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full"
              />
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {currentUser.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}