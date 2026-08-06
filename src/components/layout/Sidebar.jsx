import Icon from '../common/Icon';

export default function Sidebar({
  menus,
  activeTab,
  setActiveTab,
}) {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
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
    </aside>
  );
}