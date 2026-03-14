import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Pj2Cliente, Pj2Servico } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface ClienteForm {
  nome: string
  contato: string
}

interface ServicoForm {
  cliente_id: string
  descricao: string
  valor_fechado: string
  gastos: string
  imposto: string
  data_vencimento: string
}

export default function PJ2() {
  const [activeTab, setActiveTab] = useState<'clientes' | 'servicos'>('clientes')
  const [clientes, setClientes] = useState<Pj2Cliente[]>([])
  const [servicos, setServicos] = useState<Pj2Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const clienteForm = useForm<ClienteForm>()
  const servicoForm = useForm<ServicoForm>({
    defaultValues: { gastos: '0', imposto: '0', data_vencimento: '' },
  })

  const watchedServico = servicoForm.watch(['valor_fechado', 'gastos', 'imposto'])
  const valorFechado = parseFloat(watchedServico[0]?.replace(',', '.') || '0') || 0
  const gastos = parseFloat(watchedServico[1]?.replace(',', '.') || '0') || 0
  const imposto = parseFloat(watchedServico[2]?.replace(',', '.') || '0') || 0
  const lucro = valorFechado - gastos - imposto
  const lucroCada = lucro / 2

  const fetchData = async () => {
    setLoading(true)
    const [cRes, sRes] = await Promise.all([
      supabase.from('pj2_clientes').select('*').order('nome'),
      supabase.from('pj2_servicos').select('*, pj2_clientes(nome, contato)').order('created_at', { ascending: false }),
    ])
    setClientes((cRes.data as Pj2Cliente[]) || [])
    setServicos((sRes.data as Pj2Servico[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const onSubmitCliente = async (data: ClienteForm) => {
    setSubmitting(true)
    const { error } = await supabase.from('pj2_clientes').insert({
      nome: data.nome,
      contato: data.contato || null,
    })
    if (!error) {
      await fetchData()
      clienteForm.reset()
      setIsClienteModalOpen(false)
    }
    setSubmitting(false)
  }

  const onSubmitServico = async (data: ServicoForm) => {
    setSubmitting(true)
    const { error } = await supabase.from('pj2_servicos').insert({
      cliente_id: data.cliente_id || null,
      descricao: data.descricao,
      valor_fechado: parseFloat(data.valor_fechado.replace(',', '.')),
      gastos: parseFloat(data.gastos.replace(',', '.') || '0'),
      imposto: parseFloat(data.imposto.replace(',', '.') || '0'),
      data_vencimento: data.data_vencimento || null,
    })
    if (!error) {
      await fetchData()
      servicoForm.reset({ gastos: '0', imposto: '0' })
      setIsServicoModalOpen(false)
    }
    setSubmitting(false)
  }

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('Deletar este cliente?')) return
    await supabase.from('pj2_clientes').delete().eq('id', id)
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  const handleDeleteServico = async (id: string) => {
    if (!confirm('Deletar este serviço?')) return
    await supabase.from('pj2_servicos').delete().eq('id', id)
    setServicos(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">PJ2 — Sociedade</h1>
        <p className="text-zinc-400 text-sm mt-1">Gestão de clientes e contratos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['clientes', 'servicos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab === 'clientes' ? 'Clientes' : 'Serviços / Contratos'}
          </button>
        ))}
      </div>

      {/* Clientes Tab */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsClienteModalOpen(true)}>
              <Plus size={16} /> Novo Cliente
            </Button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Clientes ({clientes.length})</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">Nenhum cliente cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Nome</th>
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden sm:table-cell">Contato</th>
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden md:table-cell">Data Cadastro</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {clientes.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-3 text-white text-sm font-medium">{c.nome}</td>
                        <td className="px-5 py-3 text-zinc-400 text-sm hidden sm:table-cell">{c.contato || '—'}</td>
                        <td className="px-5 py-3 text-zinc-400 text-sm hidden md:table-cell">
                          {format(parseISO(c.created_at), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => handleDeleteCliente(c.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
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
        </div>
      )}

      {/* Serviços Tab */}
      {activeTab === 'servicos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsServicoModalOpen(true)}>
              <Plus size={16} /> Novo Serviço
            </Button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Serviços ({servicos.length})</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : servicos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">Nenhum serviço cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Cliente</th>
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Descrição</th>
                      <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3 hidden sm:table-cell">Fechado</th>
                      <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3 hidden md:table-cell">Gastos</th>
                      <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3 hidden md:table-cell">Imposto</th>
                      <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Lucro</th>
                      <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3 hidden lg:table-cell">Lucro/Sócio</th>
                      <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3 hidden lg:table-cell">Vencimento</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {servicos.map(s => {
                      const lucroS = Number(s.valor_fechado) - Number(s.gastos) - Number(s.imposto)
                      const lucroCadaS = lucroS / 2
                      return (
                        <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3 text-white text-sm font-medium">
                            {(s.pj2_clientes as any)?.nome || '—'}
                          </td>
                          <td className="px-5 py-3 text-zinc-300 text-sm">{s.descricao}</td>
                          <td className="px-5 py-3 text-right text-zinc-300 text-sm hidden sm:table-cell">{formatBRL(Number(s.valor_fechado))}</td>
                          <td className="px-5 py-3 text-right text-red-400 text-sm hidden md:table-cell">{formatBRL(Number(s.gastos))}</td>
                          <td className="px-5 py-3 text-right text-orange-400 text-sm hidden md:table-cell">{formatBRL(Number(s.imposto))}</td>
                          <td className="px-5 py-3 text-right font-semibold text-sm">
                            <span className={lucroS >= 0 ? 'text-green-400' : 'text-red-400'}>{formatBRL(lucroS)}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-amber-400 text-sm font-semibold hidden lg:table-cell">{formatBRL(lucroCadaS)}</td>
                          <td className="px-5 py-3 text-zinc-400 text-sm hidden lg:table-cell">
                            {s.data_vencimento ? format(parseISO(s.data_vencimento), 'dd/MM/yyyy') : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => handleDeleteServico(s.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cliente Modal */}
      <Modal isOpen={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} title="Novo Cliente">
        <form onSubmit={clienteForm.handleSubmit(onSubmitCliente)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome do cliente"
            error={clienteForm.formState.errors.nome?.message}
            {...clienteForm.register('nome', { required: 'Obrigatório' })}
          />
          <Input
            label="Contato (telefone/email)"
            placeholder="(11) 99999-9999 ou email@exemplo.com"
            {...clienteForm.register('contato')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsClienteModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Serviço Modal */}
      <Modal isOpen={isServicoModalOpen} onClose={() => setIsServicoModalOpen(false)} title="Novo Serviço" size="lg">
        <form onSubmit={servicoForm.handleSubmit(onSubmitServico)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">Cliente</label>
            <select
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              {...servicoForm.register('cliente_id')}
            >
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <Input
            label="Descrição"
            placeholder="Descrição do serviço/contrato"
            error={servicoForm.formState.errors.descricao?.message}
            {...servicoForm.register('descricao', { required: 'Obrigatório' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Valor Fechado (R$)"
              placeholder="0,00"
              error={servicoForm.formState.errors.valor_fechado?.message}
              {...servicoForm.register('valor_fechado', {
                required: 'Obrigatório',
                pattern: { value: /^\d+([.,]\d{0,2})?$/, message: 'Inválido' },
              })}
            />
            <Input
              label="Gastos (R$)"
              placeholder="0,00"
              {...servicoForm.register('gastos', {
                pattern: { value: /^\d+([.,]\d{0,2})?$/, message: 'Inválido' },
              })}
            />
            <Input
              label="Imposto (R$)"
              placeholder="0,00"
              {...servicoForm.register('imposto', {
                pattern: { value: /^\d+([.,]\d{0,2})?$/, message: 'Inválido' },
              })}
            />
          </div>

          {/* Preview calculation */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Cálculo Automático</h4>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Lucro Total</span>
              <span className={`font-semibold ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatBRL(lucro)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Lucro por Sócio</span>
              <span className="text-amber-400 font-semibold">{formatBRL(lucroCada)}</span>
            </div>
          </div>

          <Input
            label="Data de Vencimento"
            type="date"
            {...servicoForm.register('data_vencimento')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsServicoModalOpen(false)}>
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
