"use client"

import { useState, useEffect } from "react"
import ClientMonitor from "./client-monitor"
import { fetchClients } from "@/lib/data"
import { Client } from "@/lib/types"

export default function Dashboard() {
  const [clientsData, setClientsData] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)


  const [showModal, setShowModal] = useState(false)
  const [clienteNome, setClienteNome] = useState("")
  const [clienteDescricao, setClienteDescricao] = useState("")
  const [respostaServidor, setRespostaServidor] = useState<{ name: string } | null>(null)


  useEffect(() => {
    let intervalId

    async function loadClients() {
      const data = await fetchClients()
      if (data) {
        setClientsData(data)
        setLoading(false)
      }
    }

    loadClients()

    intervalId = setInterval(async () => {
      const data = await fetchClients()
      if (data) {
        setClientsData(data)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])


  const handleOpenModal = () => {
    setClienteNome("")
    setClienteDescricao("")
    setRespostaServidor(null)
    setShowModal(true)
  }


  const handleCloseModal = () => {
    setShowModal(false)
  }


  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      const response = await fetch("http://193.123.117.91:3001/insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: clienteNome,
          description: clienteDescricao,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.log(response)
        throw new Error("Erro ao inserir cliente")
      }

      setRespostaServidor(result)


      const updatedClients = await fetchClients()
      if (updatedClients) {
        setClientsData(updatedClients)
      }

    } catch (error) {
      alert("Erro ao enviar dados.")
      console.error(error)
    }
  }

  const filteredClients = clientsData.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalClientes = clientsData.length
  const onlineClientes = clientsData.filter((c) =>
    c.links.every((link) => link.status === "UP")
  ).length
  const parcialClientes = clientsData.filter(
    (c) =>
      c.links.some((link) => link.status === "UP") &&
      c.links.some((link) => link.status === "DOWN")
  ).length
  const offlineClientes = clientsData.filter((c) =>
    c.links.every((link) => link.status === "DOWN")
  ).length

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Carregando clientes...
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Monitoramento de Links de Internet</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-300">
            Total de Clientes: {totalClientes} | Online: {onlineClientes} | Parcial: {parcialClientes} | Offline: {offlineClientes}
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Adicionar Cliente
            </button>
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
        </div>
      </header>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg m-20  w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Adicionar Novo Cliente</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-md focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  value={clienteDescricao}
                  onChange={(e) => setClienteDescricao(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-md focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* Exibe resposta do servidor */}
            {respostaServidor && (
              <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-300">
                <strong>Para adicionar execute:</strong>{'\n'}<br></br>
                <i>mikrotik.exe -ip=192.168.88.1:8728 -user=admin -pass=mudar@123 -token="{respostaServidor.name}" -ws=ws://193.123.117.91:3001/ws -delay=1</i>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientMonitor key={client.id} client={client} />
          ))
        ) : (
          <p className="text-gray-400 col-span-full">Nenhum cliente encontrado.</p>
        )}
      </div>
    </div>
  )
}