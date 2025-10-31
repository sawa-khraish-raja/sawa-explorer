import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function usePageContext() {
    const location = useLocation();

    // استخرج اسم المدينة من المسار /BookingAmman | /BookingDamascus ... الخ
    const cityFromPath = useMemo(() => {
        const p = location.pathname.toLowerCase();
        const match = p.match(/\/booking([a-z]+)/i);
        if (match && match[1]) {
            // Capitalize the first letter
            return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
        return null;
    }, [location.pathname]);

    // لغة واجهة الموقع
    const uiLang = useMemo(() => {
        return (typeof document !== "undefined" && document.documentElement.lang) || "en";
    }, []);

    return { city: cityFromPath, uiLang };
}