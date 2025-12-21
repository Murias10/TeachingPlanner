import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Subject } from "@/types/Subject"
import { ChevronsRight, Trash2, Users } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Group } from "@/types/Group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"

type Props = {
    readonly subject: Subject
    readonly onDeleteGroup?: (groupId: string) => void
}

export function GroupTableButtons({ subject, onDeleteGroup }: Readonly<Props>) {

    const { t } = useTranslation()

    const [open, setOpen] = useState(false)
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])

    const groupTypes = [
        { code: "T", label: "Teoría", color: "bg-blue-100 text-blue-800" },
        { code: "S", label: "Seminario", color: "bg-green-100 text-green-800" },
        { code: "L", label: "Laboratorio", color: "bg-purple-100 text-purple-800" },
        { code: "TG", label: "Tutoría Grupal", color: "bg-orange-100 text-orange-800" }
    ]

    const groupsByType = groupTypes.map(({ code, label, color }) => ({
        code,
        label,
        color,
        groups: subject.groups?.filter(g => g.type === code) || []
    })).filter(({ groups }) => groups.length > 0)

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
                {t("table.groups.actions.select.groups")}<ChevronsRight />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
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

                    <ScrollArea className="flex-1 px-4">
                        <div className="grid grid-cols-2 gap-4 py-3">
                            {groupsByType.map(({ code, label, color, groups }) => (
                                <div key={code} className="space-y-2">
                                    <Badge className={`${color} text-xs px-2 py-0.5`}>
                                        {label}
                                    </Badge>

                                    <div className="grid grid-cols-2 gap-1.5">
                                        {groups.map((group: Group) => (
                                            <div
                                                key={group.id}
                                                className="relative flex items-center py-1.5 px-2 rounded border hover:bg-accent/50 transition-colors group"
                                            >
                                                <label
                                                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedGroups.includes(group.id)}
                                                        onCheckedChange={() => toggleGroupSelection(group.id)}
                                                        className="h-3.5 w-3.5 shrink-0"
                                                    />
                                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                                        <span className="text-xs font-medium truncate">
                                                            {group.type}.{group.language === 'EN' ? 'I-' : ''}{group.number}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                                            {group.language === 'EN' ? 'EN' : 'ES'}
                                                        </span>
                                                    </div>
                                                </label>
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
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

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
