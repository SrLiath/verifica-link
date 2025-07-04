"use client"

import { useEffect, useRef } from "react"

interface SpeedMeterProps {
  speed: number
  maxSpeed: number
  threshold: number
  size: number
}

export default function SpeedMeter({ speed, maxSpeed, threshold, size }: SpeedMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return


    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) * 0.8


    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = "#374151"
    ctx.stroke()


    const percentage = Math.min(speed / maxSpeed, 1)
    const angle = Math.PI + percentage * Math.PI


    let color
    if (speed < threshold) {
      color = "#ef4444"
    } else if (speed < threshold * 2) {
      color = "#f59e0b"
    } else {
      color = "#10b981"
    }


    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, angle, false)
    ctx.lineWidth = 20
    ctx.lineCap = "round"
    ctx.strokeStyle = color
    ctx.stroke()


    ctx.font = "bold 24px Arial"
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${speed} MB`, centerX, centerY - 10)


    ctx.font = "14px Arial"
    ctx.fillStyle = "#9ca3af"
    ctx.fillText("Velocidade", centerX, centerY + 15)
  }, [speed, maxSpeed, threshold, size])

  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}
