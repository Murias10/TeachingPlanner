import { EditDeleteTableButtons } from "@/components/common/EditDeleteTableButtons"

interface UserTableButtonsProps {
    onDelete: () => void;
    onEdit: () => void;
}

export function UserTableButtons({ onDelete, onEdit }: UserTableButtonsProps) {
    return <EditDeleteTableButtons onDelete={onDelete} onEdit={onEdit} />;
}
