"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { apiFetch } from "@/src/lib/api"
import { cn } from "@/src/lib/utils"
import { Search, Plus, Edit, Trash2, Mail, Phone } from "lucide-react"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/contacts")
      setContacts(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(c =>
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Contacts</h1>
              <p className="text-gray-400 text-sm mt-1">Manage customer contacts</p>
            </div>
            <button className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No contacts found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-semibold">
                        {contact.firstName} {contact.lastName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-accent-blue/20 rounded">
                        <Edit className="w-4 h-4 text-accent-blue" />
                      </button>
                      <button className="p-1 hover:bg-accent-red/20 rounded">
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-accent-blue">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-accent-blue">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  )
}