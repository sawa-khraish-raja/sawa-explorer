import React from 'react';
import MarketingLayout from '../components/marketing/MarketingLayout';
import MarketingGuard from '../components/marketing/MarketingGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Bell, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function MarketingSettings() {
  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Settings className="w-10 h-10" />
              Settings
            </h1>
            <p className="text-gray-300 text-lg">
              Configure marketing dashboard preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audit-logs">Enable Audit Logging</Label>
                  <Switch id="audit-logs" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-export">Allow Data Export</Label>
                  <Switch id="data-export" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="readonly">Read-Only Mode</Label>
                  <Switch id="readonly" defaultChecked disabled />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-reports">Email Reports</Label>
                  <Switch id="email-reports" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <Switch id="weekly-digest" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anomaly-alerts">Anomaly Alerts</Label>
                  <Switch id="anomaly-alerts" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Data Mirror Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-900 font-semibold mb-2">
                    ✅ Mirror Status: Active
                  </p>
                  <p className="text-sm text-gray-700">
                    All platform data is mirrored in real-time with read-only access. 
                    No write operations are allowed on the mirror layer.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}