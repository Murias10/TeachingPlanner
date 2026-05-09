import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/RequiredLabel";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { useCreateUser } from "@/hooks/user/useCreateUser";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { isValidEmail } from "@/utils/emailValidation";

interface CreateUserDrawerProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly onSuccess?: () => void;
}

export function CreateUserDrawer({ open, onOpenChange, onSuccess }: CreateUserDrawerProps) {
    const { t } = useTranslation();
    const { createUser } = useCreateUser();
    const { triggerAlert } = useFloatingAlertContext();
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
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid =
        !!formData.unioviUser.trim() &&
        !!formData.name.trim() &&
        !!formData.firstSurname.trim() &&
        !!formData.secondSurname.trim() &&
        !!formData.email.trim();

    const handleSubmit = async () => {
        if (!isFormValid) return;
        if (!isValidEmail(formData.email)) {
            triggerAlert({ title: t("common.error"), description: t("users.validation.email.invalid"), variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const result = await createUser(formData);
        if (result.success) {
            triggerAlert({ title: t("common.success"), description: t("users.alerts.success.created"), variant: "success" });
            setFormData({ name: "", unioviUser: "", firstSurname: "", secondSurname: "", email: "", role: "PROFESSOR", sendEmail: false });
            onOpenChange(false);
            onSuccess?.();
        } else {
            const description = result.status === 409
                ? t("users.alerts.error.emailDuplicate")
                : t("users.alerts.error.create");
            triggerAlert({ title: t("common.error"), description, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("users.create.title")}
            description={t("users.create.description")}
            onSave={handleSubmit}
            onCancel={() => {}}
            isValid={isFormValid && !isSubmitting}
            isLoading={isSubmitting}
            saveLabel={isSubmitting ? `${t("users.create.save")}...` : t("users.create.save")}
            cancelLabel={t("users.create.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="unioviUser" required>{t("users.create.unioviUser")}</RequiredLabel>
                <Input
                    id="unioviUser"
                    placeholder={t("users.create.unioviUserPlaceholder")}
                    value={formData.unioviUser}
                    onChange={(e) => handleInputChange("unioviUser", e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="name" required>{t("users.create.name")}</RequiredLabel>
                <Input
                    id="name"
                    placeholder={t("users.create.namePlaceholder")}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="firstSurname" required>{t("users.create.firstSurname")}</RequiredLabel>
                <Input
                    id="firstSurname"
                    placeholder={t("users.create.firstSurnamePlaceholder")}
                    value={formData.firstSurname}
                    onChange={(e) => handleInputChange("firstSurname", e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="secondSurname" required>{t("users.create.secondSurname")}</RequiredLabel>
                <Input
                    id="secondSurname"
                    placeholder={t("users.create.secondSurnamePlaceholder")}
                    value={formData.secondSurname}
                    onChange={(e) => handleInputChange("secondSurname", e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="email" required>{t("users.create.email")}</RequiredLabel>
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
                                    {formData.role === "ADMIN" ? t("users.create.roleAdmin") : t("users.create.roleProfessor")}
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
                                    <span className="text-xs text-muted-foreground">{t("users.create.roleAdmin")}</span>
                                </div>
                            </div>
                        </SelectItem>
                        <SelectItem value="PROFESSOR">
                            <div className="flex items-center gap-3 py-1">
                                <Badge className="bg-blue-100 text-blue-800">PROFESSOR</Badge>
                                <div className="flex flex-col">
                                    <span className="font-medium">PROFESSOR</span>
                                    <span className="text-xs text-muted-foreground">{t("users.create.roleProfessor")}</span>
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
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmail: checked as boolean }))}
                        disabled={isSubmitting}
                    />
                    <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                        {t("users.create.sendEmail")}
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                    {t("users.create.sendEmailDescription")}
                </p>
            </div>
        </FormDrawer>
    );
}
