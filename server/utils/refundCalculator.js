/**
 * Tiered Refund Calculator (Member 4)
 *
 * Refund policy, based on how many hours are left before the flight departs:
 *   96 hours or more  -> 75% refund
 *   48 to 96 hours    -> 50% refund
 *   24 to 48 hours    -> 25% refund
 *   less than 24 hours -> 0% (non-refundable)
 *
 * This file is plain JavaScript with no imports, so the same function is used
 * by the backend (bookingController) and by the frontend (RefundModal).
 * That way the estimate the user sees always matches what the server pays.
 */

// Each tier: if hoursLeft >= minHours, the user gets `percent` back.
// Listed from the highest tier to the lowest, so the first match wins.
const REFUND_TIERS = [
  { minHours: 96, percent: 75 },
  { minHours: 48, percent: 50 },
  { minHours: 24, percent: 25 }
];

/**
 * @param {Date|string} departureTime - When the flight departs
 * @param {number} totalAmount        - What the user originally paid
 * @param {Date} [now=new Date()]     - Current time (passed in by tests)
 * @returns {{ hoursUntilDeparture: number, refundPercentage: number, refundAmount: number }}
 */
const calculateRefund = (departureTime, totalAmount, now = new Date()) => {
  const msLeft = new Date(departureTime).getTime() - new Date(now).getTime();
  const hoursLeft = msLeft / (1000 * 60 * 60);

  const tier = REFUND_TIERS.find((t) => hoursLeft >= t.minHours);
  const refundPercentage = tier ? tier.percent : 0;

  // Round to 2 decimal places (paise) so wallet balances stay clean
  const refundAmount = Math.round(totalAmount * refundPercentage) / 100;

  return {
    hoursUntilDeparture: Math.max(0, Math.floor(hoursLeft)),
    refundPercentage,
    refundAmount
  };
};

module.exports = { calculateRefund, REFUND_TIERS };
