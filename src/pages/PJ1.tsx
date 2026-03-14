import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Pj1Receita } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'

interface FormData {
  descricao: string
  valor: string
  quem_pagou: string
  data: string
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PJ1() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [receitas, setReceitas] = useState<Pj1Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Redirect if not Ramon
  useEffect(() => {
    if (profile && profile.role !== 'ramon') {
      navigate('/dashboard', { replace: true })
    }
  }, [profile, navigate])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { data: new Date().toISOString().split('T')[0] },
  })

  const fetchReceitas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pj1_receitas')
      .select('*')
      .order('data', { ascending: false })
    setReceitas((data as Pj1Receita[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.role === 'ramon') fetchReceitas()
  }, [profile])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    const { error } = await supabase.from('pj1_receitas').insert({
      descricao: data.descricao,
      valor: parseFloat(data.valor.replace(',', '.')),
      quem_pagou: data.quem_pagou,
      data: data.data,
    })
    if (!error) {
      await fetchReceitas()
      reset({ data: new Date().toISOString().split('T')[0] })
      setIsModalOpen(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta receita?')) return
    await supabase.from('pj1_receitas').delete().eq('id', id)
    setReceitas(prev => prev.filter(r => r.id !== id))
  }

  const total = receitas.reduce((s, r) => s + Number(r.valor), 0)

  if (profile?.role !== 'ramon') return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PJ1</h1>
          <p className="text-zinc-400 text-sm mt-1">Receitas da empresa PJ1</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nova Receita
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 inline-flex flex-col gap-1">
        <span className="text-zinc-400 text-sm">Total Recebido</span>
        <span className="text-2xl font-bold text-amber-400">{formatBRL(total)}</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-white font-semibold">Receitas ({receitas.length})</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : receitas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500">Nenhuma receita cadastrada</p>
            <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Adicionar primeira receita
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Descrição</th>
                  <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Valor</th>
                  <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden sm:table-cell">Quem Pagou</th>
                  <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden md:table-cell">Data</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {receitas.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white text-sm font-medium">{r.descricao}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-green-400 font-semibold text-sm">{formatBRL(Number(r.valor))}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-zinc-400 text-sm">{r.quem_pagou}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-zinc-400 text-sm">{format(parseISO(r.data), 'dd/MM/yyyy')}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Receita PJ1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Contrato de assessoria"
            error={errors.descricao?.message}
            {...register('descricao', { required: 'Obrigatório' })}
          />
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            error={errors.valor?.message}
            {...register('valor', {
              required: 'Obrigatório',
              pattern: { value: /^\d+([.,]\d{0,2})?$/, message: 'Valor inválido' },
            })}
          />
          <Input
            label="Quem Pagou"
            placeholder="Nome do cliente ou pagador"
            error={errors.quem_pagou?.message}
            {...register('quem_pagou', { required: 'Obrigatório' })}
          />
          <Input
            label="Data"
            type="date"
            error={errors.data?.message}
            {...register('data', { required: 'Obrigatório' })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
