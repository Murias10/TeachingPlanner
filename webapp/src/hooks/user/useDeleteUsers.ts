import { useCallback } from "react"
import { useDeleteUser } from "./useDeleteUser"

interface DeleteUsersResponse {
    success: boolean;
    message: string;
    deletedCount: number;
    failedCount: number;
    errors: Array<{ userId: string; message: string }>;
}

export const useDeleteUsers = () => {
    const { deleteUser } = useDeleteUser();

    const deleteUsers = useCallback(async (
        userIds: string[],
        refetch?: () => void
    ): Promise<DeleteUsersResponse> => {
        const results = {
            success: true,
            message: "",
            deletedCount: 0,
            failedCount: 0,
            errors: [] as Array<{ userId: string; message: string }>
        };

        for (const userId of userIds) {
            const result = await deleteUser(userId);

            if (result.success) {
                results.deletedCount++;
            } else {
                results.failedCount++;
                results.success = false;
                results.errors.push({
                    userId,
                    message: result.message
                });
            }
        }

        if (results.deletedCount > 0 && refetch) {
            refetch();
        }

        if (results.failedCount === 0) {
            results.message = `${results.deletedCount} usuario(s) eliminado(s) correctamente`;
        } else if (results.deletedCount === 0) {
            results.message = `Error al eliminar ${results.failedCount} usuario(s)`;
        } else {
            results.message = `${results.deletedCount} usuario(s) eliminado(s), ${results.failedCount} error(es)`;
        }

        return results;
    }, [deleteUser]);

    return { deleteUsers };
}
