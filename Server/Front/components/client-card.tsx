import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Client } from "@/lib/types"
import { CheckCircle2, XCircle, Activity, Clock, ArrowDown, ArrowUp, Wifi } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SpeedGauge from "./speed-gauge"

interface ClientCardProps {
  client: Client
  view: "grid" | "list"
}

export default function ClientCard({ client, view }: ClientCardProps) {
  const isUp = client.status === "up"

  return (
    <Card className={`overflow-hidden ${!isUp ? "border-red-500 dark:border-red-700 border-2" : ""}`}>
      <CardHeader className={`pb-2 ${!isUp ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{client.name}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">{client.location}</p>
          </div>
          <Badge variant={isUp ? "success" : "destructive"} className="uppercase">
            {isUp ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> UP
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> DOWN
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={`pt-4 ${view === "list" ? "grid grid-cols-1 md:grid-cols-3 gap-4" : ""}`}>
        <div className={`grid grid-cols-2 gap-4 ${view === "list" ? "col-span-2" : "mb-4"}`}>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              <Activity className="h-4 w-4" /> Latência
            </span>
            <span className="text-2xl font-bold">{client.metrics.latency} ms</span>
            <span
              className={`text-xs ${client.metrics.latencyTrend < 0 ? "text-green-500" : "text-red-500"} flex items-center`}
            >
              {client.metrics.latencyTrend < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
              {Math.abs(client.metrics.latencyTrend)}% nas últimas 24h
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              <Clock className="h-4 w-4" /> Uptime
            </span>
            <span className="text-2xl font-bold">{client.metrics.uptime}%</span>
            <Progress value={client.metrics.uptime} className="h-2 mt-2" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              <ArrowDown className="h-4 w-4" /> Download
            </span>
            <span className="text-2xl font-bold">{client.metrics.download} Mbps</span>
            <span
              className={`text-xs ${client.metrics.downloadTrend > 0 ? "text-green-500" : "text-red-500"} flex items-center`}
            >
              {client.metrics.downloadTrend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(client.metrics.downloadTrend)}% nas últimas 24h
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              <ArrowUp className="h-4 w-4" /> Upload
            </span>
            <span className="text-2xl font-bold">{client.metrics.upload} Mbps</span>
            <span
              className={`text-xs ${client.metrics.uploadTrend > 0 ? "text-green-500" : "text-red-500"} flex items-center`}
            >
              {client.metrics.uploadTrend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(client.metrics.uploadTrend)}% nas últimas 24h
            </span>
          </div>
        </div>

        <div className={`flex justify-center items-center ${view === "list" ? "" : "mt-2"}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <SpeedGauge
                  percentage={client.metrics.usage}
                  size={view === "list" ? 120 : 150}
                  status={client.status}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Uso de Disco: {client.metrics.usage}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wifi className={`h-5 w-5 ${isUp ? "text-green-500" : "text-red-500"}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">{client.ip}</span>
          </div>
          <span className="text-xs text-gray-500">Última verificação: {client.lastCheck}</span>
        </div>
      </CardContent>
    </Card>
  )
}
