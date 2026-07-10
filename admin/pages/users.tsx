"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { apiFetch } from "@/src/lib/api"
import { cn } from "@/src/lib/utils"
import { Search, Trash2, Plus, X } from "lucide-react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "staff",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/admin/users")
      setUsers(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === "all" || u.role === filterRole
    return matchSearch && matchRole
  })

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      })
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
        setError("Please fill in all fields")
        return
      }

      await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      })

      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "staff",
      })
      setShowAddModal(false)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user")
    }
  }

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Admin Users</h1>
              <p className="text-gray-400 text-sm mt-1">Manage admin, staff, and cashier accounts</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent-green hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-accent-blue"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="auditor">Auditor</option>
              <option value="cashier">Cashier</option>
              <option value="staff">Staff</option>
            </select>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">EMAIL</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">NAME</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">ROLE</th>
                      <th className="text-center py-3 px-4 text-gray-400 text-xs font-medium">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                              user.role === "admin"
                                ? "bg-accent-orange/20 text-accent-orange"
                                : user.role === "auditor"
                                ? "bg-accent-purple/20 text-accent-purple"
                                : user.role === "cashier"
                                ? "bg-accent-blue/20 text-accent-blue"
                                : "bg-gray-600/20 text-gray-300"
                            }`}
                          >
                            <option value="admin">Admin</option>
                            <option value="auditor">Auditor</option>
                            <option value="cashier">Cashier</option>
                            <option value="staff">Staff</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="p-1 hover:bg-accent-red/20 rounded transition">
                            <Trash2 className="w-4 h-4 text-accent-red" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        page === p
                          ? "bg-accent-blue text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </GlassCard>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="cashier">Cashier - For POS operations</option>
                  <option value="auditor">Auditor - For reporting & audits</option>
                  <option value="staff">Staff - General staff member</option>
                  <option value="admin">Admin - Full system access</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-green hover:bg-green-600 text-white rounded-lg transition font-medium"
                >
                  Add User
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}