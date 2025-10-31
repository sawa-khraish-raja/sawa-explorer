/**
 * Adventure Commission Calculator
 * Calculates commissions based on who creates the adventure
 */

/**
 * Calculate adventure commissions
 * @param {number} hostPrice - The price host wants to receive
 * @param {string} hostType - 'freelancer' | 'office' (host linked to office) | 'office_entity' (office itself) | 'admin'
 * @returns {object} Commission breakdown
 */
export function calculateAdventureCommissions(hostPrice, hostType) {
  const price = parseFloat(hostPrice) || 0;
  
  if (price <= 0) {
    return {
      hostReceives: 0,
      sawaPercent: 0,
      sawaAmount: 0,
      officePercent: 0,
      officeAmount: 0,
      travelerPays: 0,
      breakdown: []
    };
  }

  let sawaPercent = 0;
  let officePercent = 0;
  let sawaAmount = 0;
  let officeAmount = 0;
  let travelerPays = 0;
  const breakdown = [];

  switch (hostType) {
    case 'admin':
      // ✅ Admin: No commission
      sawaPercent = 0;
      officePercent = 0;
      sawaAmount = 0;
      officeAmount = 0;
      travelerPays = price;
      breakdown.push({
        label: 'Admin Adventure - No Commission',
        amount: price,
        type: 'base'
      });
      break;

    case 'freelancer':
      // ✅ Freelance Host: 35% SAWA on top
      sawaPercent = 35;
      officePercent = 0;
      sawaAmount = price * 0.35;
      officeAmount = 0;
      travelerPays = price + sawaAmount;
      breakdown.push(
        { label: 'Host receives', amount: price, type: 'host' },
        { label: 'SAWA commission (35%)', amount: sawaAmount, type: 'sawa' }
      );
      break;

    case 'office':
      // ✅ Office Host: 28% SAWA + 7% Office on top
      sawaPercent = 28;
      officePercent = 7;
      sawaAmount = price * 0.28;
      officeAmount = price * 0.07;
      travelerPays = price + sawaAmount + officeAmount;
      breakdown.push(
        { label: 'Host receives', amount: price, type: 'host' },
        { label: 'SAWA commission (28%)', amount: sawaAmount, type: 'sawa' },
        { label: 'Office commission (7%)', amount: officeAmount, type: 'office' }
      );
      break;

    case 'office_entity':
      // ✅ Office Entity: 35% SAWA on top
      sawaPercent = 35;
      officePercent = 0;
      sawaAmount = price * 0.35;
      officeAmount = 0;
      travelerPays = price + sawaAmount;
      breakdown.push(
        { label: 'Office receives', amount: price, type: 'host' },
        { label: 'SAWA commission (35%)', amount: sawaAmount, type: 'sawa' }
      );
      break;

    default:
      // Default to freelancer
      sawaPercent = 35;
      sawaAmount = price * 0.35;
      travelerPays = price + sawaAmount;
      breakdown.push(
        { label: 'Host receives', amount: price, type: 'host' },
        { label: 'SAWA commission (35%)', amount: sawaAmount, type: 'sawa' }
      );
  }

  return {
    hostReceives: price,
    sawaPercent,
    sawaAmount: parseFloat(sawaAmount.toFixed(2)),
    officePercent,
    officeAmount: parseFloat(officeAmount.toFixed(2)),
    travelerPays: parseFloat(travelerPays.toFixed(2)),
    breakdown
  };
}

/**
 * Format commission breakdown for display
 */
export function formatCommissionBreakdown(commissions) {
  const { breakdown, travelerPays } = commissions;
  
  return {
    details: breakdown,
    total: travelerPays,
    summary: breakdown.map(item => `${item.label}: $${item.amount.toFixed(2)}`).join(' + ')
  };
}