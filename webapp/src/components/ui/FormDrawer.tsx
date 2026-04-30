import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

interface FormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onSave: () => void
    onCancel: () => void
    isValid: boolean
    isLoading?: boolean
    saveLabel: string
    cancelLabel: string
    children: React.ReactNode
}

export function FormDrawer({
    open,
    onOpenChange,
    title,
    description,
    onSave,
    onCancel,
    isValid,
    isLoading = false,
    saveLabel,
    cancelLabel,
    children,
}: FormDrawerProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{title}</DrawerTitle>
                    <DrawerDescription>{description}</DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {children}
                </div>

                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                            {cancelLabel}
                        </Button>
                    </DrawerClose>
                    <Button onClick={onSave} disabled={!isValid || isLoading}>
                        {saveLabel}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
