import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PasswordRequirementsProps {
    password: string;
    showRequirements?: boolean;
}

export function PasswordRequirements({ password, showRequirements = true }: PasswordRequirementsProps) {
    const { t } = useTranslation();

    if (!showRequirements) return null;

    const requirements = [
        {
            key: 'min.length',
            label: t('error.password.min.length'),
            met: password.length >= 8
        },
        {
            key: 'uppercase',
            label: t('error.password.uppercase'),
            met: /[A-Z]/.test(password)
        },
        {
            key: 'lowercase',
            label: t('error.password.lowercase'),
            met: /[a-z]/.test(password)
        },
        {
            key: 'number',
            label: t('error.password.number'),
            met: /[0-9]/.test(password)
        },
        {
            key: 'special',
            label: t('error.password.special'),
            met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        }
    ];

    return (
        <div className="space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">{t("settings.password.requirementsTitle")}</p>
            <ul className="space-y-1">
                {requirements.map((req) => (
                    <li key={req.key} className="flex items-center gap-2">
                        {req.met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                            <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
