import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { PfReceita } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'

interface FormData {
  descricao: string
  valor: string
  forma_pagamento: string
  data: string
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const FORMAS = ['PIX', 'Boleto', 'Dinheiro', 'TED', 'Cartão']

export default function PF() {
  const { user } = useAuth()
  const [receitas, setReceitas] = useState<PfReceita[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { forma_pagamento: 'PIX', data: new Date().toISOString().split('T')[0] },
  })

  const fetchReceitas = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('pf_receitas')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
    setReceitas((data as PfReceita[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchReceitas()
  }, [user])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setSubmitting(true)
    const { error } = await supabase.from('pf_receitas').insert({
      user_id: user.id,
      descricao: data.descricao,
      valor: parseFloat(data.valor.replace(',', '.')),
      forma_pagamento: data.forma_pagamento,
      data: data.data,
    })
    if (!error) {
      await fetchReceitas()
      reset({ forma_pagamento: 'PIX', data: new Date().toISOString().split('T')[0] })
      setIsModalOpen(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta receita?')) return
    await supabase.from('pf_receitas').delete().eq('id', id)
    setReceitas(prev => prev.filter(r => r.id !== id))
  }

  const total = receitas.reduce((s, r) => s + Number(r.valor), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PF — Receitas Pessoais</h1>
          <p className="text-zinc-400 text-sm mt-1">Apenas suas receitas pessoais</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nova Receita
        </Button>
      </div>

      {/* Total */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 inline-flex flex-col gap-1">
        <span className="text-zinc-400 text-sm">Total Recebido</span>
        <span className="text-2xl font-bold text-amber-400">{formatBRL(total)}</span>
      </div>

      {/* Table */}
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
                  <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden sm:table-cell">Forma</th>
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
                      <span className="text-zinc-400 text-sm">{r.forma_pagamento}</span>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Receita PF">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Consultoria de marketing"
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
          <Select
            label="Forma de Recebimento"
            error={errors.forma_pagamento?.message}
            {...register('forma_pagamento', { required: 'Obrigatório' })}
          >
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
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
