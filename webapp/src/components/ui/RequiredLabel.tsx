import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RequiredLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean
}

export function RequiredLabel({ required, children, className, ...props }: RequiredLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
    </Label>
  )
}
