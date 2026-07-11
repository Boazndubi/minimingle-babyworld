import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users as UsersIcon, Eye, X, ShoppingBag, Mail, Phone, Shield, User } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

export default function Users() {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/admin/users').then(r => r.data)
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User role updated')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error')
  })

  const filtered = users?.filter(user => {
    const matchRole = roleFilter ? user.role === roleFilter : true
    const matchSearch = search
      ? user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchRole && matchSearch
  })

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Users</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 w-64"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-slate-800">{users?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Customers</p>
          <p className="text-2xl font-bold text-slate-800">
            {users?.filter(u => u.role === 'customer').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Admins</p>
          <p className="text-2xl font-bold text-slate-800">
            {users?.filter(u => u.role === 'admin').length || 0}
          </p>
        </div>
      </div>

      {isLoading ? <p className="text-slate-400">Loading...</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(user => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-pink-600 text-xs font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <span className="font-medium text-slate-700">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedUser(user)}
                      className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button onClick={() => setSelectedUser(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-pink-600 text-xl font-bold">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selectedUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-pink-500" />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-pink-500" />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={14} className="text-pink-500" />
                  <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Change Role */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Change Role</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateRoleMutation.mutate({ id: selectedUser.id, role: 'customer' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedUser.role === 'customer'
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    Customer
                  </button>
                  <button
                    onClick={() => updateRoleMutation.mutate({ id: selectedUser.id, role: 'admin' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    Admin
                  </button>
                </div>
              </div>

              <button onClick={() => setSelectedUser(null)}
                className="w-full bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}