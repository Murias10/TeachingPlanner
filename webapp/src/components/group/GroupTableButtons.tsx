import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Subject } from "@/types/Subject"
import { ChevronsRight, Trash2 } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer"
import { Group } from "@/types/Group"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Command,
    CommandList,
    CommandGroup,
    CommandItem
} from "@/components/ui/command"
import { useTranslation } from "react-i18next"

type Props = {
    subject: Subject
    onDeleteGroup?: (groupId: string) => void
}

export function GroupTableButtons({ subject, onDeleteGroup }: Props) {

    const { t } = useTranslation()

    const [open, setOpen] = useState(false)
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])

    const groupTypes = ["S", "L", "T"]
    const groupsByType = groupTypes.map(type => ({
        type,
        groups: subject.groups?.filter(g => g.type === type) || []
    }))

    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        )
    }

    const countSelectedByType = (type: string) => {
        return selectedGroups.filter(id =>
            subject.groups?.some(g => g.id === id && g.type === type)
        ).length
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

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>Grupos de {subject.name}</DrawerTitle>
                        <DrawerDescription>
                            Selecciona uno o varios grupos usando las opciones de abajo.
                        </DrawerDescription>
                    </DrawerHeader>

                    {/* Contenido desplazable si es muy alto */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {groupsByType.map(({ type, groups }) =>
                            groups.length > 0 && (
                                <div key={type} className="space-y-2 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-sm font-medium">{type} Groups</span>
                                        {countSelectedByType(type) > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                ({countSelectedByType(type)} selected)
                                            </span>
                                        )}
                                    </div>

                                    {/* Command centrado horizontal y verticalmente */}
                                    <div className="flex justify-center items-center">
                                        <Command className="border rounded-md w-64">
                                            {/* <CommandInput placeholder={`Search ${type} groups...`} /> */}
                                            <CommandList>
                                                <CommandGroup>
                                                    {groups.map((group: Group) => (
                                                        <CommandItem
                                                            key={group.id}
                                                            onSelect={() => {
                                                                toggleGroupSelection(group.id);
                                                            }}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center">
                                                                <Checkbox
                                                                    checked={selectedGroups.includes(group.id)}
                                                                    onCheckedChange={() => toggleGroupSelection(group.id)}
                                                                    className="mr-2"
                                                                />
                                                                {subject.acronym}.{group.type}.{group.language === 'EN' ? 'I-' : ''}{group.number}
                                                            </div>
                                                            {onDeleteGroup && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => handleDeleteGroup(group.id, e)}
                                                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </CommandItem>

                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Botones siempre abajo */}
                    <div className="p-4 flex justify-between space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline">{t("common.close")}</Button>
                        </DrawerClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            disabled={selectedGroups.length === 0}
                        >
                            {t("common.delete")} {selectedGroups.length > 0 && `(${selectedGroups.length})`}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
