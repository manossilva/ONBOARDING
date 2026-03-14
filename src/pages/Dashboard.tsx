import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { DollarSign, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { StatCard } from '../components/ui/Card'
import type { PfReceita, Pj1Receita, Pj2Servico } from '../lib/types'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function groupByMonth(items: { data?: string; created_at?: string; valor: number }[]) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const dateStr = item.data || item.created_at?.split('T')[0] || ''
    if (!dateStr) return
    const month = format(parseISO(dateStr), 'MMM/yy', { locale: ptBR })
    map[month] = (map[month] || 0) + Number(item.valor)
  })
  return Object.entries(map).map(([mes, total]) => ({ mes, total })).slice(-6)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-semibold" style={{ color: p.color }}>{formatBRL(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'pf' | 'pj1' | 'pj2'>('pf')
  const [pfReceitas, setPfReceitas] = useState<PfReceita[]>([])
  const [pj1Receitas, setPj1Receitas] = useState<Pj1Receita[]>([])
  const [pj2Servicos, setPj2Servicos] = useState<Pj2Servico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [pfRes, pj2Res] = await Promise.all([
        supabase.from('pf_receitas').select('*').order('data', { ascending: false }),
        supabase.from('pj2_servicos').select('*').order('created_at', { ascending: false }),
      ])
      setPfReceitas((pfRes.data as PfReceita[]) || [])
      setPj2Servicos((pj2Res.data as Pj2Servico[]) || [])

      if (profile?.role === 'ramon') {
        const pj1Res = await supabase.from('pj1_receitas').select('*').order('data', { ascending: false })
        setPj1Receitas((pj1Res.data as Pj1Receita[]) || [])
      }
      setLoading(false)
    }
    if (profile) fetchAll()
  }, [profile])

  const tabs = [
    { id: 'pf', label: 'PF' },
    ...(profile?.role === 'ramon' ? [{ id: 'pj1', label: 'PJ1' }] : []),
    { id: 'pj2', label: 'PJ2 — Sociedade' },
  ] as { id: 'pf' | 'pj1' | 'pj2'; label: string }[]

  const pfTotal = pfReceitas.reduce((s, r) => s + Number(r.valor), 0)
  const pj1Total = pj1Receitas.reduce((s, r) => s + Number(r.valor), 0)

  const pj2ValorFechado = pj2Servicos.reduce((s, sv) => s + Number(sv.valor_fechado), 0)
  const pj2Gastos = pj2Servicos.reduce((s, sv) => s + Number(sv.gastos), 0)
  const pj2Impostos = pj2Servicos.reduce((s, sv) => s + Number(sv.imposto), 0)
  const pj2Lucro = pj2ValorFechado - pj2Gastos - pj2Impostos
  const lucroSocio = pj2Lucro / 2

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral financeira</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PF Tab */}
      {activeTab === 'pf' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Recebido PF"
              value={formatBRL(pfTotal)}
              icon={<DollarSign size={20} />}
            />
            <StatCard
              title="Receitas Cadastradas"
              value={pfReceitas.length.toString()}
              icon={<TrendingUp size={20} />}
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Entradas por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={groupByMonth(pfReceitas.map(r => ({ data: r.data, valor: r.valor })))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Últimas Receitas PF</h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {pfReceitas.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{r.descricao}</p>
                    <p className="text-zinc-500 text-xs">{r.forma_pagamento} • {format(parseISO(r.data), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">{formatBRL(Number(r.valor))}</span>
                </div>
              ))}
              {pfReceitas.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-8">Nenhuma receita cadastrada</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PJ1 Tab (Ramon only) */}
      {activeTab === 'pj1' && profile?.role === 'ramon' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Recebido PJ1" value={formatBRL(pj1Total)} icon={<DollarSign size={20} />} />
            <StatCard title="Receitas Cadastradas" value={pj1Receitas.length.toString()} icon={<TrendingUp size={20} />} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Entradas por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupByMonth(pj1Receitas.map(r => ({ data: r.data, valor: r.valor })))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Últimas Receitas PJ1</h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {pj1Receitas.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{r.descricao}</p>
                    <p className="text-zinc-500 text-xs">Pago por: {r.quem_pagou} • {format(parseISO(r.data), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">{formatBRL(Number(r.valor))}</span>
                </div>
              ))}
              {pj1Receitas.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-8">Nenhuma receita cadastrada</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PJ2 Tab */}
      {activeTab === 'pj2' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard title="Valor Fechado Total" value={formatBRL(pj2ValorFechado)} icon={<Wallet size={20} />} />
            <StatCard title="Total Gastos" value={formatBRL(pj2Gastos)} icon={<ArrowUpRight size={20} />} />
            <StatCard title="Total Impostos" value={formatBRL(pj2Impostos)} icon={<DollarSign size={20} />} />
            <StatCard title="Lucro Total da Empresa" value={formatBRL(pj2Lucro)} icon={<TrendingUp size={20} />} accent />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Lucro Ramon" value={formatBRL(lucroSocio)} icon={<DollarSign size={20} />} accent />
            <StatCard title="Lucro Mano" value={formatBRL(lucroSocio)} icon={<DollarSign size={20} />} accent />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Lucro por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupByMonth(pj2Servicos.map(s => ({
                data: s.data_vencimento || s.created_at?.split('T')[0],
                valor: Number(s.valor_fechado) - Number(s.gastos) - Number(s.imposto),
              })))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
