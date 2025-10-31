/**
 * ✅ SAWA Centralized Pricing Engine
 * Calculates final prices for Agency vs Freelancer hosts
 */

/**
 * Resolve commission rates for a host
 * @param {Object} params
 * @param {string} params.hostType - 'agency' or 'freelancer'
 * @param {Object} params.overrides - Custom commission overrides
 * @param {Object} params.agencyDefaults - Agency default commissions
 * @returns {Object} {sawa, office}
 */
export function resolveCommission({ 
  hostType, 
  overrides = null, 
  agencyDefaults = null 
}) {
  // Custom overrides take priority
  if (overrides && (overrides.sawa || overrides.office)) {
    return {
      sawa: overrides.sawa ?? (hostType === 'agency' ? 28 : 35),
      office: overrides.office ?? (hostType === 'agency' ? 7 : 0),
    };
  }

  // Agency host with agency defaults
  if (hostType === 'agency' && agencyDefaults) {
    return {
      sawa: agencyDefaults.commission_sawa_default ?? 28,
      office: agencyDefaults.commission_office_default ?? 7,
    };
  }

  // Agency host without agency defaults (fallback)
  if (hostType === 'agency') {
    return { sawa: 28, office: 7 };
  }

  // Freelancer host
  return { sawa: 35, office: 0 };
}

/**
 * Calculate final price breakdown
 * @param {Object} params
 * @param {number} params.basePrice - Host's service price
 * @param {string} params.hostType - 'agency' or 'freelancer'
 * @param {Object} params.overrides - Custom commission overrides
 * @param {Object} params.agencyDefaults - Agency default commissions
 * @returns {Object} Complete price breakdown
 */
export function calcFinalPrice({ 
  basePrice, 
  hostType, 
  overrides = null, 
  agencyDefaults = null 
}) {
  const base = parseFloat(basePrice) || 0;
  const { sawa, office } = resolveCommission({ hostType, overrides, agencyDefaults });

  const sawaFee = parseFloat((base * (sawa / 100)).toFixed(2));
  const officeFee = parseFloat((base * (office / 100)).toFixed(2));
  const total = parseFloat((base + sawaFee + officeFee).toFixed(2));

  return {
    base_price: base,
    sawa_percent: sawa,
    sawa_fee: sawaFee,
    office_percent: office,
    office_fee: officeFee,
    total
  };
}

/**
 * Format price breakdown for display
 * @param {Object} breakdown - Price breakdown object
 * @param {string} currency - Currency symbol (default: $)
 * @returns {string} Formatted breakdown
 */
export function formatPriceBreakdown(breakdown, currency = '$') {
  if (!breakdown) return '';
  
  const lines = [
    `Host services: ${currency}${breakdown.base_price.toFixed(2)}`,
    `SAWA (${breakdown.sawa_percent}%): ${currency}${breakdown.sawa_fee.toFixed(2)}`
  ];

  if (breakdown.office_percent > 0) {
    lines.push(`Office (${breakdown.office_percent}%): ${currency}${breakdown.office_fee.toFixed(2)}`);
  }

  lines.push(`Total: ${currency}${breakdown.total.toFixed(2)}`);

  return lines.join('\n');
}