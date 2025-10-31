import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  UserCircle,
  Package,
  Inbox,
  Send,
  MessageSquare,
  Calendar,
  DollarSign,
  BarChart2,
  Settings,
  Globe,
  LogOut,
  X,
  Menu,
  Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "PartnerDashboard" },
  { name: "Profile", icon: UserCircle, href: "PartnerProfile" },
  { name: "Inventory", icon: Package, href: "PartnerInventory" },
  { name: "Requests", icon: Inbox, href: "PartnerRequests" },
  { name: "Offers", icon: Send, href: "PartnerOffers" },
  { name: "Messages", icon: MessageSquare, href: "PartnerMessages" },
  { name: "Availability", icon: Calendar, href: "PartnerAvailability" },
  { name: "Payouts", icon: DollarSign, href: "PartnerPayouts" },
  { name: "Analytics", icon: BarChart2, href: "PartnerAnalytics" },
];

export default function PartnerLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser.host_approved && currentUser.role !== 'admin' && currentUser.partner_type !== 'agency') {
            alert("Access denied. You are not an approved partner.");
            navigate(createPageUrl("Home"));
            return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(location.pathname);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [navigate, location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleLanguage = () => setLanguage(prev => (prev === "en" ? "ar" : "en"));
  const isRTL = language === "ar";
  
  const translations = {
      en: { ...navItems.reduce((acc, item) => ({...acc, [item.name]: item.name}), {}), Settings: "Settings", Logout: "Logout"},
      ar: { Overview: "نظرة عامة", Profile: "الملف الشخصي", Inventory: "المخزون", Requests: "الطلبات", Offers: "العروض", Messages: "الرسائل", Availability: "التوافر", Payouts: "المدفوعات", Analytics: "التحليلات", Settings: "الإعدادات", Logout: "تسجيل الخروج"}
  };
  const t = translations[language];

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col fixed inset-y-0 z-50 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
           <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SAWA</span>
            </Link>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-md">PARTNER</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.href)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.includes(item.href)
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {t[item.name]}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t mt-auto">
            <Link to={createPageUrl("PartnerSettings")} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <Settings className="w-5 h-5" /> {t.Settings}
            </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-40">
           <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleLanguage}><Globe className="w-5 h-5" /></Button>
                <Button variant="ghost" onClick={() => base44.auth.logout()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.Logout}</span>
                </Button>
            </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
}