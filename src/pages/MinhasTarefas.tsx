import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { ListTodo } from 'lucide-react'

export default function MinhasTarefas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
          <ListTodo size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Tarefas</h1>
          <p className="text-zinc-400 text-sm">Board pessoal — apenas você pode ver</p>
        </div>
      </div>

      <KanbanBoard
        tipo="personal"
        defaultPipelines={['Para Fazer', 'Fazendo', 'Feito']}
      />
    </div>
  )
}
