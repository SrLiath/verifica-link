import type { Client } from "@/lib/types"
import SpeedMeter from "./speed-meter"
import { CheckCircle, XCircle, Trash2 } from "lucide-react"

interface ClientMonitorProps {
  client: Client
}

export default function ClientMonitor({ client }: ClientMonitorProps) {
  const allLinksUp = client.links.every((link) => link.status === "UP")
  const allLinksDown = client.links.every((link) => link.status === "DOWN")
  console.log(client)
  let bgClass = "bg-gray-800"
  if (allLinksDown) {
    bgClass = "bg-red-900/30"
  } else if (!allLinksUp) {
    bgClass = "bg-yellow-900/30"
  }

  const handleDeleteClient = async () => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) return

    try {
      const res = await fetch(`http://193.123.117.91:3001/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {

      } else {
        alert('Erro ao excluir cliente.')
      }
    } catch (error) {
      console.error('Erro na exclusão:', error)
      alert('Falha ao conectar com o servidor.')
    }
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-700 ${bgClass}`}>
      <div className="p-3 border-b border-gray-700 bg-gray-800 relative">
        <h2 className="text-lg font-bold text-white text-center">{client.name}</h2>
        <button
          onClick={handleDeleteClient}
          className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
          title="Excluir cliente"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {client.links.map((link, index) => (
            <div key={index} className={`p-2 rounded-md ${link.status === "UP" ? "bg-green-900/30" : "bg-red-900/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Link {index + 1}</span>
                <div className="flex items-center">
                  {link.status === "UP" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-bold ${link.status === "UP" ? "text-green-500" : "text-red-500"}`}>
                    {link.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <SpeedMeter speed={client.speed} maxSpeed={100} threshold={30} size={150} />
        </div>
      </div>
    </div>
  )
}