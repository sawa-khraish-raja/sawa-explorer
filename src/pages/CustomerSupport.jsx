
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  HelpCircle, MessageSquare, Clock, Search, User, Calendar, TrendingUp,
  Activity, Users, Zap, FileText, Loader2, XCircle, Eye, CheckCircle2,
  AlertTriangle, MapPin, DollarSign, Star, Phone, Mail, Briefcase,
  Package, Filter, Download, RefreshCw, BarChart3, Shield, Sparkles,
  MessageCircleWarning, Bell, ArrowUpRight, ArrowDownRight, Minus, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CustomerSupport() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ Fetch All Data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['allOffers'],
    queryFn: () => base44.entities.Offer.list('-created_date'),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['allConversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_timestamp'),
  });

  const { data: cancellations = [] } = useQuery({
    queryKey: ['cancellationRequests'],
    queryFn: () => base44.entities.CancellationRequest.list('-created_date'),
  });

  const { data: adventures = [] } = useQuery({
    queryKey: ['allAdventures'],
    queryFn: () => base44.entities.Adventure.list('-created_date'),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list('-created_date'),
  });

  // ✅ Comprehensive Metrics
  const metrics = useMemo(() => {
    const now = Date.now();
    
    // Time-based filters
    const last24h = users.filter(u => (now - new Date(u.created_date).getTime()) <= 24 * 60 * 60 * 1000);
    const last7d = users.filter(u => (now - new Date(u.created_date).getTime()) <= 7 * 24 * 60 * 60 * 1000);
    
    // Booking statuses
    const pending = bookings.filter(b => b.status === 'pending');
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const completed = bookings.filter(b => b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    
    // Issues & Alerts
    const stuckBookings = bookings.filter(b => {
      if (b.status !== 'pending') return false;
      const daysSince = (now - new Date(b.created_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 2;
    });
    
    const unrespondedConvos = conversations.filter(c => {
      if (!c.last_message_timestamp) return false;
      const hoursSince = (now - new Date(c.last_message_timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSince > 12 && (c.unread_by_traveler || c.unread_by_hosts?.length > 0);
    });
    
    const pendingCancellations = cancellations.filter(c => c.status === 'pending');
    const pendingAdventures = adventures.filter(a => a.approval_status === 'pending');
    
    // Revenue
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const monthlyRevenue = confirmed
      .filter(b => {
        const bookingDate = new Date(b.created_date);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        return bookingDate >= monthAgo;
      })
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    // Active Hosts
    const activeHosts = users.filter(u => u.host_approved);
    
    return {
      users: {
        total: users.length,
        new24h: last24h.length,
        new7d: last7d.length,
        hosts: activeHosts.length
      },
      bookings: {
        total: bookings.length,
        pending: pending.length,
        confirmed: confirmed.length,
        completed: completed.length,
        cancelled: cancelled.length,
        stuck: stuckBookings.length
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        avgPerBooking: confirmed.length > 0 ? totalRevenue / confirmed.length : 0
      },
      alerts: {
        pendingCancellations: pendingCancellations.length,
        stuckBookings: stuckBookings.length,
        unrespondedMessages: unrespondedConvos.length,
        pendingAdventures: pendingAdventures.length,
        total: pendingCancellations.length + stuckBookings.length + unrespondedConvos.length + pendingAdventures.length
      },
      system: {
        totalOffers: offers.length,
        totalConversations: conversations.length,
        totalAdventures: adventures.length,
        avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length : 0
      }
    };
  }, [users, bookings, offers, conversations, cancellations, adventures, reviews]);

  // ✅ Search & Filter Bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.id.toLowerCase().includes(query) ||
        b.traveler_email?.toLowerCase().includes(query) ||
        b.host_email?.toLowerCase().includes(query) ||
        b.city?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [bookings, statusFilter, searchQuery]);

  const getBookingHost = (booking) => {
    return users.find(u => u.email === booking.host_email);
  };

  const getBookingTraveler = (booking) => {
    return users.find(u => u.email === booking.traveler_email);
  };

  const getBookingOffers = (bookingId) => {
    return offers.filter(o => o.booking_id === bookingId);
  };

  const getBookingConversation = (bookingId) => {
    return conversations.find(c => c.booking_id === bookingId);
  };

  const isLoading = usersLoading || bookingsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* 🎯 Command Center Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🎯 Customer Support Command Center</h1>
              <p className="text-purple-100">Comprehensive monitoring & control dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/20" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/20" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs opacity-90">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{metrics.users.total}</div>
              <div className="text-xs opacity-75">+{metrics.users.new24h} today</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs opacity-90">Total Bookings</span>
              </div>
              <div className="text-2xl font-bold">{metrics.bookings.total}</div>
              <div className="text-xs opacity-75">{metrics.bookings.pending} pending</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs opacity-90">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold">${metrics.revenue.total.toFixed(0)}</div>
              <div className="text-xs opacity-75">${metrics.revenue.monthly.toFixed(0)}/month</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs opacity-90">Active Alerts</span>
              </div>
              <div className="text-2xl font-bold">{metrics.alerts.total}</div>
              <div className="text-xs opacity-75">Requires attention</div>
            </div>
          </div>
        </div>

        {/* 🚨 Alerts Section */}
        {metrics.alerts.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.alerts.pendingCancellations > 0 && (
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-900">Pending Cancellations</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.alerts.pendingCancellations}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => window.location.href = '/AdminCancellations'}>
                    Review Now
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {metrics.alerts.stuckBookings > 0 && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Stuck Bookings</p>
                      <p className="text-2xl font-bold text-amber-600">{metrics.alerts.stuckBookings}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setStatusFilter('pending')}>
                    View Bookings
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {metrics.alerts.unrespondedMessages > 0 && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Unresponded Messages</p>
                      <p className="text-2xl font-bold text-blue-600">{metrics.alerts.unrespondedMessages}</p>
                    </div>
                    <MessageCircleWarning className="w-8 h-8 text-blue-500" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => window.location.href = '/AdminMessages'}>
                    Check Messages
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {metrics.alerts.pendingAdventures > 0 && (
              <Card className="border-l-4 border-l-purple-500 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Pending Adventures</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.alerts.pendingAdventures}</p>
                    </div>
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => window.location.href = '/AdminAdventures'}>
                    Review Adventures
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 📊 System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              System Health & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{metrics.users.hosts}</div>
                <div className="text-sm text-gray-600 mt-1">Active Hosts</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{metrics.system.totalOffers}</div>
                <div className="text-sm text-gray-600 mt-1">Total Offers</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{metrics.system.totalConversations}</div>
                <div className="text-sm text-gray-600 mt-1">Conversations</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <div className="text-3xl font-bold text-gray-900">{metrics.system.avgRating.toFixed(1)}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔍 Bookings Search & Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              All Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by booking ID, email, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending ({metrics.bookings.pending})</option>
                  <option value="confirmed">Confirmed ({metrics.bookings.confirmed})</option>
                  <option value="completed">Completed ({metrics.bookings.completed})</option>
                  <option value="cancelled">Cancelled ({metrics.bookings.cancelled})</option>
                </select>
              </div>

              {/* Status Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({bookings.length})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-amber-600' : ''}
                >
                  Pending ({metrics.bookings.pending})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('confirmed')}
                  className={statusFilter === 'confirmed' ? 'bg-green-600' : ''}
                >
                  Confirmed ({metrics.bookings.confirmed})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                  className={statusFilter === 'completed' ? 'bg-blue-600' : ''}
                >
                  Completed ({metrics.bookings.completed})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('cancelled')}
                  className={statusFilter === 'cancelled' ? 'bg-red-600' : ''}
                >
                  Cancelled ({metrics.bookings.cancelled})
                </Button>
              </div>

              {/* Bookings List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900">No bookings found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredBookings.map((booking) => {
                    const traveler = getBookingTraveler(booking);
                    const host = getBookingHost(booking);
                    const bookingOffers = getBookingOffers(booking.id);
                    const conversation = getBookingConversation(booking.id);
                    
                    return (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                #{booking.id.slice(0, 8)}
                              </span>
                              <Badge className={cn(
                                booking.status === 'confirmed' && 'bg-green-100 text-green-800',
                                booking.status === 'pending' && 'bg-amber-100 text-amber-800',
                                booking.status === 'cancelled' && 'bg-red-100 text-red-800',
                                booking.status === 'completed' && 'bg-blue-100 text-blue-800'
                              )}>
                                {booking.status}
                              </Badge>
                              {booking.adventure_id && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Adventure
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {booking.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                              </span>
                              {booking.total_price && (
                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                  <DollarSign className="w-3 h-3" />
                                  {booking.total_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {traveler?.full_name || booking.traveler_email}
                              </span>
                              {host && (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  Host: {host.full_name}
                                </span>
                              )}
                              {bookingOffers.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {bookingOffers.length} offers
                                </span>
                              )}
                              {conversation && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  Has conversation
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/AdminUsers'}>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Manage Users</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/AdminBookings'}>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Manage Bookings</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/AdminMessages'}>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Messages</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/AdminAnalytics'}>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Analytics</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 📋 Booking Details Modal */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details #{selectedBooking.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge className={cn(
                    selectedBooking.status === 'confirmed' && 'bg-green-100 text-green-800',
                    selectedBooking.status === 'pending' && 'bg-amber-100 text-amber-800',
                    selectedBooking.status === 'cancelled' && 'bg-red-100 text-red-800',
                    selectedBooking.status === 'completed' && 'bg-blue-100 text-blue-800'
                  )}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-semibold">{format(new Date(selectedBooking.created_date), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              
              {/* Traveler Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Traveler Information
                </h4>
                <p><strong>Email:</strong> {selectedBooking.traveler_email}</p>
                {getBookingTraveler(selectedBooking) && (
                  <>
                    <p><strong>Name:</strong> {getBookingTraveler(selectedBooking).full_name}</p>
                    {getBookingTraveler(selectedBooking).phone && (
                      <p><strong>Phone:</strong> {getBookingTraveler(selectedBooking).phone}</p>
                    )}
                  </>
                )}
              </div>
              
              {/* Host Info */}
              {selectedBooking.host_email && getBookingHost(selectedBooking) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Host Information
                  </h4>
                  <p><strong>Email:</strong> {selectedBooking.host_email}</p>
                  <p><strong>Name:</strong> {getBookingHost(selectedBooking).full_name}</p>
                  {getBookingHost(selectedBooking).phone && (
                    <p><strong>Phone:</strong> {getBookingHost(selectedBooking).phone}</p>
                  )}
                </div>
              )}
              
              {/* Booking Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Booking Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-semibold">{selectedBooking.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dates</p>
                    <p className="font-semibold">
                      {format(new Date(selectedBooking.start_date), 'MMM d')} - {format(new Date(selectedBooking.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-semibold">
                      {selectedBooking.number_of_adults} adults
                      {selectedBooking.number_of_children > 0 && `, ${selectedBooking.number_of_children} children`}
                    </p>
                  </div>
                  {selectedBooking.total_price && (
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-semibold text-green-600">${selectedBooking.total_price.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {selectedBooking.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-sm bg-white p-2 rounded">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Offers */}
              {getBookingOffers(selectedBooking.id).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Offers ({getBookingOffers(selectedBooking.id).length})
                  </h4>
                  <div className="space-y-2">
                    {getBookingOffers(selectedBooking.id).map(offer => (
                      <div key={offer.id} className="border p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{offer.host_email}</span>
                          <Badge>{offer.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Price: ${offer.price_total || offer.price_base}</p>
                        {offer.message && <p className="text-sm mt-1">{offer.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = `/AdminBookings?id=${selectedBooking.id}`}>
                  View Full Details
                </Button>
                {getBookingConversation(selectedBooking.id) && (
                  <Button variant="outline" onClick={() => window.location.href = `/AdminMessages?conversation_id=${getBookingConversation(selectedBooking.id).id}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    View Conversation
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
