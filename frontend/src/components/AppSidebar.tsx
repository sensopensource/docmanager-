import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

type NavItemProps = {
  to: string
  icon: string
  label: string
}

function NavItem({ to, icon, label }: NavItemProps) {
  // NavLink applique automatiquement une classe quand la route matche
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2.5 transition-colors border-l-2 ${
          isActive
            ? 'text-fg-1 bg-surface-2 border-primary'
            : 'text-fg-2 hover:text-fg-1 hover:bg-surface-2 border-transparent'
        }`
      }
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      <span className="font-body text-sm">{label}</span>
    </NavLink>
  )
}

function AppSidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface-1 border-r border-border flex flex-col z-30">

      {/* Wordmark — clic ramene a /home */}
      <Link
        to="/home"
        className="flex items-center gap-2 px-5 h-14 border-b border-border hover:opacity-80 transition-opacity"
      >
        <span className="material-symbols-outlined text-fg-2 text-base">inventory_2</span>
        <span className="font-mono text-sm font-medium text-fg-1">SENSO</span>
        <span className="font-mono text-sm text-fg-2">.DRIVE</span>
      </Link>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-fg-3 px-5 mb-2">
          Navigation
        </div>

        <NavItem to="/home" icon="space_dashboard" label="Tableau de bord" />
        <NavItem to="/documents" icon="folder_open" label="Mes documents" />
        <NavItem to="/categories" icon="label" label="Catégories" />
      </nav>

      {/* Footer : user + logout */}
      <div className="border-t border-border p-4">
        {user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-surface-2 border border-border flex items-center justify-center font-mono text-xs text-fg-1 shrink-0">
              {user.nom.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-body text-xs text-fg-1 truncate">{user.nom}</div>
              <div className="font-mono text-[10px] text-fg-3 truncate">{user.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-fg-2 hover:text-fg-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Déconnexion
        </button>
      </div>

    </aside>
  )
}

export default AppSidebar
