import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import About from './About';
import AccountDeleted from './AccountDeleted';
import AdminAdventurePosts from './AdminAdventurePosts';
import AdminAdventures from './AdminAdventures';
import AdminAgencies from './AdminAgencies';
import AdminAIMonitoring from './AdminAIMonitoring';
import AdminAnalytics from './AdminAnalytics';
import AdminAuditLogs from './AdminAuditLogs';
import AdminBookings from './AdminBookings';
import AdminBroadcast from './AdminBroadcast';
import AdminCancellations from './AdminCancellations';
import AdminCities from './AdminCities';
import AdminDashboard from './AdminDashboard';
import AdminEvents from './AdminEvents';
import AdminHeroSlides from './AdminHeroSlides';
import AdminHostRequests from './AdminHostRequests';
import AdminHosts from './AdminHosts';
import AdminMessages from './AdminMessages';
import AdminOffices from './AdminOffices';
import AdminPartnerRequests from './AdminPartnerRequests';
import AdminUsers from './AdminUsers';
import AdventureDetails from './AdventureDetails';
import Adventures from './Adventures';
import BecomeAHost from './BecomeAHost';
import BecomeAPartner from './BecomeAPartner';
import BookingAmman from './BookingAmman';
import BookingCairo from './BookingCairo';
import BookingDamascus from './BookingDamascus';
import BookingIstanbul from './BookingIstanbul';
import BookingTunis from './BookingTunis';
import CityDetail from './CityDetail';
import CommunityGuidelines from './CommunityGuidelines';
import CookiePolicy from './CookiePolicy';
import CreateAdventureBooking from './CreateAdventureBooking';
import CreateBooking from './CreateBooking';
import CustomerSupport from './CustomerSupport';
import DesignAudit from './DesignAudit';
import Destinations from './Destinations';
import DevTools from './DevTools';
import HeroPerformanceAudit from './HeroPerformanceAudit';
import HeroVideoReport from './HeroVideoReport';
import Home from './Home';
import HostAdventures from './HostAdventures';
import HostDashboard from './HostDashboard';
import HostProfile from './HostProfile';
import Layout from './Layout.jsx';
import MarketingAIInsights from './MarketingAIInsights';
import MarketingAnalytics from './MarketingAnalytics';
import MarketingDashboard from './MarketingDashboard';
import MarketingLogs from './MarketingLogs';
import MarketingReports from './MarketingReports';
import MarketingSettings from './MarketingSettings';
import Messages from './Messages';
import MyOffers from './MyOffers';
import NotFound from './NotFound';
import OfficeAddHost from './OfficeAddHost';
import OfficeAdventures from './OfficeAdventures';
import OfficeBookings from './OfficeBookings';
import OfficeDashboard from './OfficeDashboard';
import OfficeHosts from './OfficeHosts';
import OfficeMessages from './OfficeMessages';
import OfficeOffers from './OfficeOffers';
import OfficeOverview from './OfficeOverview';
import Partner from './Partner';
import PartnerAnalytics from './PartnerAnalytics';
import PartnerAvailability from './PartnerAvailability';
import PartnerDashboard from './PartnerDashboard';
import PartnerInventory from './PartnerInventory';
import PartnerMessages from './PartnerMessages';
import PartnerOffers from './PartnerOffers';
import PartnerPayouts from './PartnerPayouts';
import PartnerProfile from './PartnerProfile';
import PartnerRegisterHost from './PartnerRegisterHost';
import PartnerRequests from './PartnerRequests';
import PartnerSettings from './PartnerSettings';
import PerformanceReport from './PerformanceReport';
import PrivacyPolicy from './PrivacyPolicy';
import ProductionReport from './ProductionReport';
import ReportView from './ReportView';
import SmartCampaigns from './SmartCampaigns';
import SmartGrowthPlan from './SmartGrowthPlan';
import TermsOfService from './TermsOfService';
import UserProfile from './UserProfile';
import WriteReview from './WriteReview';

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

  CityDetail: CityDetail,

  AdminAdventures: AdminAdventures,

  HostAdventures: HostAdventures,

  AdminAdventurePosts: AdminAdventurePosts,

  OfficeAdventures: OfficeAdventures,

  ProductionReport: ProductionReport,

  Destinations: Destinations,

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
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='/Home' element={<Home />} />

        <Route path='/BookingDamascus' element={<BookingDamascus />} />

        <Route path='/BookingAmman' element={<BookingAmman />} />

        <Route path='/BookingIstanbul' element={<BookingIstanbul />} />

        <Route path='/MyOffers' element={<MyOffers />} />

        <Route path='/HostDashboard' element={<HostDashboard />} />

        <Route path='/UserProfile' element={<UserProfile />} />

        <Route path='/About' element={<About />} />

        <Route path='/PartnerDashboard' element={<PartnerDashboard />} />

        <Route path='/PartnerRequests' element={<PartnerRequests />} />

        <Route path='/PartnerProfile' element={<PartnerProfile />} />

        <Route path='/PartnerInventory' element={<PartnerInventory />} />

        <Route path='/PartnerOffers' element={<PartnerOffers />} />

        <Route path='/PartnerMessages' element={<PartnerMessages />} />

        <Route path='/PartnerAvailability' element={<PartnerAvailability />} />

        <Route path='/PartnerPayouts' element={<PartnerPayouts />} />

        <Route path='/PartnerAnalytics' element={<PartnerAnalytics />} />

        <Route path='/PartnerSettings' element={<PartnerSettings />} />

        <Route path='/AdminDashboard' element={<AdminDashboard />} />

        <Route path='/TermsOfService' element={<TermsOfService />} />

        <Route path='/PrivacyPolicy' element={<PrivacyPolicy />} />

        <Route path='/CookiePolicy' element={<CookiePolicy />} />

        <Route path='/AdminHosts' element={<AdminHosts />} />

        <Route path='/PartnerRegisterHost' element={<PartnerRegisterHost />} />

        <Route path='/CreateBooking' element={<CreateBooking />} />

        <Route path='/Partner' element={<Partner />} />

        <Route path='/HostProfile' element={<HostProfile />} />

        <Route path='/host-profile' element={<HostProfile />} />

        <Route path='/AdminEvents' element={<AdminEvents />} />

        <Route path='/Messages' element={<Messages />} />

        <Route path='/CommunityGuidelines' element={<CommunityGuidelines />} />

        <Route path='/BecomeAPartner' element={<BecomeAPartner />} />

        <Route path='/Adventures' element={<Adventures />} />

        <Route path='/AdventureDetails' element={<AdventureDetails />} />

        <Route path='/CreateAdventureBooking' element={<CreateAdventureBooking />} />

        <Route path='/AdminUsers' element={<AdminUsers />} />

        <Route path='/AdminBookings' element={<AdminBookings />} />

        <Route path='/AdminMessages' element={<AdminMessages />} />

        <Route path='/AdminAnalytics' element={<AdminAnalytics />} />

        <Route path='/AdminCities' element={<AdminCities />} />

        <Route path='/OfficeDashboard' element={<OfficeDashboard />} />

        <Route path='/AdminOffices' element={<AdminOffices />} />

        <Route path='/OfficeAddHost' element={<OfficeAddHost />} />

        <Route path='/AdminHostRequests' element={<AdminHostRequests />} />

        <Route path='/AdminHeroSlides' element={<AdminHeroSlides />} />

        <Route path='/OfficeOverview' element={<OfficeOverview />} />

        <Route path='/OfficeHosts' element={<OfficeHosts />} />

        <Route path='/OfficeBookings' element={<OfficeBookings />} />

        <Route path='/OfficeOffers' element={<OfficeOffers />} />

        <Route path='/OfficeMessages' element={<OfficeMessages />} />

        <Route path='/CustomerSupport' element={<CustomerSupport />} />

        <Route path='/AdminPartnerRequests' element={<AdminPartnerRequests />} />

        <Route path='/BookingCairo' element={<BookingCairo />} />

        <Route path='/BecomeAHost' element={<BecomeAHost />} />

        <Route path='/AdminAIMonitoring' element={<AdminAIMonitoring />} />

        <Route path='/AdminAgencies' element={<AdminAgencies />} />

        <Route path='/AdminAuditLogs' element={<AdminAuditLogs />} />

        <Route path='/NotFound' element={<NotFound />} />

        <Route path='/AdminAdventures' element={<AdminAdventures />} />

        <Route path='/HostAdventures' element={<HostAdventures />} />

        <Route path='/AdminAdventurePosts' element={<AdminAdventurePosts />} />

        <Route path='/OfficeAdventures' element={<OfficeAdventures />} />

        <Route path='/ProductionReport' element={<ProductionReport />} />

        <Route path='/Destinations' element={<Destinations />} />

        <Route path='/PerformanceReport' element={<PerformanceReport />} />

        <Route path='/DesignAudit' element={<DesignAudit />} />

        <Route path='/WriteReview' element={<WriteReview />} />

        <Route path='/AdminCancellations' element={<AdminCancellations />} />

        <Route path='/AdminBroadcast' element={<AdminBroadcast />} />

        <Route path='/HeroPerformanceAudit' element={<HeroPerformanceAudit />} />

        <Route path='/HeroVideoReport' element={<HeroVideoReport />} />

        <Route path='/BookingTunis' element={<BookingTunis />} />

        <Route path='/AccountDeleted' element={<AccountDeleted />} />

        <Route path='/MarketingDashboard' element={<MarketingDashboard />} />

        <Route path='/MarketingReports' element={<MarketingReports />} />

        <Route path='/MarketingAIInsights' element={<MarketingAIInsights />} />

        <Route path='/MarketingLogs' element={<MarketingLogs />} />

        <Route path='/MarketingSettings' element={<MarketingSettings />} />

        <Route path='/MarketingAnalytics' element={<MarketingAnalytics />} />

        <Route path='/ReportView' element={<ReportView />} />

        <Route path='/SmartCampaigns' element={<SmartCampaigns />} />

        <Route path='/SmartGrowthPlan' element={<SmartGrowthPlan />} />

        <Route path='/DevTools' element={<DevTools />} />

        <Route path='/:citySlug' element={<CityDetail />} />
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
