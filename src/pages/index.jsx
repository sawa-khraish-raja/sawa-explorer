import Layout from "./Layout.jsx";

import Home from "./Home";

import BookingDamascus from "./BookingDamascus";

import BookingAmman from "./BookingAmman";

import BookingIstanbul from "./BookingIstanbul";

import MyOffers from "./MyOffers";

import HostDashboard from "./HostDashboard";

import UserProfile from "./UserProfile";

import About from "./About";

import PartnerDashboard from "./PartnerDashboard";

import PartnerRequests from "./PartnerRequests";

import PartnerProfile from "./PartnerProfile";

import PartnerInventory from "./PartnerInventory";

import PartnerOffers from "./PartnerOffers";

import PartnerMessages from "./PartnerMessages";

import PartnerAvailability from "./PartnerAvailability";

import PartnerPayouts from "./PartnerPayouts";

import PartnerAnalytics from "./PartnerAnalytics";

import PartnerSettings from "./PartnerSettings";

import AdminDashboard from "./AdminDashboard";

import TermsOfService from "./TermsOfService";

import PrivacyPolicy from "./PrivacyPolicy";

import CookiePolicy from "./CookiePolicy";

import AdminHosts from "./AdminHosts";

import PartnerRegisterHost from "./PartnerRegisterHost";

import CreateBooking from "./CreateBooking";

import Partner from "./Partner";

import HostProfile from "./HostProfile";

import AdminEvents from "./AdminEvents";

import Messages from "./Messages";

import CommunityGuidelines from "./CommunityGuidelines";

import BecomeAPartner from "./BecomeAPartner";

import Adventures from "./Adventures";

import AdventureDetails from "./AdventureDetails";

import CreateAdventureBooking from "./CreateAdventureBooking";

import AdminUsers from "./AdminUsers";

import AdminBookings from "./AdminBookings";

import AdminMessages from "./AdminMessages";

import AdminAnalytics from "./AdminAnalytics";

import AdminCities from "./AdminCities";

import OfficeDashboard from "./OfficeDashboard";

import AdminOffices from "./AdminOffices";

import OfficeAddHost from "./OfficeAddHost";

import AdminHostRequests from "./AdminHostRequests";

import AdminHeroSlides from "./AdminHeroSlides";

import OfficeOverview from "./OfficeOverview";

import OfficeHosts from "./OfficeHosts";

import OfficeBookings from "./OfficeBookings";

import OfficeOffers from "./OfficeOffers";

import OfficeMessages from "./OfficeMessages";

import CustomerSupport from "./CustomerSupport";

import AdminPartnerRequests from "./AdminPartnerRequests";

import BookingCairo from "./BookingCairo";

import BecomeAHost from "./BecomeAHost";

import AdminAIMonitoring from "./AdminAIMonitoring";

import AdminAgencies from "./AdminAgencies";

import AdminAuditLogs from "./AdminAuditLogs";

import NotFound from "./NotFound";

import AdminAdventures from "./AdminAdventures";

import HostAdventures from "./HostAdventures";

import AdminAdventurePosts from "./AdminAdventurePosts";

import OfficeAdventures from "./OfficeAdventures";

import ProductionReport from "./ProductionReport";

import Destinations from "./Destinations";

import ForumHome from "./ForumHome";

import ForumPostDetail from "./ForumPostDetail";

import AdminForumModeration from "./AdminForumModeration";

import PerformanceReport from "./PerformanceReport";

import DesignAudit from "./DesignAudit";

import WriteReview from "./WriteReview";

import AdminCancellations from "./AdminCancellations";

import AdminBroadcast from "./AdminBroadcast";

import HeroPerformanceAudit from "./HeroPerformanceAudit";

import HeroVideoReport from "./HeroVideoReport";

import BookingTunis from "./BookingTunis";

import AccountDeleted from "./AccountDeleted";

import MarketingDashboard from "./MarketingDashboard";

import MarketingReports from "./MarketingReports";

import MarketingAIInsights from "./MarketingAIInsights";

import MarketingLogs from "./MarketingLogs";

import MarketingSettings from "./MarketingSettings";

import MarketingAnalytics from "./MarketingAnalytics";

import ReportView from "./ReportView";

import SmartCampaigns from "./SmartCampaigns";

import SmartGrowthPlan from "./SmartGrowthPlan";

