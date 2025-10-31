/**
 * 🎯 City Highlights Component
 * ============================
 * Display city highlights in a beautiful grid
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function CityHighlights({ highlights, cityName }) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-purple-600" />
          Why Visit {cityName}?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-relaxed">{highlight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}