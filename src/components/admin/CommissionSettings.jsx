import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertCircle, DollarSign } from 'lucide-react';
import { COMMISSION_RATES } from '../pricing/commissionEngine';
import { showNotification } from '../notifications/NotificationManager';

export default function CommissionSettings() {
  const [freelancerSawa, setFreelancerSawa] = useState(COMMISSION_RATES.FREELANCER.SAWA_PERCENT);
  const [officeSawa, setOfficeSawa] = useState(COMMISSION_RATES.OFFICE.SAWA_PERCENT);
  const [officePercent, setOfficePercent] = useState(COMMISSION_RATES.OFFICE.OFFICE_PERCENT);

  const handleSave = () => {
    // In a real implementation, this would save to database/config
    showNotification({
      title: '⚠️ Notice',
      message: 'Commission rates are currently hard-coded. This will be configurable in a future update.',
      type: 'info',
      duration: 5000
    });
  };

  const calculateExample = (hostType) => {
    const basePrice = 100;
    if (hostType === 'freelancer') {
      const sawa = (basePrice * freelancerSawa / 100).toFixed(2);
      const total = (basePrice + parseFloat(sawa)).toFixed(2);
      return { base: basePrice, sawa, total };
    } else {
      const sawa = (basePrice * officeSawa / 100).toFixed(2);
      const office = (basePrice * officePercent / 100).toFixed(2);
      const total = (basePrice + parseFloat(sawa) + parseFloat(office)).toFixed(2);
      return { base: basePrice, sawa, office, total };
    }
  };

  const freelancerExample = calculateExample('freelancer');
  const officeExample = calculateExample('office');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Commission Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              These rates are frozen at the time of offer creation. Changing them won't affect existing offers.
            </AlertDescription>
          </Alert>

          {/* Freelancer Rates */}
          <div className="space-y-4 p-4 border-2 border-purple-200 rounded-xl bg-purple-50">
            <h3 className="font-bold text-lg text-purple-900">Freelancer Host Rates</h3>
            
            <div>
              <Label>SAWA Commission (%)</Label>
              <Input
                type="number"
                value={freelancerSawa}
                onChange={(e) => setFreelancerSawa(parseFloat(e.target.value))}
                className="mt-2"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Current default: {COMMISSION_RATES.FREELANCER.SAWA_PERCENT}%</p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">Example Calculation (Base Price: $100)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Service Price:</span>
                  <span className="font-medium">${freelancerExample.base}</span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>+ SAWA ({freelancerSawa}%):</span>
                  <span className="font-medium">${freelancerExample.sawa}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total (Traveler Pays):</span>
                  <span className="text-purple-900">${freelancerExample.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Office Rates */}
          <div className="space-y-4 p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50">
            <h3 className="font-bold text-lg text-indigo-900">Office Host Rates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SAWA Commission (%)</Label>
                <Input
                  type="number"
                  value={officeSawa}
                  onChange={(e) => setOfficeSawa(parseFloat(e.target.value))}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Current: {COMMISSION_RATES.OFFICE.SAWA_PERCENT}%</p>
              </div>

              <div>
                <Label>Office Commission (%)</Label>
                <Input
                  type="number"
                  value={officePercent}
                  onChange={(e) => setOfficePercent(parseFloat(e.target.value))}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Current: {COMMISSION_RATES.OFFICE.OFFICE_PERCENT}%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">Example Calculation (Base Price: $100)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Service Price:</span>
                  <span className="font-medium">${officeExample.base}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>+ SAWA ({officeSawa}%):</span>
                  <span className="font-medium">${officeExample.sawa}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>+ Office ({officePercent}%):</span>
                  <span className="font-medium">${officeExample.office}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total (Traveler Pays):</span>
                  <span className="text-indigo-900">${officeExample.total}</span>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}