import DevTools from "./DevTools";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    BookingDamascus: BookingDamascus,
    
    BookingAmman: BookingAmman,
    
    BookingIstanbul: BookingIstanbul,
    
    MyOffers: MyOffers,
    
    HostDashboard: HostDashboard,
    
    UserProfile: UserProfile,
    
    About: About,
    
    PartnerDashboard: PartnerDashboard,
    
    PartnerRequests: PartnerRequests,
    
    PartnerProfile: PartnerProfile,
    
    PartnerInventory: PartnerInventory,
    
    PartnerOffers: PartnerOffers,
    
    PartnerMessages: PartnerMessages,
    
    PartnerAvailability: PartnerAvailability,
    
    PartnerPayouts: PartnerPayouts,
    
    PartnerAnalytics: PartnerAnalytics,
    
    PartnerSettings: PartnerSettings,
    
    AdminDashboard: AdminDashboard,
    
    TermsOfService: TermsOfService,
    
    PrivacyPolicy: PrivacyPolicy,
    
    CookiePolicy: CookiePolicy,
    
    AdminHosts: AdminHosts,
    
    PartnerRegisterHost: PartnerRegisterHost,
    
    CreateBooking: CreateBooking,
    
    Partner: Partner,
    
    HostProfile: HostProfile,
    
    AdminEvents: AdminEvents,
    
    Messages: Messages,
    
    CommunityGuidelines: CommunityGuidelines,
    
    BecomeAPartner: BecomeAPartner,
    
    Adventures: Adventures,
    
    AdventureDetails: AdventureDetails,
    
    CreateAdventureBooking: CreateAdventureBooking,
    
    AdminUsers: AdminUsers,
    
    AdminBookings: AdminBookings,
    
    AdminMessages: AdminMessages,
    
    AdminAnalytics: AdminAnalytics,
    
    AdminCities: AdminCities,
    
    OfficeDashboard: OfficeDashboard,
    
    AdminOffices: AdminOffices,
    
    OfficeAddHost: OfficeAddHost,
    
    AdminHostRequests: AdminHostRequests,
    
    AdminHeroSlides: AdminHeroSlides,
    
    OfficeOverview: OfficeOverview,
    
    OfficeHosts: OfficeHosts,
    
    OfficeBookings: OfficeBookings,
    
    OfficeOffers: OfficeOffers,
    
    OfficeMessages: OfficeMessages,
    
    CustomerSupport: CustomerSupport,
    
    AdminPartnerRequests: AdminPartnerRequests,
    
    BookingCairo: BookingCairo,
    
    BecomeAHost: BecomeAHost,
    
    AdminAIMonitoring: AdminAIMonitoring,
    
    AdminAgencies: AdminAgencies,
    
    AdminAuditLogs: AdminAuditLogs,
    
    NotFound: NotFound,
    
    AdminAdventures: AdminAdventures,
    
    HostAdventures: HostAdventures,
    
    AdminAdventurePosts: AdminAdventurePosts,
    
    OfficeAdventures: OfficeAdventures,
    
    ProductionReport: ProductionReport,
    
    Destinations: Destinations,
    
    ForumHome: ForumHome,
    
    ForumPostDetail: ForumPostDetail,
    
    AdminForumModeration: AdminForumModeration,
    
    PerformanceReport: PerformanceReport,
    
    DesignAudit: DesignAudit,
    
    WriteReview: WriteReview,
    
    AdminCancellations: AdminCancellations,
    
    AdminBroadcast: AdminBroadcast,
    
    HeroPerformanceAudit: HeroPerformanceAudit,
    
    HeroVideoReport: HeroVideoReport,
    
    BookingTunis: BookingTunis,
    
    AccountDeleted: AccountDeleted,
    
    MarketingDashboard: MarketingDashboard,
    
    MarketingReports: MarketingReports,
    
    MarketingAIInsights: MarketingAIInsights,
    
    MarketingLogs: MarketingLogs,
    
    MarketingSettings: MarketingSettings,
    
    MarketingAnalytics: MarketingAnalytics,
    
    ReportView: ReportView,
    
    SmartCampaigns: SmartCampaigns,
    
    SmartGrowthPlan: SmartGrowthPlan,

    DevTools: DevTools,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/BookingDamascus" element={<BookingDamascus />} />
                
                <Route path="/BookingAmman" element={<BookingAmman />} />
                
                <Route path="/BookingIstanbul" element={<BookingIstanbul />} />
                
                <Route path="/MyOffers" element={<MyOffers />} />
                
                <Route path="/HostDashboard" element={<HostDashboard />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/PartnerDashboard" element={<PartnerDashboard />} />
                
                <Route path="/PartnerRequests" element={<PartnerRequests />} />
                
                <Route path="/PartnerProfile" element={<PartnerProfile />} />
                
                <Route path="/PartnerInventory" element={<PartnerInventory />} />
                
                <Route path="/PartnerOffers" element={<PartnerOffers />} />
                
                <Route path="/PartnerMessages" element={<PartnerMessages />} />
                
                <Route path="/PartnerAvailability" element={<PartnerAvailability />} />
                
                <Route path="/PartnerPayouts" element={<PartnerPayouts />} />
                
                <Route path="/PartnerAnalytics" element={<PartnerAnalytics />} />
                
                <Route path="/PartnerSettings" element={<PartnerSettings />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/CookiePolicy" element={<CookiePolicy />} />
                
                <Route path="/AdminHosts" element={<AdminHosts />} />
                
                <Route path="/PartnerRegisterHost" element={<PartnerRegisterHost />} />
                
                <Route path="/CreateBooking" element={<CreateBooking />} />
                
                <Route path="/Partner" element={<Partner />} />
                
                <Route path="/HostProfile" element={<HostProfile />} />
                
                <Route path="/AdminEvents" element={<AdminEvents />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/CommunityGuidelines" element={<CommunityGuidelines />} />
                
                <Route path="/BecomeAPartner" element={<BecomeAPartner />} />
                
                <Route path="/Adventures" element={<Adventures />} />
                
                <Route path="/AdventureDetails" element={<AdventureDetails />} />
                
                <Route path="/CreateAdventureBooking" element={<CreateAdventureBooking />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/AdminBookings" element={<AdminBookings />} />
                
                <Route path="/AdminMessages" element={<AdminMessages />} />
                
                <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
                
                <Route path="/AdminCities" element={<AdminCities />} />
                
                <Route path="/OfficeDashboard" element={<OfficeDashboard />} />
                
                <Route path="/AdminOffices" element={<AdminOffices />} />
                
                <Route path="/OfficeAddHost" element={<OfficeAddHost />} />
                
                <Route path="/AdminHostRequests" element={<AdminHostRequests />} />
                
                <Route path="/AdminHeroSlides" element={<AdminHeroSlides />} />
                
                <Route path="/OfficeOverview" element={<OfficeOverview />} />
                
                <Route path="/OfficeHosts" element={<OfficeHosts />} />
                
                <Route path="/OfficeBookings" element={<OfficeBookings />} />
                
                <Route path="/OfficeOffers" element={<OfficeOffers />} />
                
                <Route path="/OfficeMessages" element={<OfficeMessages />} />
                
                <Route path="/CustomerSupport" element={<CustomerSupport />} />
                
                <Route path="/AdminPartnerRequests" element={<AdminPartnerRequests />} />
                
                <Route path="/BookingCairo" element={<BookingCairo />} />
                
                <Route path="/BecomeAHost" element={<BecomeAHost />} />
                
                <Route path="/AdminAIMonitoring" element={<AdminAIMonitoring />} />
                
                <Route path="/AdminAgencies" element={<AdminAgencies />} />
                
                <Route path="/AdminAuditLogs" element={<AdminAuditLogs />} />
                
                <Route path="/NotFound" element={<NotFound />} />
                
                <Route path="/AdminAdventures" element={<AdminAdventures />} />
                
                <Route path="/HostAdventures" element={<HostAdventures />} />
                
                <Route path="/AdminAdventurePosts" element={<AdminAdventurePosts />} />
                
                <Route path="/OfficeAdventures" element={<OfficeAdventures />} />
                
                <Route path="/ProductionReport" element={<ProductionReport />} />
                
                <Route path="/Destinations" element={<Destinations />} />
                
                <Route path="/ForumHome" element={<ForumHome />} />
                
                <Route path="/ForumPostDetail" element={<ForumPostDetail />} />
                
                <Route path="/AdminForumModeration" element={<AdminForumModeration />} />
                
                <Route path="/PerformanceReport" element={<PerformanceReport />} />
                
                <Route path="/DesignAudit" element={<DesignAudit />} />
                
                <Route path="/WriteReview" element={<WriteReview />} />
                
                <Route path="/AdminCancellations" element={<AdminCancellations />} />
                
                <Route path="/AdminBroadcast" element={<AdminBroadcast />} />
                
                <Route path="/HeroPerformanceAudit" element={<HeroPerformanceAudit />} />
                
                <Route path="/HeroVideoReport" element={<HeroVideoReport />} />
                
                <Route path="/BookingTunis" element={<BookingTunis />} />
                
                <Route path="/AccountDeleted" element={<AccountDeleted />} />
                
                <Route path="/MarketingDashboard" element={<MarketingDashboard />} />
                
                <Route path="/MarketingReports" element={<MarketingReports />} />
                
                <Route path="/MarketingAIInsights" element={<MarketingAIInsights />} />
                
                <Route path="/MarketingLogs" element={<MarketingLogs />} />
                
                <Route path="/MarketingSettings" element={<MarketingSettings />} />
                
                <Route path="/MarketingAnalytics" element={<MarketingAnalytics />} />
                
                <Route path="/ReportView" element={<ReportView />} />
                
                <Route path="/SmartCampaigns" element={<SmartCampaigns />} />
                
                <Route path="/SmartGrowthPlan" element={<SmartGrowthPlan />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}