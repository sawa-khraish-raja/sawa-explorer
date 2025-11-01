import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { seedAllData, seedCities, seedAdventures, seedServices } from '@/utils/seedDatabase';
import { getAllDocuments } from '@/utils/firestore';

export default function DevTools() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);

  const handleSeedAll = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await seedAllData();
      setStatus({ type: 'success', message: 'Database seeded successfully!' });
      loadStats();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCities = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await seedCities();
      setStatus({ type: 'success', message: 'Cities seeded successfully!' });
      loadStats();
    } catch (error) {
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

  const loadStats = async () => {
    try {
      const [
        cities,
        adventures,
        services,
        users,
        bookings,
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
          <h1 className='text-3xl font-bold mb-2'>🛠️ Developer Tools</h1>
          <p className='text-gray-600'>Seed your database with sample data</p>
        </div>

        {/* Firestore Rules Warning */}
        <Alert className='mb-6 border-yellow-500 bg-yellow-50'>
          <AlertDescription className='text-yellow-800'>
            <strong>⚠️ Important:</strong> Before seeding, make sure you've deployed Firestore
            security rules!
            <br />
            <a
              href='https://console.firebase.google.com/project/sawa-explorer/firestore/rules'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 hover:underline font-semibold'
            >
              → Update rules in Firebase Console
            </a>{' '}
            or use temporary development rules (allow all reads/writes).
          </AlertDescription>
        </Alert>

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
              <Button onClick={loadStats} variant='outline' className='mt-4 w-full'>
                Refresh Stats
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Seed All Button */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>🌱 Seed All Data</CardTitle>
            <CardDescription>
              Populate the database with cities, adventures, and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedAll} disabled={loading} className='w-full' size='lg'>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Seeding Database...
                </>
              ) : (
                'Seed All Data'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Individual Seed Buttons */}
        <div className='grid md:grid-cols-3 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>📍 Cities</CardTitle>
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
              <CardTitle className='text-lg'>🎒 Adventures</CardTitle>
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
              <CardTitle className='text-lg'>🛎️ Services</CardTitle>
              <CardDescription>5 sample services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedServices} disabled={loading} className='w-full'>
                Seed Services
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Firestore Rules Setup */}
        <Card className='mt-6 border-2 border-yellow-300'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              ⚠️ Setup Required: Firestore Security Rules
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='font-semibold mb-2'>Step 1: Copy These Development Rules</h3>
              <pre className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs'>
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all for development
    // ⚠️ Change this before production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>Step 2: Update Rules in Firebase</h3>
              <ol className='text-sm text-gray-600 space-y-2 list-decimal list-inside'>
                <li>
                  Go to{' '}
                  <a
                    href='https://console.firebase.google.com/project/sawa-explorer/firestore/rules'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:underline font-semibold'
                  >
                    Firebase Console → Firestore Rules
                  </a>
                </li>
                <li>
                  Select the <strong>"test"</strong> database (top-right dropdown)
                </li>
                <li>Paste the rules above</li>
                <li>
                  Click <strong>Publish</strong>
                </li>
              </ol>
            </div>
            <div className='bg-blue-50 p-3 rounded-lg'>
              <p className='text-sm text-blue-800'>
                💡 <strong>Tip:</strong> These rules allow all access for testing. Before deploying
                to production, use the secure rules from{' '}
                <code className='bg-blue-100 px-2 py-1 rounded'>firestore.rules</code> file.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>📖 How to Use</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='font-semibold mb-2'>1. Seed the Database</h3>
              <p className='text-sm text-gray-600'>
                Click "Seed All Data" to populate your Firestore database with sample cities,
                adventures, and services.
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>2. View in Firebase Console</h3>
              <p className='text-sm text-gray-600'>
                Go to{' '}
                <a
                  href='https://console.firebase.google.com/project/sawa-explorer/firestore/data'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:underline'
                >
                  Firebase Console
                </a>{' '}
                to see your data. Make sure to select the <strong>"test"</strong> database.
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>3. Use in Your App</h3>
              <p className='text-sm text-gray-600'>
                Import the helper functions from{' '}
                <code className='bg-gray-100 px-2 py-1 rounded'>src/utils/firestore.js</code> to
                read/write data in your components.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>💻 Code Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <h4 className='font-semibold mb-2'>Get all cities:</h4>
                <pre className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  {`import { getAllDocuments } from '@/utils/firestore';

const cities = await getAllDocuments('cities');
console.log(cities);`}
                </pre>
              </div>

              <div>
                <h4 className='font-semibold mb-2'>Add a new city:</h4>
                <pre className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  {`import { addDocument } from '@/utils/firestore';

const cityId = await addDocument('cities', {
  name: 'Paris',
  country: 'France',
  description: 'City of lights',
  is_active: true
});`}
                </pre>
              </div>

              <div>
                <h4 className='font-semibold mb-2'>Query with filters:</h4>
                <pre className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  {`import { queryDocuments } from '@/utils/firestore';

const activeCities = await queryDocuments(
  'cities',
  [['is_active', '==', true]],
  { orderBy: { field: 'name', direction: 'asc' } }
);`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
