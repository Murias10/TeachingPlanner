import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  minTime?: string
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ className, value = "00:00", onChange, minTime }, ref) => {
    const [hours, setHours] = React.useState(value.split(":")[0] || "00")
    const [minutes, setMinutes] = React.useState(value.split(":")[1] || "00")

    const minHour = minTime ? Number.parseInt(minTime.split(":")[0], 10) : null
    const minMinute = minTime ? Number.parseInt(minTime.split(":")[1], 10) : null

    // Minutos de 15 en 15 (00, 15, 30, 45)
    const minuteArray = ["00", "15", "30", "45"]

    const handleHourChange = (hour: string) => {
      setHours(hour)
      const h = Number.parseInt(hour, 10)
      let effectiveMinute = minutes
      if (minHour !== null && h === minHour) {
        const currentMin = Number.parseInt(minutes, 10)
        if (currentMin <= minMinute!) {
          const nextValidMinute = minuteArray.find(
            (m) => Number.parseInt(m, 10) > minMinute!
          )
          if (nextValidMinute) {
            effectiveMinute = nextValidMinute
            setMinutes(nextValidMinute)
          }
        }
      }
      const newValue = `${hour}:${effectiveMinute}`
      onChange?.(newValue)
    }

    const handleMinuteChange = (minute: string) => {
      setMinutes(minute)
      const newValue = `${hours}:${minute}`
      onChange?.(newValue)
    }

    // Horas de 09:00 a 21:00, filtrando las anteriores a minHour
    const hourArray = Array.from({ length: 13 }, (_, i) =>
      (i + 9).toString().padStart(2, "0")
    ).filter((hour) => {
      if (minHour === null) return true
      const h = Number.parseInt(hour, 10)
      if (h < minHour) return false
      return true
    })

    const isMinuteDisabled = (minute: string): boolean => {
      if (minHour === null) return false
      const h = Number.parseInt(hours, 10)
      if (h > minHour) return false
      if (h === minHour) return Number.parseInt(minute, 10) <= minMinute!
      return false
    }

    return (
      <div
        ref={ref}
        className={cn("flex gap-3 p-3 bg-background rounded-md", className)}
      >
        {/* Hours */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-center text-muted-foreground">Hora</label>
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
          <label className="text-xs font-semibold text-center text-muted-foreground">Minuto</label>
          <div className="border rounded-md p-1">
            <div className="flex flex-col gap-0.5">
              {minuteArray.map((minute) => (
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
