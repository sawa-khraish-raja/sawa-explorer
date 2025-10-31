/**
 * Host System v2 Feature Flags
 * للتحكم بتفعيل/تعطيل الميزات الجديدة
 */

export const HOST_SYSTEM_FLAGS = {
  ENABLED: true,                    // تمكين النظام الجديد
  CITY_VISIBILITY_INSTANT: true,   // ظهور فوري في المدن
  COMMISSION_ENGINE_V2: true,       // محرك العمولات الجديد
  AUTO_BOOKING_DISTRIBUTION: true, // توزيع تلقائي للحجوزات
};

export function isHostSystemEnabled(feature = 'ENABLED') {
  return HOST_SYSTEM_FLAGS[feature] === true;
}