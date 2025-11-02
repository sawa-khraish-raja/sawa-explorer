import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Inbox, Send, Calendar, DollarSign } from 'lucide-react';
import PartnerLayout from '../components/partner/PartnerLayout';

export default function PartnerDashboard() {
  const kpis = [
    { title: 'Active Listings', value: '12', icon: Package },
    { title: 'New Requests', value: '3', icon: Inbox },
    { title: 'Pending Offers', value: '5', icon: Send },
    { title: 'Upcoming Trips', value: '2', icon: Calendar },
    { title: '30-Day Revenue', value: '$4,500', icon: DollarSign },
  ];

  return (
    <PartnerLayout>
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>Dashboard</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>{kpi.title}</CardTitle>
              <kpi.icon className='h-4 w-4 text-gray-400' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-8'>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-500'>Activity feed will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
