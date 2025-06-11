import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export function LanguageSelector() {
    const { i18n } = useTranslation();

    // Idiomas soportados
    useEffect(() => {
        const supportedLanguages = ["en", "fr", "es", "de"];
        // Solo cambiar si no hay idioma guardado
        if (!localStorage.getItem("i18nextLng")) {
            const systemLang = navigator.language.split("-")[0];
            const langToSet = supportedLanguages.includes(systemLang) ? systemLang : "en";
            handleLanguageChange(langToSet);
        }
    });

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <Select onValueChange={handleLanguageChange} defaultValue={i18n.language}>
            <SelectTrigger className="w-auto">
                <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
        </Select>
    );
}