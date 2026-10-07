import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Mail, Download, Trash2, Search, UserX, UserCheck } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const LIMIT = 25

export default function Subscribers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscribers', { search, status, page }],
    queryFn: () =>
      api.get('/subscribers', { params: { search, status, page, limit: LIMIT } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['subscribers'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/subscribers/${id}`, { isActive }),
    onSuccess: () => { refresh(); toast.success('Subscriber updated') },
    onError: (err) => toast.error(err.response?.data?.error || 'Unable to update subscriber'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/subscribers/${id}`),
    onSuccess: () => { refresh(); toast.success('Subscriber removed') },
    onError: (err) => toast.error(err.response?.data?.error || 'Unable to remove subscriber'),
  })

  const handleDelete = (s) => {
    if (window.confirm(`Remove ${s.email} from the list for good?`)) deleteMutation.mutate(s.id)
  }

  const exportCsv = async (which) => {
    try {
      const res = await api.get('/subscribers/export', { params: { status: which }, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscribers-${which}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Unable to export subscribers')
    }
  }

  const counts = data?.counts || { all: 0, active: 0, unsubscribed: 0 }
  const subscribers = data?.subscribers || []
  const pages = data?.pages || 1

  const stats = [
    { label: 'Total', value: counts.all, color: 'text-slate-900' },
    { label: 'Active', value: counts.active, color: 'text-green-600' },
    { label: 'Unsubscribed', value: counts.unsubscribed, color: 'text-slate-500' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={20} className="text-pink-500" /> Subscribers
          </h1>
          <p className="text-xs text-slate-500">People who joined from the store footer</p>
        </div>
        <button
          onClick={() => exportCsv('active')}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Download size={14} /> Export active (CSV)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-rose-100 bg-white/80 p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search email..."
            className="w-full rounded-xl border border-rose-100 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white/80">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-slate-500">Loading...</p>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Couldn&apos;t load subscribers.{' '}
            <button onClick={() => refetch()} className="text-pink-600 underline">Try again</button>
          </div>
        ) : subscribers.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No subscribers found.</p>
        ) : (
          <ul className="divide-y divide-rose-50">
            {subscribers.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{s.email}</p>
                  <p className="text-[11px] text-slate-500">
                    Joined {new Date(s.subscribedAt).toLocaleDateString()} · {s.source}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Unsubscribed'}
                  </span>
                  <button
                    title={s.isActive ? 'Unsubscribe' : 'Re-activate'}
                    aria-label={s.isActive ? 'Unsubscribe' : 'Re-activate'}
                    onClick={() => toggleMutation.mutate({ id: s.id, isActive: !s.isActive })}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {s.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => handleDelete(s)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-rose-100 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-rose-100 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
