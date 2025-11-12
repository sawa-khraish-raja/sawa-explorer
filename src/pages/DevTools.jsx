import { Database, CheckCircle, XCircle } from 'lucide-react';
import React, { useState } from 'react';

import { UseAppContext } from '@/shared/context/AppContext';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  getAllDocuments,
  queryDocuments,
  updateDocument,
  setDocument,
  getDocument,
} from '@/utils/firestore';
import {
  seedCities,
  seedAdventures,
  seedServices,
  seedNotifications,
  seedBookingsAndOffers,
} from '@/utils/seedDatabase';

export default function DevTools() {
  const { user } = UseAppContext();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);

  const handleSeedCities = async () => {
    setLoading(true);
    setStatus(null);
    try {
      console.log(' Seeding cities - User:', user);
      console.log(' User email:', user?.email);
      console.log(' User ID:', user?.id);
      await seedCities();
      setStatus({ type: 'success', message: 'Cities seeded successfully!' });
      loadStats();
    } catch (error) {
      console.error('Seed cities error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAdventures = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await seedAdventures();
      setStatus({ type: 'success', message: 'Adventures seeded successfully!' });
      loadStats();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedServices = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await seedServices();
      setStatus({ type: 'success', message: 'Services seeded successfully!' });
      loadStats();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedNotifications = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!user?.id || !user?.email) {
        setStatus({ type: 'error', message: 'Please login first to seed notifications!' });
        setLoading(false);
        return;
      }

      const notificationIds = await seedNotifications(user.id, user.email);

      setStatus({
        type: 'success',
        message: `Sample notifications seeded successfully! (${notificationIds?.length || 0} created)`,
      });
      loadStats();
    } catch (error) {
      console.error('Seed notifications error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAndReseedAdventures = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // First, clear existing adventures
      const deletedCount = await clearAdventures();

      // Then seed new ones
      await seedAdventures();
      setStatus({
        type: 'success',
        message: `Cleared ${deletedCount} old adventures and seeded 5 new ones!`,
      });
      loadStats();
    } catch (error) {
      console.error('Clear & reseed error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedBookingsAndOffers = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!user?.id || !user?.email) {
        setStatus({ type: 'error', message: 'Please login first to seed bookings and offers!' });
        setLoading(false);
        return;
      }
      const result = await seedBookingsAndOffers(user.id, user.email);
      console.log('Seeded booking and offer:', result);
      setStatus({
        type: 'success',
        message: 'Sample booking with pending offer created! Check MyOffers page.',
      });
      loadStats();
    } catch (error) {
      console.error('Seed bookings/offers error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDebugMyBookings = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!user?.email) {
        setStatus({ type: 'error', message: 'Please login first!' });
        setLoading(false);
        return;
      }

      // Check all bookings in database
      const allBookings = await getAllDocuments('bookings');

      // Filter bookings by user email
      const myBookings = await queryDocuments('bookings', [['traveler_email', '==', user.email]]);

      // Check if there's a mismatch in email casing or whitespace
      const manualFilter = allBookings.filter(
        (b) => b.traveler_email?.toLowerCase().trim() === user.email?.toLowerCase().trim()
      );

      // Check offers
      const allOffers = await getAllDocuments('offers');

      setStatus({
        type: 'success',
        message: `Found ${myBookings.length} booking(s) for ${user.email}. Check console for details.`,
      });
    } catch (error) {
      console.error('Debug error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeMeHost = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!user?.id) {
        setStatus({ type: 'error', message: 'Please login first!' });
        setLoading(false);
        return;
      }

      console.log('👨‍💼 Making user a host:', user.id);

      // Check if user document exists
      const existingUser = await getDocument('users', user.id);

      if (existingUser) {
        // Update existing user
        await updateDocument('users', user.id, {
          host_approved: true,
          role_type: 'host',
          city: 'Damascus', // Default city for testing
          bio: 'Local guide and host',
        });
        console.log(' Updated existing user to host');
      } else {
        // Create new user document
        await setDocument('users', user.id, {
          email: user.email,
          full_name: user.full_name || user.email,
          profile_photo: user.profile_photo || '',
          host_approved: true,
          role_type: 'host',
          city: 'Damascus',
          bio: 'Local guide and host',
        });
        console.log(' Created new user document as host');
      }

      setStatus({
        type: 'success',
        message:
          'You are now a host! Refresh the page and visit /HostDashboard to see booking requests.',
      });
    } catch (error) {
      console.error('Make host error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeMeAdmin = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!user?.id) {
        setStatus({ type: 'error', message: 'Please login first!' });
        setLoading(false);
        return;
      }

      console.log('Making user an admin:', user.id);

      // Check if user document exists
      const existingUser = await getDocument('users', user.id);

      if (existingUser) {
        // Update existing user
        await updateDocument('users', user.id, {
          role_type: 'admin',
          admin_access_type: 'full',
        });
        console.log(' Updated existing user to admin');
      } else {
        // Create new user document
        await setDocument('users', user.id, {
          email: user.email,
          full_name: user.full_name || user.email,
          profile_photo: user.profile_photo || '',
          role_type: 'admin',
          admin_access_type: 'full',
        });
        console.log(' Created new user document as admin');
      }

      setStatus({
        type: 'success',
        message:
          'You are now an admin! Refresh the page and visit /AdminDashboard to access admin panel.',
      });

      // Refresh stats after making admin
      await loadStats();
    } catch (error) {
      console.error('Make admin error:', error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        cities,
        adventures,
        services,
        users,
        bookings,
        offers,
        reviews,
        chats,
        notifications,
        favorites,
      ] = await Promise.all([
        getAllDocuments('cities').catch(() => []),
        getAllDocuments('adventures').catch(() => []),
        getAllDocuments('services').catch(() => []),
        getAllDocuments('users').catch(() => []),
        getAllDocuments('bookings').catch(() => []),
        getAllDocuments('offers').catch(() => []),
        getAllDocuments('reviews').catch(() => []),
        getAllDocuments('chats').catch(() => []),
        getAllDocuments('notifications').catch(() => []),
        getAllDocuments('favorites').catch(() => []),
      ]);

      setStats({
        cities: cities.length,
        adventures: adventures.length,
        services: services.length,
        users: users.length,
        bookings: bookings.length,
        offers: offers.length,
        reviews: reviews.length,
        chats: chats.length,
        notifications: notifications.length,
        favorites: favorites.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Developer Tools</h1>
          <p className='text-gray-600'>Seed your database with sample data</p>

          {/* Auth Status Debug */}
          <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
            <p className='text-sm font-semibold mb-2'>Authentication Status:</p>
            {user ? (
              <div className='text-sm text-green-700'>
                Logged in as: <strong>{user.email}</strong> (ID: {user.id})
              </div>
            ) : (
              <div className='text-sm text-red-700'>Not logged in - Please login to seed data!</div>
            )}
          </div>
        </div>

        {status && (
          <Alert
            className={
              status.type === 'success'
                ? 'border-green-500 bg-green-50 mb-6'
                : 'border-red-500 bg-red-50 mb-6'
            }
          >
            <AlertDescription
              className={status.type === 'success' ? 'text-green-700' : 'text-red-700'}
            >
              {status.type === 'success' ? (
                <CheckCircle className='w-4 h-4 inline mr-2' />
              ) : (
                <XCircle className='w-4 h-4 inline mr-2' />
              )}
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Database Stats */}
        {stats && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='w-5 h-5' />
                Database Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{stats.cities}</div>
                  <div className='text-sm text-gray-600'>Cities</div>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>{stats.adventures}</div>
                  <div className='text-sm text-gray-600'>Adventures</div>
                </div>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>{stats.services}</div>
                  <div className='text-sm text-gray-600'>Services</div>
                </div>
                <div className='text-center p-4 bg-orange-50 rounded-lg'>
                  <div className='text-2xl font-bold text-orange-600'>{stats.users}</div>
                  <div className='text-sm text-gray-600'>Users</div>
                </div>
                <div className='text-center p-4 bg-pink-50 rounded-lg'>
                  <div className='text-2xl font-bold text-pink-600'>{stats.bookings}</div>
                  <div className='text-sm text-gray-600'>Bookings</div>
                </div>
                <div className='text-center p-4 bg-amber-50 rounded-lg'>
                  <div className='text-2xl font-bold text-amber-600'>{stats.offers || 0}</div>
                  <div className='text-sm text-gray-600'>Offers</div>
                </div>
                <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                  <div className='text-2xl font-bold text-yellow-600'>{stats.reviews}</div>
                  <div className='text-sm text-gray-600'>Reviews</div>
                </div>
                <div className='text-center p-4 bg-indigo-50 rounded-lg'>
                  <div className='text-2xl font-bold text-indigo-600'>{stats.chats}</div>
                  <div className='text-sm text-gray-600'>Chats</div>
                </div>
                <div className='text-center p-4 bg-red-50 rounded-lg'>
                  <div className='text-2xl font-bold text-red-600'>{stats.notifications}</div>
                  <div className='text-sm text-gray-600'>Notifications</div>
                </div>
                <div className='text-center p-4 bg-teal-50 rounded-lg'>
                  <div className='text-2xl font-bold text-teal-600'>{stats.favorites}</div>
                  <div className='text-sm text-gray-600'>Favorites</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Seed Buttons */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Cities</CardTitle>
              <CardDescription>5 sample cities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedCities} disabled={loading} className='w-full'>
                Seed Cities
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Adventures</CardTitle>
              <CardDescription>5 sample adventures</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedAdventures} disabled={loading} className='w-full'>
                Seed Adventures
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Services</CardTitle>
              <CardDescription>5 sample services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedServices} disabled={loading} className='w-full'>
                Seed Services
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Notifications</CardTitle>
              <CardDescription>3 sample notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSeedNotifications}
                disabled={loading || !user}
                className='w-full'
              >
                Seed Notifications
              </Button>
              {!user && <p className='text-xs text-orange-600 mt-2'>Login required</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Bookings & Offers</CardTitle>
              <CardDescription>1 booking with pending offer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSeedBookingsAndOffers}
                disabled={loading || !user}
                className='w-full'
              >
                Seed Booking & Offer
              </Button>
              {!user && <p className='text-xs text-orange-600 mt-2'>Login required</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Host Access</CardTitle>
              <CardDescription>Become a host to test host features</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMakeMeHost} disabled={loading || !user} className='w-full'>
                Make Me a Host
              </Button>
              {!user && <p className='text-xs text-orange-600 mt-2'>Login required</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Admin Access</CardTitle>
              <CardDescription>Become an admin to access admin portal</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMakeMeAdmin} disabled={loading || !user} className='w-full'>
                Make Me Admin
              </Button>
              {!user && <p className='text-xs text-orange-600 mt-2'>Login required</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
