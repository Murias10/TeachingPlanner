import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateUser } from "@/hooks/user/useCreateUser";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";

interface CreateUserDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateUserDrawer({ open, onOpenChange, onSuccess }: CreateUserDrawerProps) {
    const { t, i18n } = useTranslation();
    const { createUser } = useCreateUser();
    const { triggerAlert } = useFloatingAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        unioviUser: "",
        firstSurname: "",
        secondSurname: "",
        email: "",
        role: "PROFESSOR",
        sendEmail: false,
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            triggerAlert({
                title: t("common.error"),
                description: t("users.validation.name.required"),
                variant: "destructive"
            });
            return false;
        }
        if (!formData.firstSurname.trim()) {
            triggerAlert({
                title: t("common.error"),
                description: t("users.validation.surnames.required"),
                variant: "destructive"
            });
            return false;
        }
        if (!formData.secondSurname.trim()) {
            triggerAlert({
                title: t("common.error"),
                description: t("users.validation.surnames.required"),
                variant: "destructive"
            });
            return false;
        }
        if (!formData.email.trim()) {
            triggerAlert({
                title: t("common.error"),
                description: t("users.validation.email.required"),
                variant: "destructive"
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        const result = await createUser({
            ...formData,
            language: i18n.language
        });

        if (result.success) {
            triggerAlert({
                title: t("common.success"),
                description: t("users.alerts.success.created"),
                variant: "success"
            });
            setFormData({
                name: "",
                unioviUser: "",
                firstSurname: "",
                secondSurname: "",
                email: "",
                role: "PROFESSOR",
                sendEmail: false,
            });
            onOpenChange(false);
            onSuccess?.();
        } else {
            triggerAlert({
                title: t("common.error"),
                description: result.message,
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col max-h-screen">
                <DrawerHeader>
                    <DrawerTitle>{t("users.create.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("users.create.description")}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido desplazable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="unioviUser">{t("users.create.unioviUser")}</Label>
                        <Input
                            id="unioviUser"
                            placeholder={t("users.create.unioviUserPlaceholder")}
                            value={formData.unioviUser}
                            onChange={(e) => handleInputChange("unioviUser", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="name">{t("users.create.name")}</Label>
                        <Input
                            id="name"
                            placeholder={t("users.create.namePlaceholder")}
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="firstSurname">{t("users.create.firstSurname")}</Label>
                        <Input
                            id="firstSurname"
                            placeholder={t("users.create.firstSurnamePlaceholder")}
                            value={formData.firstSurname}
                            onChange={(e) => handleInputChange("firstSurname", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="secondSurname">{t("users.create.secondSurname")}</Label>
                        <Input
                            id="secondSurname"
                            placeholder={t("users.create.secondSurnamePlaceholder")}
                            value={formData.secondSurname}
                            onChange={(e) => handleInputChange("secondSurname", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="email">{t("users.create.email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t("users.create.emailPlaceholder")}
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <Label htmlFor="role">{t("users.create.role")}</Label>
                        <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                            <SelectTrigger id="role" disabled={isSubmitting} className="w-full">
                                <SelectValue placeholder={t("users.create.rolePlaceholder")}>
                                    <div className="flex items-center gap-2">
                                        <Badge className={formData.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                            {formData.role}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {formData.role === "ADMIN"
                                                ? t("users.create.roleAdmin")
                                                : t("users.create.roleProfessor")}
                                        </span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">
                                    <div className="flex items-center gap-3 py-1">
                                        <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
                                        <div className="flex flex-col">
                                            <span className="font-medium">ADMIN</span>
                                            <span className="text-xs text-muted-foreground">
                                                {t("users.create.roleAdmin")}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="PROFESSOR">
                                    <div className="flex items-center gap-3 py-1">
                                        <Badge className="bg-blue-100 text-blue-800">PROFESSOR</Badge>
                                        <div className="flex flex-col">
                                            <span className="font-medium">PROFESSOR</span>
                                            <span className="text-xs text-muted-foreground">
                                                {t("users.create.roleProfessor")}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendEmail"
                                checked={formData.sendEmail}
                                onCheckedChange={(checked) =>
                                    setFormData(prev => ({ ...prev, sendEmail: checked as boolean }))
                                }
                                disabled={isSubmitting}
                            />
                            <Label
                                htmlFor="sendEmail"
                                className="text-sm font-normal cursor-pointer"
                            >
                                {t("users.create.sendEmail")}
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                            {t("users.create.sendEmailDescription")}
                        </p>
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" disabled={isSubmitting}>
                            {t("users.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? `${t("users.create.save")}...` : t("users.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
