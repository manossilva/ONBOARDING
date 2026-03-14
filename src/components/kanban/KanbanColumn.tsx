import { useState, useRef, useEffect } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import type { KanbanPipeline, KanbanTarefa } from '../../lib/types'

interface KanbanColumnProps {
  pipeline: KanbanPipeline
  tarefas: KanbanTarefa[]
  index: number
  onAddTask: (pipelineId: string, titulo: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onRenameColumn: (pipelineId: string, nome: string) => Promise<void>
  onDeleteColumn: (pipelineId: string) => Promise<void>
}

export function KanbanColumn({
  pipeline,
  tarefas,
  index,
  onAddTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [columnName, setColumnName] = useState(pipeline.nome)
  const addInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAddingTask && addInputRef.current) addInputRef.current.focus()
  }, [isAddingTask])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) nameInputRef.current.focus()
  }, [isEditingName])

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    await onAddTask(pipeline.id, newTaskTitle.trim())
    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  const handleRename = async () => {
    if (columnName.trim() && columnName !== pipeline.nome) {
      await onRenameColumn(pipeline.id, columnName.trim())
    } else {
      setColumnName(pipeline.nome)
    }
    setIsEditingName(false)
  }

  return (
    <Draggable draggableId={`col-${pipeline.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 200px)', ...provided.draggableProps.style }}
        >
          {/* Column header */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical size={16} className="text-zinc-600 flex-shrink-0" />
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename()
                    if (e.key === 'Escape') { setColumnName(pipeline.nome); setIsEditingName(false) }
                  }}
                  className="bg-zinc-800 text-white text-sm font-semibold px-2 py-0.5 rounded border border-purple-500 outline-none flex-1 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-white text-sm font-semibold hover:text-purple-400 transition-colors text-left truncate"
                  title="Clique para renomear"
                >
                  {pipeline.nome}
                </button>
              )}
              <span className="text-zinc-500 text-xs bg-zinc-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {tarefas.length}
              </span>
            </div>
            <button
              onClick={() => onDeleteColumn(pipeline.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Tasks */}
          <Droppable droppableId={pipeline.id} type="TASK">
            {(droppableProvided, snapshot) => (
              <div
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
                className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
                  snapshot.isDraggingOver ? 'bg-purple-900/10' : ''
                }`}
                style={{ minHeight: 60 }}
              >
                {tarefas.map((tarefa, i) => (
                  <KanbanCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    index={i}
                    onDelete={onDeleteTask}
                  />
                ))}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add task */}
          <div className="p-2 border-t border-zinc-800">
            {isAddingTask ? (
              <div className="space-y-2">
                <input
                  ref={addInputRef}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Título da tarefa..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask()
                    if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle('') }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check size={12} /> Adicionar
                  </button>
                  <button
                    onClick={() => { setIsAddingTask(false); setNewTaskTitle('') }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X size={12} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} /> Adicionar tarefa
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
