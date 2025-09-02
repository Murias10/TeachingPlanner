import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Subject } from "@/types/Subject"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from "lucide-react"
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
    CommandInput,
    CommandList,
    CommandGroup,
    CommandItem
} from "@/components/ui/command"

type Props = {
    subject: Subject
}

export function GroupTableButtons({ subject }: Props) {
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

    return (
        <div className="flex justify-end space-x-2">
            <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
                Select Groups
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(subject.id)}>Copy ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View details</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
                                            <CommandInput placeholder={`Search ${type} groups...`} />
                                            <CommandList>
                                                <CommandGroup>
                                                    {groups.map((group: Group) => (
                                                        <CommandItem
                                                            key={group.id}
                                                            onSelect={() => toggleGroupSelection(group.id)}
                                                        >
                                                            <Checkbox
                                                                checked={selectedGroups.includes(group.id)}
                                                                onCheckedChange={() => toggleGroupSelection(group.id)}
                                                                className="mr-2"
                                                            />
                                                            {group.type}-{group.number}
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
                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                        <Button onClick={() => console.log("Selected Groups:", selectedGroups)}>Save</Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
