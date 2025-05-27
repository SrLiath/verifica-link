"use client"

import { useEffect, useRef } from "react"

interface SpeedGaugeProps {
  percentage: number
  size: number
  status: "up" | "down"
}

export default function SpeedGauge({ percentage, size, status }: SpeedGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) * 0.8

    // Desenha o arco de fundo
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = "#e5e7eb"
    ctx.stroke()

    // Calcula o ângulo com base na porcentagem
    const angle = Math.PI + (percentage / 100) * Math.PI

    // Determina a cor com base no status e na porcentagem
    let color
    if (status === "down") {
      color = "#ef4444" // Vermelho
    } else if (percentage > 80) {
      color = "#f59e0b" // Amarelo
    } else {
      color = "#10b981" // Verde
    }

    // Desenha o arco de progresso
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, angle, false)
    ctx.lineWidth = 20
    ctx.lineCap = "round"
    ctx.strokeStyle = color
    ctx.stroke()

    // Desenha o texto da porcentagem
    ctx.font = "bold 24px Arial"
    ctx.fillStyle = status === "up" ? "#1f2937" : "#ef4444"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${percentage}%`, centerX, centerY - 10)

    // Desenha o texto "Uso"
    ctx.font = "14px Arial"
    ctx.fillStyle = "#6b7280"
    ctx.fillText("Uso", centerX, centerY + 15)

    // Desenha o ícone
    const iconSize = 30
    const iconY = centerY - radius - iconSize / 2 - 10

    ctx.fillStyle = color
    ctx.beginPath()

    // Desenha um ícone simples de servidor
    ctx.rect(centerX - iconSize / 4, iconY, iconSize / 2, iconSize)
    ctx.fill()

    // Linhas horizontais do servidor
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(centerX - iconSize / 6, iconY + 6, iconSize / 3, 2)
    ctx.fillRect(centerX - iconSize / 6, iconY + 12, iconSize / 3, 2)
    ctx.fillRect(centerX - iconSize / 6, iconY + 18, iconSize / 3, 2)
  }, [percentage, size, status])

  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}
