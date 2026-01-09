import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"

export function LanguageSelector() {
    const { i18n } = useTranslation()


    // 1) Creamos un estado para el idioma activo
    const [lang, setLang] = useState<string>(i18n.language)

    // 2) Sólo al primer montaje: detectamos y establecemos el idioma
    useEffect(() => {

        const supportedLanguages = ["en", "es"]

        // Si hay un idioma en localStorage, lo usamos
        const storedLang = localStorage.getItem("i18nextLng")
        if (storedLang && supportedLanguages.includes(storedLang)) {
            setLang(storedLang)
            i18n.changeLanguage(storedLang)
        } else {
            // Si no, usamos el idioma por defecto del navegador
            const browserLang = navigator.language.split("-")[0]
            const defaultLang = supportedLanguages.includes(browserLang) ? browserLang : "en"
            setLang(defaultLang)
            i18n.changeLanguage(defaultLang)
            localStorage.setItem("i18nextLng", defaultLang)
        }
    }, [i18n])

    // 3) Al cambiar en el select, actualizamos estado, i18n y localStorage
    const handleLanguageChange = (newLang: string) => {
        setLang(newLang)
        i18n.changeLanguage(newLang)
        localStorage.setItem("i18nextLng", newLang)
    }

    return (
        // 4) Usamos `value` para que el select sea controlado
        <Select value={lang} onValueChange={handleLanguageChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
            </SelectContent>
        </Select>
    )
}
