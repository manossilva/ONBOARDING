import { Draggable } from '@hello-pangea/dnd'
import { GripVertical, Trash2, User } from 'lucide-react'
import type { KanbanTarefa } from '../../lib/types'

interface KanbanCardProps {
  tarefa: KanbanTarefa
  index: number
  onDelete: (id: string) => void
}

export function KanbanCard({ tarefa, index, onDelete }: KanbanCardProps) {
  return (
    <Draggable draggableId={tarefa.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-zinc-800 border rounded-lg p-3 group transition-all ${
            snapshot.isDragging
              ? 'border-purple-500 shadow-lg shadow-purple-500/20 rotate-1'
              : 'border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
            >
              <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-snug">{tarefa.titulo}</p>
              {tarefa.descricao && (
                <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{tarefa.descricao}</p>
              )}
            </div>
            <button
              onClick={() => onDelete(tarefa.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {tarefa.user_id && tarefa.tipo === 'shared' && (
            <div className="flex items-center gap-1.5 mt-2 ml-6">
              <User size={12} className="text-zinc-500" />
              <span className="text-zinc-500 text-xs">Atribuído</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
