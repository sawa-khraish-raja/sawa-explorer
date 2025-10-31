import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, Plane, Users, Calendar, Map, Package, Home, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Plane,
  Users,
  Calendar,
  Map,
  Package,
  Home,
  ShieldAlert
};

export default function ServiceCard({ service, isSelected, onToggle, showBadge = true }) {
  const IconComponent = ICON_MAP[service.icon] || Package;

  return (
    <Card
      onClick={onToggle}
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02]",
        isSelected
          ? "bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-400 shadow-md"
          : "bg-white border border-gray-200 hover:border-purple-300"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            isSelected
              ? "bg-purple-600 text-white"
              : "bg-purple-100 text-purple-600"
          )}>
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {service.label}
            </h3>
            {service.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}