import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pf': 'PF — Receitas Pessoais',
  '/pj1': 'PJ1',
  '/pj2': 'PJ2 — Sociedade',
  '/tarefas-equipe': 'Tarefas da Equipe',
  '/minhas-tarefas': 'Minhas Tarefas',
  '/configuracoes': 'Configurações',
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = routeLabels[location.pathname] || 'Gestão Interna'

  return (
    <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="text-zinc-400 hover:text-white transition-colors p-1"
      >
        <Menu size={24} />
      </button>
      <h1 className="text-white font-semibold text-base">{title}</h1>
    </header>
  )
}
