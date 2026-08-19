import Icon from '../common/Icon';

export default function Sidebar({
  menus,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  mobileMenuOpen,
  onMobileMenuClose,
}) {
  const handleMenuClick = (menuId) => {
    setActiveTab(menuId);
    onMobileMenuClose?.();
  };

  return (
    <>
      {/* 태블릿 / PC */}
      <aside className="hidden w-16 shrink-0 flex-col border-r border-slate-200 bg-white p-3 md:flex lg:w-60 lg:p-4">
        <nav className="space-y-1">
          {menus.map((menu) => {
            const active = activeTab === menu.id;

            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveTab(menu.id)}
                className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition lg:justify-start lg:px-4 ${
                  active
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={menu.label}
              >
                <Icon name={menu.icon} className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline">{menu.label}</span>
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="flex items-center justify-center lg:justify-start lg:gap-3">
              {currentUser.picture && (
                <img
                  src={currentUser.picture}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full"
                />
              )}

              <div className="hidden min-w-0 lg:block">
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
              className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <span className="hidden lg:inline">로그아웃</span>
              <span className="lg:hidden">↪</span>
            </button>
          </div>
        )}
      </aside>

      {/* 모바일 Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={onMobileMenuClose}
        >
          <aside
            className="flex h-full w-[280px] flex-col bg-white p-4 shadow-xl max-[479px]:w-[85%]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">메뉴</p>

              <button
                type="button"
                onClick={onMobileMenuClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
                aria-label="메뉴 닫기"
              >
                ×
              </button>
            </div>

            <nav className="space-y-1">
              {menus.map((menu) => {
                const active = activeTab === menu.id;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleMenuClick(menu.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                      active
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon name={menu.icon} className="h-5 w-5 shrink-0" />
                    <span>{menu.label}</span>
                  </button>
                );
              })}
            </nav>

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
        </div>
      )}
    </>
  );
}