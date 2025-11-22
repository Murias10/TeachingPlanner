import { useCallback, useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router-dom"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useAuth } from "@/contexts/AuthContext"
import { useListUsers } from "@/hooks/user/useListUsers"
import { useDeleteUser } from "@/hooks/user/useDeleteUser"
import { useDeleteUsers } from "@/hooks/user/useDeleteUsers"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { User } from "@/types/auth.types"
import { UserToolbar } from "@/components/user/UserToolbar"
import { UserTable } from "@/components/user/UserTable"
import { CreateUserDrawer } from "@/components/user/CreateUserDrawer"
import { EditUserDrawer } from "@/components/user/EditUserDrawer"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"

interface DeleteState {
    type: 'single' | 'bulk' | null;
    userId?: string;
    selectedIds?: string[];
}

const UserPage = () => {
    const { setItems } = useBreadcrumbContext()
    const { user: currentUser } = useAuth()
    const { triggerAlert } = useFloatingAlertContext()
    const { deleteUser } = useDeleteUser()
    const { deleteUsers } = useDeleteUsers()

    const isAdmin = currentUser?.role === "ADMIN"

    // Protección: Solo ADMIN puede acceder
    if (!isAdmin) {
        return <Navigate to="/home" replace />
    }

    const { data: allUsers = [], isLoading, error, refetch } = useListUsers()

    // Memoizar el array de usuarios filtrado
    const users = useMemo(() => {
        if (!currentUser?.id) return allUsers
        return allUsers.filter(u => u.id !== currentUser.id)
    }, [allUsers, currentUser?.id])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
    const [editDrawerOpen, setEditDrawerOpen] = useState(false)
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined)
    const [deleteState, setDeleteState] = useState<DeleteState>({ type: null })

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Usuarios", href: "/users" },
        ])
    }, [setItems])

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: "Error",
                description: "No se pudieron cargar los usuarios",
                variant: "destructive"
            })
        }
    }, [error, triggerAlert])

    const performDelete = useCallback(async (userId: string) => {
        const result = await deleteUser(userId, refetch);

        if (result.success) {
            triggerAlert({
                title: "Éxito",
                description: "Usuario eliminado correctamente",
                variant: "success",
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }

        return result.success;
    }, [deleteUser, refetch, triggerAlert]);

    const performBulkDelete = useCallback(async (userIds: string[]) => {
        const result = await deleteUsers(userIds, refetch);

        if (result.failedCount === 0) {
            triggerAlert({
                title: "Éxito",
                description: result.message,
                variant: "success",
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message,
                variant: result.deletedCount > 0 ? "default" : "destructive",
            });
        }

        return result.failedCount === 0;
    }, [deleteUsers, refetch, triggerAlert]);

    const handleDeleteClick = useCallback((userId: string) => {
        setDeleteState({
            type: 'single',
            userId
        });
    }, []);

    const handleDeleteSelectedUsers = useCallback(() => {
        if (selectedIds.length === 0) return;

        setDeleteState({
            type: 'bulk',
            selectedIds: [...selectedIds]
        });
    }, [selectedIds]);

    const confirmDelete = useCallback(async () => {
        let success = false;

        if (deleteState.type === 'single' && deleteState.userId) {
            success = await performDelete(deleteState.userId);
        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            success = await performBulkDelete(deleteState.selectedIds);
            if (success) {
                setSelectedIds([]);
            }
        }

        if (success) {
            setDeleteState({ type: null });
        }
    }, [deleteState, performDelete, performBulkDelete]);

    const handleEditClick = useCallback((userToEditData: User) => {
        setUserToEdit(userToEditData);
        setEditDrawerOpen(true);
    }, []);

    if (isLoading) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="space-y-4 mx-2">
                {/* Toolbar */}
                <UserToolbar
                    selectedIds={selectedIds}
                    deleteSelectedUsers={handleDeleteSelectedUsers}
                    onCreateClick={() => setCreateDrawerOpen(true)}
                />

                {/* Table */}
                <div className="bg-card rounded-xl p-4">
                    <UserTable
                        users={users}
                        deleteUser={handleDeleteClick}
                        editUser={handleEditClick}
                        setSelectedIds={setSelectedIds}
                        isAdmin={isAdmin}
                    />
                </div>
            </section>

            {/* Drawers */}
            <CreateUserDrawer
                open={createDrawerOpen}
                onOpenChange={setCreateDrawerOpen}
                onSuccess={refetch}
            />

            <EditUserDrawer
                open={editDrawerOpen}
                onOpenChange={setEditDrawerOpen}
                user={userToEdit}
                onSuccess={refetch}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteState.type !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteState({ type: null });
                    }
                }}
                onConfirm={confirmDelete}
                title={deleteState.type === 'single' ? 'Eliminar usuario' : 'Eliminar usuarios'}
                description={
                    deleteState.type === 'single'
                        ? `¿Deseas eliminar a ${users.find(u => u.id === deleteState.userId)?.email || 'este usuario'}? Esta acción no se puede deshacer.`
                        : `¿Deseas eliminar ${deleteState.selectedIds?.length || 0} usuario(s)? Esta acción no se puede deshacer.`
                }
            />
        </>
    );
};

export default UserPage;
