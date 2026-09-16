import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, MapPin } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

export default function DeliveryZones() {
  const queryClient = useQueryClient()
  const [editingFees, setEditingFees] = useState({})
  const [newCity, setNewCity] = useState('')
  const [newFee, setNewFee] = useState('')

  const { data: zones, isLoading, isError, refetch } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get('/admin/delivery-zones').then(r => r.data)
  })

  const saveMutation = useMutation({
    mutationFn: ({ city, fee }) => api.put(`/admin/delivery-zones/${city}`, { fee }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      toast.success('Delivery fee updated')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Unable to update fee')
  })

  const deleteMutation = useMutation({
    mutationFn: (city) => api.delete(`/admin/delivery-zones/${city}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      toast.success('Zone removed')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Unable to remove zone')
  })

  const handleFeeChange = (city, value) => {
    setEditingFees((prev) => ({ ...prev, [city]: value }))
  }

  const handleSave = (city) => {
    const fee = editingFees[city]
    if (fee === undefined || fee === '' || isNaN(Number(fee)) || Number(fee) < 0) {
      return toast.error('Enter a valid fee amount')
    }
    saveMutation.mutate({ city, fee: Number(fee) })
  }

  const handleAddZone = () => {
    const city = newCity.trim().toLowerCase()
    if (!city) return toast.error('Enter a city name')
    if (!newFee || isNaN(Number(newFee)) || Number(newFee) < 0) return toast.error('Enter a valid fee amount')
    saveMutation.mutate({ city, fee: Number(newFee) }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
        toast.success('Zone added')
        setNewCity('')
        setNewFee('')
      }
    })
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Delivery Zones</h2>
      <p className="text-sm text-slate-500 mb-6">
        Set delivery fees by city. The <span className="font-medium">default</span> row applies
        to any city not listed below, and cannot be removed.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
          <input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="e.g. Nakuru"
            className="bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 w-48"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fee (KES)</label>
          <input
            type="number"
            min="0"
            value={newFee}
            onChange={(e) => setNewFee(e.target.value)}
            placeholder="500"
            className="bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 w-32"
          />
        </div>
        <button
          onClick={handleAddZone}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-pink-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
        >
          <Plus size={16} /> Add Zone
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading...</p>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>Unable to load delivery zones right now.</span>
          <button onClick={() => refetch()} className="font-medium underline">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Fee (KES)</th>
                <th className="px-4 py-3">Save</th>
                <th className="px-4 py-3">Remove</th>
              </tr>
            </thead>
            <tbody>
              {zones?.map((zone) => (
                <tr key={zone.city} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-slate-700 capitalize">
                      <MapPin size={14} className="text-pink-500" />
                      {zone.city}
                      {zone.city === 'default' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">fallback</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={editingFees[zone.city] ?? Number(zone.fee)}
                      onChange={(e) => handleFeeChange(zone.city, e.target.value)}
                      className="bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSave(zone.city)}
                      disabled={saveMutation.isPending}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {zone.city !== 'default' && (
                      <button
                        onClick={() => window.confirm(`Remove delivery zone "${zone.city}"?`) && deleteMutation.mutate(zone.city)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {zones?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No delivery zones set up yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}