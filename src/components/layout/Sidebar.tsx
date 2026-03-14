import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  Building2,
  Users,
  CheckSquare,
  ListTodo,
  Settings,
  LogOut,
  X,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pf', icon: <User size={20} />, label: 'PF' },
    ...(profile?.role === 'ramon'
      ? [{ to: '/pj1', icon: <Briefcase size={20} />, label: 'PJ1' }]
      : []),
    { to: '/pj2', icon: <Building2 size={20} />, label: 'PJ2 - Sociedade' },
    { to: '/tarefas-equipe', icon: <Users size={20} />, label: 'Tarefas da Equipe' },
    { to: '/minhas-tarefas', icon: <ListTodo size={20} />, label: 'Minhas Tarefas' },
    { to: '/configuracoes', icon: <Settings size={20} />, label: 'Configurações' },
  ]

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <CheckSquare size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {profile?.company_name || 'Gestão Interna'}
            </p>
            <p className="text-zinc-500 text-xs">Sistema Interno</p>
          </div>
        </div>
        {/* Close button (mobile) */}
        <button
          onClick={onClose}
          className="lg:hidden text-zinc-400 hover:text-white p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-600/50"
            />
          ) : (
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.name || 'Usuário'}
            </p>
            <p className="text-zinc-500 text-xs capitalize">{profile?.role || ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-full fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-72 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
