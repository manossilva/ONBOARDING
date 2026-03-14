import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { Users } from 'lucide-react'

export default function TarefasEquipe() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
          <Users size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas da Equipe</h1>
          <p className="text-zinc-400 text-sm">Board compartilhado entre todos os usuários</p>
        </div>
      </div>

      <KanbanBoard
        tipo="shared"
        defaultPipelines={['A Fazer', 'Em Andamento', 'Concluído']}
      />
    </div>
  )
}
