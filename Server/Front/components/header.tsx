"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, BellIcon } from "lucide-react"
import { useTheme } from "next-themes"

interface HeaderProps {
  currentTime: Date
}

export default function Header({ currentTime }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)


  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex items-center">
        <div className="mr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{currentTime.toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </Button>
        <Button variant="outline" size="icon">
          <BellIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
