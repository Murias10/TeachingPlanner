import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/RequiredLabel";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { useUpdateUser } from "@/hooks/user/useUpdateUser";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { User } from "@/types/auth.types";

export interface EditUserFormData {
    unioviUser: string;
    name: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
}

interface EditUserDrawerProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly user?: User;
    readonly onSuccess?: () => void;
}

export function EditUserDrawer({ open, onOpenChange, user, onSuccess }: EditUserDrawerProps) {
    const { t } = useTranslation();
    const { updateUser } = useUpdateUser();
    const { triggerAlert } = useFloatingAlertContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [unioviUser, setUnioviUser] = useState("");
    const [name, setName] = useState("");
    const [firstSurname, setFirstSurname] = useState("");
    const [secondSurname, setSecondSurname] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        if (user) {
            setUnioviUser(user.unioviUser ?? "");
            setName(user.name);
            setFirstSurname(user.firstSurname);
            setSecondSurname(user.secondSurname);
            setRole(user.role);
        }
    }, [user, open]);

    const isFormValid =
        !!unioviUser.trim() && !!name.trim() && !!firstSurname.trim() && !!secondSurname.trim() &&
        !!user && (
            unioviUser !== (user.unioviUser ?? "") ||
            name !== user.name ||
            firstSurname !== user.firstSurname ||
            secondSurname !== user.secondSurname ||
            role !== user.role
        );

    const handleSubmit = async () => {
        if (!user || !isFormValid) return;

        setIsSubmitting(true);
        const result = await updateUser(user.id, {
            unioviUser: unioviUser.trim(),
            name: name.trim(),
            firstSurname: firstSurname.trim(),
            secondSurname: secondSurname.trim(),
            role
        });

        if (result.success) {
            triggerAlert({ title: t("common.success"), description: t("users.edit.success"), variant: "success" });
            onOpenChange(false);
            onSuccess?.();
        } else {
            triggerAlert({ title: t("common.error"), description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    if (!user) return null;

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("users.edit.title")}
            description={t("users.edit.description", { email: user.email })}
            onSave={handleSubmit}
            onCancel={() => {}}
            isValid={isFormValid}
            isLoading={isSubmitting}
            saveLabel={isSubmitting ? t("users.edit.saving") : t("users.edit.save")}
            cancelLabel={t("users.edit.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="unioviUser" required>{t("users.edit.unioviUser")}</RequiredLabel>
                <Input
                    id="unioviUser"
                    value={unioviUser}
                    onChange={(e) => setUnioviUser(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={t("users.edit.unioviUserPlaceholder")}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded text-sm">{user.email}</div>
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="name" required>{t("users.edit.name")}</RequiredLabel>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={t("users.edit.namePlaceholder")}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="firstSurname" required>{t("users.edit.firstSurname")}</RequiredLabel>
                <Input
                    id="firstSurname"
                    value={firstSurname}
                    onChange={(e) => setFirstSurname(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={t("users.edit.firstSurnamePlaceholder")}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="secondSurname" required>{t("users.edit.secondSurname")}</RequiredLabel>
                <Input
                    id="secondSurname"
                    value={secondSurname}
                    onChange={(e) => setSecondSurname(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={t("users.edit.secondSurnamePlaceholder")}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="role" required>{t("users.edit.role")}</RequiredLabel>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" disabled={isSubmitting} className="w-full">
                        <SelectValue placeholder={t("users.edit.rolePlaceholder")}>
                            {role && (
                                <div className="flex items-center gap-2">
                                    <Badge className={role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                        {role}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {role === "ADMIN" ? t("users.edit.roleAdmin") : t("users.edit.roleProfessor")}
                                    </span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">
                            <div className="flex items-center gap-3 py-1">
                                <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
                                <div className="flex flex-col">
                                    <span className="font-medium">ADMIN</span>
                                    <span className="text-xs text-muted-foreground">{t("users.edit.roleAdmin")}</span>
                                </div>
                            </div>
                        </SelectItem>
                        <SelectItem value="PROFESSOR">
                            <div className="flex items-center gap-3 py-1">
                                <Badge className="bg-blue-100 text-blue-800">PROFESSOR</Badge>
                                <div className="flex flex-col">
                                    <span className="font-medium">PROFESSOR</span>
                                    <span className="text-xs text-muted-foreground">{t("users.edit.roleProfessor")}</span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </FormDrawer>
    );
}
