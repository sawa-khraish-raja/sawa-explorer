/**
 * 💰 Commission Engine v2
 * حساب العمولات بدقة حسب نوع المضيف
 */

/**
 * حساب العمولات للمضيف
 * @param {string} hostType - 'freelancer' أو 'office'
 * @param {number} basePrice - السعر الأساسي من المضيف
 * @param {object} overrides - تجاوزات اختيارية للعمولة
 * @returns {object} تفاصيل العمولة والسعر النهائي
 */
export function calcCommissions(hostType, basePrice, overrides = {}) {
  const base = Number(basePrice) || 0;

  if (hostType === 'office') {
    const sawaPercent = overrides.sawa || 28;
    const officePercent = overrides.office || 7;

    const sawaFee = Number(((base * sawaPercent) / 100).toFixed(2));
    const officeFee = Number(((base * officePercent) / 100).toFixed(2));
    const total = Number((base + sawaFee + officeFee).toFixed(2));

    return {
      base_price: base,
      sawa_percent: sawaPercent,
      sawa_fee: sawaFee,
      office_percent: officePercent,
      office_fee: officeFee,
      total: total,
      host_type: 'office',
    };
  }

  // Freelancer
  const sawaPercent = overrides.sawa || 35;
  const sawaFee = Number(((base * sawaPercent) / 100).toFixed(2));
  const total = Number((base + sawaFee).toFixed(2));

  return {
    base_price: base,
    sawa_percent: sawaPercent,
    sawa_fee: sawaFee,
    office_percent: 0,
    office_fee: 0,
    total: total,
    host_type: 'freelancer',
  };
}

/**
 * عرض العمولة بشكل مقروء
 */
export function getCommissionDisplay(hostType) {
  if (hostType === 'office') {
    return {
      label: 'Office Host',
      description: 'SAWA 28% + Office 7%',
      badge: 'office',
      color: 'purple',
    };
  }

  return {
    label: 'Freelancer Host',
    description: 'SAWA 35%',
    badge: 'freelancer',
    color: 'blue',
  };
}
