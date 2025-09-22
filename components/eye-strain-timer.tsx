"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Eye, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"

type TimerState = "work" | "break" | "paused" | "stopped"

export function EyeStrainTimer() {
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes in seconds
  const [state, setState] = useState<TimerState>("stopped")
  const [workDuration] = useState(20 * 60) // 20 minutes
  const [breakDuration] = useState(20) // 20 seconds
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.png")
    audioRef.current.volume = 0.3
  }, [])

  // Timer logic
  useEffect(() => {
    if (state === "work" || state === "break") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (state === "work") {
              // Switch to break
              setState("break")
              playNotification()
              return breakDuration
            } else {
              // Break finished, back to work
              setState("work")
              setSessionsCompleted((prev) => prev + 1)
              playNotification()
              return workDuration
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, workDuration, breakDuration])

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback for browsers that don't allow autoplay
        console.log("Audio notification blocked")
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgress = () => {
    const total = state === "work" ? workDuration : breakDuration
    return ((total - timeLeft) / total) * 100
  }

  const handleStart = () => {
    if (state === "stopped") {
      setState("work")
      setTimeLeft(workDuration)
    } else if (state === "paused") {
      setState(timeLeft === breakDuration ? "break" : "work")
    }
  }

  const handlePause = () => {
    setState("paused")
  }

  const handleReset = () => {
    setState("stopped")
    setTimeLeft(workDuration)
  }

  const isActive = state === "work" || state === "break"
  const isBreakTime = state === "break"

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Eye className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-primary">20-20-20 Rule</h1>
        </div>
        <p className="text-muted-foreground text-lg">Reduce digital eye strain with regular breaks</p>
      </div>

      <Card className={cn("mb-6 transition-all duration-300", isBreakTime && "border-accent bg-accent/5")}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {isBreakTime ? (
              <>
                <Target className="h-5 w-5 text-accent" />
                Break Time!
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-primary" />
                Work Session
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isBreakTime
              ? "Look at something 20 feet away for 20 seconds"
              : "Focus on your work, break reminder coming soon"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div
              className={cn(
                "text-6xl font-mono font-bold mb-2 transition-colors",
                isBreakTime ? "text-accent" : "text-primary",
              )}
            >
              {formatTime(timeLeft)}
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {!isActive && state !== "paused" ? (
              <Button onClick={handleStart} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            ) : state === "paused" ? (
              <Button onClick={handleStart} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="lg" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={isBreakTime ? "secondary" : "default"} className="text-sm px-3 py-1">
              {state === "stopped" && "Ready to start"}
              {state === "paused" && "Paused"}
              {state === "work" && "Working"}
              {state === "break" && "Break time!"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{sessionsCompleted}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.floor((sessionsCompleted * 20) / 60)}h {(sessionsCompleted * 20) % 60}m
              </div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              20
            </div>
            <div>
              <div className="font-medium">Every 20 minutes</div>
              <div className="text-sm text-muted-foreground">Take a break from your screen</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              20
            </div>
            <div>
              <div className="font-medium">Look 20 feet away</div>
              <div className="text-sm text-muted-foreground">Focus on something in the distance</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              20
            </div>
            <div>
              <div className="font-medium">For 20 seconds</div>
              <div className="text-sm text-muted-foreground">Give your eyes time to relax</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
