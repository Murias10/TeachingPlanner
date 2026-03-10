import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  className?: string
  minTime?: string
}

const MINUTES = ["00", "15", "30", "45"]
const HOURS = Array.from({ length: 13 }, (_, i) => (i + 9).toString().padStart(2, "0"))

const parseHM = (time: string) => {
  const [h, m] = time.split(":")
  return { h: Number.parseInt(h, 10), m: Number.parseInt(m, 10) }
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ className, value = "09:00", onChange, onComplete, minTime }, ref) => {
    const [hours, setHours] = React.useState(value.split(":")[0] || "09")
    const [minutes, setMinutes] = React.useState(value.split(":")[1] || "00")

    const min = minTime ? parseHM(minTime) : null

    const hourArray = min
      ? HOURS.filter((h) => Number.parseInt(h, 10) >= min.h)
      : HOURS

    const isMinuteDisabled = (minute: string): boolean => {
      if (!min) return false
      const h = Number.parseInt(hours, 10)
      if (h > min.h) return false
      if (h === min.h) return Number.parseInt(minute, 10) <= min.m
      return false
    }

    const handleHourChange = (hour: string) => {
      setHours(hour)
      const h = Number.parseInt(hour, 10)
      let effectiveMinute = minutes
      if (min && h === min.h && Number.parseInt(minutes, 10) <= min.m) {
        const next = MINUTES.find((m) => Number.parseInt(m, 10) > min.m)
        effectiveMinute = next ?? effectiveMinute
        if (next) setMinutes(next)
      }
      onChange?.(`${hour}:${effectiveMinute}`)
    }

    const handleMinuteChange = (minute: string) => {
      setMinutes(minute)
      const newValue = `${hours}:${minute}`
      onChange?.(newValue)
      onComplete?.(newValue)
    }

    return (
      <div
        ref={ref}
        className={cn("flex gap-3 p-3 bg-background rounded-md", className)}
      >
        {/* Hours */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-xs font-semibold text-center text-muted-foreground">Hora</span>
          <ScrollArea className="h-[154px] border rounded-md">
            <div className="flex flex-col p-1">
              {hourArray.map((hour) => (
                <Button
                  key={hour}
                  variant={hours === hour ? "default" : "ghost"}
                  size="sm"
                  className="rounded-sm justify-center text-sm h-9 mb-0.5 font-medium"
                  onClick={() => handleHourChange(hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Separator */}
        <div className="flex items-center pt-7">
          <span className="text-xl font-bold text-muted-foreground">:</span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-xs font-semibold text-center text-muted-foreground">Minuto</span>
          <div className="border rounded-md p-1">
            <div className="flex flex-col gap-0.5">
              {MINUTES.map((minute) => (
                <Button
                  key={minute}
                  variant={minutes === minute ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-sm justify-center text-sm h-9 font-medium",
                    isMinuteDisabled(minute) && "opacity-40 line-through cursor-not-allowed"
                  )}
                  onClick={() => handleMinuteChange(minute)}
                  disabled={isMinuteDisabled(minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }
