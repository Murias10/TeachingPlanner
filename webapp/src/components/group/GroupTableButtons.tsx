import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Subject } from "@/types/Subject"
import { ChevronsRight, Trash2, Users, Check, X, Plus } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Group } from "@/types/Group"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"
import VITE_GATEWAY_API_URL from "@/config/api"
import { getAuthHeaders } from "@/utils/authHeaders"
import { useFloatingAlert } from "@/hooks/useFloatingAlert"

type Props = {
    readonly subject: Subject
    readonly onDeleteGroup?: (groupId: string) => void
    readonly onCreateGroup?: (subjectId: string) => void
}

export function GroupTableButtons({ subject, onDeleteGroup, onCreateGroup }: Readonly<Props>) {

    const { t } = useTranslation()
    const { triggerAlert } = useFloatingAlert()

    const [open, setOpen] = useState(false)
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
    const [editingHours, setEditingHours] = useState<string>("")
    const [groupHours, setGroupHours] = useState<Record<string, number | undefined>>({})

    const groupTypes = [
        { code: "T", label: "Teoría", color: "bg-blue-100 text-blue-800" },
        { code: "S", label: "Seminario", color: "bg-green-100 text-green-800" },
        { code: "L", label: "Laboratorio", color: "bg-purple-100 text-purple-800" },
        { code: "TG", label: "Tutoría Grupal", color: "bg-orange-100 text-orange-800" }
    ]

    const groupsByType = groupTypes.map(({ code, label, color }) => {
        const allGroups = subject.groups?.filter(g => g.type === code) || []
        return {
            code,
            label,
            color,
            groups: allGroups,
            groupsES: allGroups.filter(g => g.language === 'ES'),
            groupsEN: allGroups.filter(g => g.language === 'EN')
        }
    }).filter(({ groups }) => groups.length > 0)

    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        )
    }

    const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDeleteGroup) {
            onDeleteGroup(groupId)
        }
    }

    const handleDeleteSelected = () => {
        if (onDeleteGroup && selectedGroups.length > 0) {
            selectedGroups.forEach(groupId => {
                onDeleteGroup(groupId)
            })
            setSelectedGroups([])
            setOpen(false)
        }
    }

    const startEditingHours = (group: Group, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingGroupId(group.id)
        setEditingHours(group.planifiedHours?.toString() || "0")
    }

    const cancelEditingHours = () => {
        setEditingGroupId(null)
        setEditingHours("")
    }

    const saveEditingHours = async (groupId: string) => {
        const hours = parseFloat(editingHours)
        if (isNaN(hours) || hours < 0) {
            triggerAlert({
                title: "Error",
                description: "Las horas deben ser un número válido mayor o igual a 0",
                variant: "destructive"
            })
            return
        }

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/group/${groupId}/planified-hours`, {
                method: 'PATCH',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ planifiedHours: hours })
            })

            if (!response.ok) {
                throw new Error('Error al actualizar horas planificadas')
            }

            // Update local state
            setGroupHours(prev => ({ ...prev, [groupId]: hours }))
            setEditingGroupId(null)
            setEditingHours("")

            triggerAlert({
                title: "Horas actualizadas",
                description: "Las horas planificadas se han actualizado correctamente",
                variant: "success"
            })
        } catch (error) {
            triggerAlert({
                title: "Error",
                description: error instanceof Error ? error.message : "Error al actualizar horas",
                variant: "destructive"
            })
        }
    }

    const getGroupHours = (group: Group): number => {
        return groupHours[group.id] ?? group.planifiedHours ?? 0
    }

    const hasGroups = subject.groups && subject.groups.length > 0;
    const totalGroups = subject.groups?.length || 0;

    return (
        <div className="flex justify-end space-x-2">
            <Button
                variant="outline"
                size="lg"
                onClick={() => setOpen(true)}
                disabled={!hasGroups}
            >
                {t("table.groups.actions.manage.groups")} {hasGroups && `(${totalGroups})`}<ChevronsRight />
            </Button>

            <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-10"
                            onClick={() => onCreateGroup?.(subject.id)}
                        >
                            <Plus />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("table.groups.actions.create.group")}</p>
                    </TooltipContent>
                </Tooltip>
            </ProtectedComponent>

            <Sheet open={open} onOpenChange={setOpen} modal={true}>
                <SheetContent className="flex flex-col w-full sm:max-w-2xl p-0">
                    <SheetHeader className="px-4 pt-4 pb-3 space-y-1">
                        <SheetTitle className="text-base font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {subject.acronym}
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            {totalGroups} {totalGroups === 1 ? 'grupo' : 'grupos'}
                            {selectedGroups.length > 0 && ` · ${selectedGroups.length} seleccionado${selectedGroups.length > 1 ? 's' : ''}`}
                        </SheetDescription>
                    </SheetHeader>

                    <Separator />

                    <Tabs defaultValue={groupsByType[0]?.code} className="flex-1 flex flex-col">
                        <div className="flex justify-center px-4 pt-2 pb-3">
                            <TabsList>
                                {groupsByType.map(({ code, label }) => (
                                    <TabsTrigger
                                        key={code}
                                        value={code}
                                        className="min-w-24"
                                    >
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {groupsByType.map(({ code, groupsES, groupsEN }) => (
                            <TabsContent key={code} value={code} className="flex-1 m-0">
                                <ScrollArea className="h-full">
                                    <div className="grid grid-cols-2 gap-4 p-4">
                                        {/* Columna Español */}
                                        {groupsES.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium text-muted-foreground px-2">
                                                    Español
                                                </div>
                                                <div className="space-y-1.5">
                                                    {groupsES.map((group: Group) => (
                                                        <div
                                                            key={group.id}
                                                            className="relative flex items-center justify-between py-1.5 px-2 rounded border hover:bg-accent/50 transition-colors group"
                                                        >
                                                            <label
                                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedGroups.includes(group.id)}
                                                                    onCheckedChange={() => toggleGroupSelection(group.id)}
                                                                    className="h-3.5 w-3.5 shrink-0"
                                                                />
                                                                <span className="text-xs font-medium truncate">
                                                                    {group.type}.{group.number}
                                                                </span>
                                                            </label>

                                                            <div className="flex items-center gap-1">
                                                                {editingGroupId === group.id ? (
                                                                    <>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.5"
                                                                            value={editingHours}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                // Allow empty string for clearing
                                                                                if (value === '') {
                                                                                    setEditingHours(value);
                                                                                    return;
                                                                                }

                                                                                // Validate: only numbers, no negative, must be multiple of 0.5
                                                                                const numValue = Number.parseFloat(value);
                                                                                if (!Number.isNaN(numValue) && numValue >= 0) {
                                                                                    // Check if it's a valid decimal (0.5 increments)
                                                                                    const remainder = (numValue * 10) % 5;
                                                                                    if (remainder === 0) {
                                                                                        setEditingHours(value);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="h-6 w-16 text-xs px-1.5"
                                                                            autoFocus
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    saveEditingHours(group.id)
                                                                                } else if (e.key === 'Escape') {
                                                                                    cancelEditingHours()
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => saveEditingHours(group.id)}
                                                                            className="h-5 w-5 shrink-0"
                                                                        >
                                                                            <Check className="h-3 w-3 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={cancelEditingHours}
                                                                            className="h-5 w-5 shrink-0"
                                                                        >
                                                                            <X className="h-3 w-3 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => startEditingHours(group, e)}
                                                                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                                                                        title="Click para editar horas planificadas"
                                                                    >
                                                                        {getGroupHours(group)}h
                                                                    </button>
                                                                )}

                                                                {onDeleteGroup && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => handleDeleteGroup(group.id, e)}
                                                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity shrink-0"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Columna Inglés */}
                                        {groupsEN.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium text-muted-foreground px-2">
                                                    Inglés
                                                </div>
                                                <div className="space-y-1.5">
                                                    {groupsEN.map((group: Group) => (
                                                        <div
                                                            key={group.id}
                                                            className="relative flex items-center justify-between py-1.5 px-2 rounded border hover:bg-accent/50 transition-colors group"
                                                        >
                                                            <label
                                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedGroups.includes(group.id)}
                                                                    onCheckedChange={() => toggleGroupSelection(group.id)}
                                                                    className="h-3.5 w-3.5 shrink-0"
                                                                />
                                                                <span className="text-xs font-medium truncate">
                                                                    {group.type}.I-{group.number}
                                                                </span>
                                                            </label>

                                                            <div className="flex items-center gap-1">
                                                                {editingGroupId === group.id ? (
                                                                    <>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.5"
                                                                            value={editingHours}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                // Allow empty string for clearing
                                                                                if (value === '') {
                                                                                    setEditingHours(value);
                                                                                    return;
                                                                                }

                                                                                // Validate: only numbers, no negative, must be multiple of 0.5
                                                                                const numValue = Number.parseFloat(value);
                                                                                if (!Number.isNaN(numValue) && numValue >= 0) {
                                                                                    // Check if it's a valid decimal (0.5 increments)
                                                                                    const remainder = (numValue * 10) % 5;
                                                                                    if (remainder === 0) {
                                                                                        setEditingHours(value);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="h-6 w-16 text-xs px-1.5"
                                                                            autoFocus
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    saveEditingHours(group.id)
                                                                                } else if (e.key === 'Escape') {
                                                                                    cancelEditingHours()
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => saveEditingHours(group.id)}
                                                                            className="h-5 w-5 shrink-0"
                                                                        >
                                                                            <Check className="h-3 w-3 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={cancelEditingHours}
                                                                            className="h-5 w-5 shrink-0"
                                                                        >
                                                                            <X className="h-3 w-3 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => startEditingHours(group, e)}
                                                                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                                                                        title="Click para editar horas planificadas"
                                                                    >
                                                                        {getGroupHours(group)}h
                                                                    </button>
                                                                )}

                                                                {onDeleteGroup && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => handleDeleteGroup(group.id, e)}
                                                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity shrink-0"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <Separator />

                    <SheetFooter className="px-4 py-3 flex-row gap-2">
                        <SheetClose asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                                {t("common.close")}
                            </Button>
                        </SheetClose>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={selectedGroups.length === 0}
                            className="flex-1 h-8 text-xs"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            {t("common.delete")} {selectedGroups.length > 0 && `(${selectedGroups.length})`}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
