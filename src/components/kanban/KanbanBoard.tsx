import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { supabase } from '../../lib/supabase'
import type { KanbanPipeline, KanbanTarefa } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

interface KanbanBoardProps {
  tipo: 'shared' | 'personal'
  defaultPipelines: string[]
}

export function KanbanBoard({ tipo, defaultPipelines }: KanbanBoardProps) {
  const { user } = useAuth()
  const [pipelines, setPipelines] = useState<KanbanPipeline[]>([])
  const [tarefas, setTarefas] = useState<KanbanTarefa[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      let pipelinesQuery = supabase
        .from('kanban_pipelines')
        .select('*')
        .eq('tipo', tipo)
        .order('ordem')

      if (tipo === 'personal') {
        pipelinesQuery = pipelinesQuery.eq('user_id', user.id)
      }

      const { data: pData } = await pipelinesQuery

      if (!pData || pData.length === 0) {
        // Create defaults
        const defaults = await Promise.all(
          defaultPipelines.map(async (nome, idx) => {
            const { data } = await supabase
              .from('kanban_pipelines')
              .insert({
                nome,
                ordem: idx,
                tipo,
                user_id: tipo === 'personal' ? user.id : null,
              })
              .select()
              .single()
            return data
          })
        )
        setPipelines(defaults.filter(Boolean) as KanbanPipeline[])
      } else {
        setPipelines(pData as KanbanPipeline[])
      }

      const pipelineIds = pData?.map(p => p.id) ?? []
      if (pipelineIds.length > 0) {
        const { data: tData } = await supabase
          .from('kanban_tarefas')
          .select('*')
          .in('pipeline_id', pipelineIds)
          .order('ordem')
        setTarefas((tData as KanbanTarefa[]) || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, tipo])

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (type === 'COLUMN') {
      const reordered = Array.from(pipelines)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      const updated = reordered.map((p, i) => ({ ...p, ordem: i }))
      setPipelines(updated)
      await Promise.all(
        updated.map(p => supabase.from('kanban_pipelines').update({ ordem: p.ordem }).eq('id', p.id))
      )
      return
    }

    // Task drag
    const taskId = draggableId
    const sourcePipelineId = source.droppableId
    const destPipelineId = destination.droppableId

    const sourceTasks = tarefas.filter(t => t.pipeline_id === sourcePipelineId)
    const destTasks = tarefas.filter(t => t.pipeline_id === destPipelineId)

    const task = tarefas.find(t => t.id === taskId)!
    if (!task) return

    const newTarefas = tarefas.filter(t => t.id !== taskId)

    if (sourcePipelineId === destPipelineId) {
      const colTasks = [...sourceTasks.filter(t => t.id !== taskId)]
      colTasks.splice(destination.index, 0, task)
      const updated = newTarefas.filter(t => t.pipeline_id !== sourcePipelineId)
      const withOrders = colTasks.map((t, i) => ({ ...t, ordem: i }))
      setTarefas([...updated, ...withOrders])
      await Promise.all(
        withOrders.map(t => supabase.from('kanban_tarefas').update({ ordem: t.ordem }).eq('id', t.id))
      )
    } else {
      const updatedTask = { ...task, pipeline_id: destPipelineId }
      const newDestTasks = [...destTasks]
      newDestTasks.splice(destination.index, 0, updatedTask)
      const updatedSource = sourceTasks.filter(t => t.id !== taskId).map((t, i) => ({ ...t, ordem: i }))
      const updatedDest = newDestTasks.map((t, i) => ({ ...t, ordem: i }))
      const rest = newTarefas.filter(t => t.pipeline_id !== sourcePipelineId && t.pipeline_id !== destPipelineId)
      setTarefas([...rest, ...updatedSource, ...updatedDest])
      await supabase.from('kanban_tarefas').update({ pipeline_id: destPipelineId, ordem: destination.index }).eq('id', taskId)
      await Promise.all([
        ...updatedSource.map(t => supabase.from('kanban_tarefas').update({ ordem: t.ordem }).eq('id', t.id)),
        ...updatedDest.filter(t => t.id !== taskId).map(t => supabase.from('kanban_tarefas').update({ ordem: t.ordem }).eq('id', t.id)),
      ])
    }
  }

  const handleAddTask = async (pipelineId: string, titulo: string) => {
    if (!user) return
    const pipelineTasks = tarefas.filter(t => t.pipeline_id === pipelineId)
    const { data } = await supabase
      .from('kanban_tarefas')
      .insert({
        pipeline_id: pipelineId,
        titulo,
        ordem: pipelineTasks.length,
        tipo,
        user_id: user.id,
      })
      .select()
      .single()
    if (data) setTarefas(prev => [...prev, data as KanbanTarefa])
  }

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('kanban_tarefas').delete().eq('id', taskId)
    setTarefas(prev => prev.filter(t => t.id !== taskId))
  }

  const handleRenameColumn = async (pipelineId: string, nome: string) => {
    await supabase.from('kanban_pipelines').update({ nome }).eq('id', pipelineId)
    setPipelines(prev => prev.map(p => p.id === pipelineId ? { ...p, nome } : p))
  }

  const handleDeleteColumn = async (pipelineId: string) => {
    if (!confirm('Deletar esta coluna e todas as tarefas nela?')) return
    await supabase.from('kanban_pipelines').delete().eq('id', pipelineId)
    setPipelines(prev => prev.filter(p => p.id !== pipelineId))
    setTarefas(prev => prev.filter(t => t.pipeline_id !== pipelineId))
  }

  const handleAddColumn = async () => {
    if (!user) return
    const { data } = await supabase
      .from('kanban_pipelines')
      .insert({
        nome: 'Nova Coluna',
        ordem: pipelines.length,
        tipo,
        user_id: tipo === 'personal' ? user.id : null,
      })
      .select()
      .single()
    if (data) setPipelines(prev => [...prev, data as KanbanPipeline])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-4 kanban-scroll pb-4"
            style={{ minHeight: 'calc(100vh - 220px)' }}
          >
            {pipelines.map((pipeline, index) => (
              <KanbanColumn
                key={pipeline.id}
                pipeline={pipeline}
                tarefas={tarefas.filter(t => t.pipeline_id === pipeline.id)}
                index={index}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
            {provided.placeholder}
            <button
              onClick={handleAddColumn}
              className="flex-shrink-0 w-72 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-800 hover:border-purple-600 rounded-xl text-zinc-500 hover:text-purple-400 transition-colors py-6"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Nova Coluna</span>
            </button>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
