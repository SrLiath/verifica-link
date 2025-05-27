"use client"

import { useState } from "react"
import ClientMonitor from "./client-monitor"
import { clientsData } from "@/lib/data"

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = clientsData.filter((client) => client.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Monitoramento de Links de Internet</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-300">
            Total de Clientes: {clientsData.length} | Online:{" "}
            {clientsData.filter((c) => c.links.every((link) => link.status === "UP")).length} | Parcial:{" "}
            {
              clientsData.filter(
                (c) => c.links.some((link) => link.status === "UP") && c.links.some((link) => link.status === "DOWN"),
              ).length
            }{" "}
            | Offline: {clientsData.filter((c) => c.links.every((link) => link.status === "DOWN")).length}
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="bg-gray-800 text-white px-4 py-2 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredClients.map((client) => (
          <ClientMonitor key={client.id} client={client} />
        ))}
      </div>
    </div>
  )
}
