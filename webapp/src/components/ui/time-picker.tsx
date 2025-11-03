import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ className, value = "00:00", onChange }, ref) => {
    const [hours, setHours] = React.useState(value.split(":")[0] || "00")
    const [minutes, setMinutes] = React.useState(value.split(":")[1] || "00")

    const handleHourChange = (hour: string) => {
      setHours(hour)
      const newValue = `${hour}:${minutes}`
      onChange?.(newValue)
    }

    const handleMinuteChange = (minute: string) => {
      setMinutes(minute)
      const newValue = `${hours}:${minute}`
      onChange?.(newValue)
    }

    const hourArray = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, "0")
    )
    const minuteArray = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, "0")
    )

    return (
      <div
        ref={ref}
        className={cn("flex gap-2 p-3 bg-background rounded-md", className)}
      >
        {/* Hours */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-center">Hora</label>
          <ScrollArea className="h-48 border rounded-md">
            <div className="flex flex-col">
              {hourArray.map((hour) => (
                <Button
                  key={hour}
                  variant={hours === hour ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none justify-center text-xs h-8"
                  onClick={() => handleHourChange(hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Separator */}
        <div className="flex items-center">
          <span className="text-lg font-semibold">:</span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-center">Minuto</label>
          <ScrollArea className="h-48 border rounded-md">
            <div className="flex flex-col">
              {minuteArray.map((minute) => (
                <Button
                  key={minute}
                  variant={minutes === minute ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none justify-center text-xs h-8"
                  onClick={() => handleMinuteChange(minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }
