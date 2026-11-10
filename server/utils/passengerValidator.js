/**
 * Passenger Details & ID Validator
 * Enforces regulatory ID checks (Aadhaar, Passport) and prevents duplicate passenger data.
 */

// Rule 1: Aadhaar must be exactly 12 numeric digits
const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);

// Rule 2: Passport must be 6-20 alphanumeric (optional field)
const validatePassport = (passport) => !passport || /^[A-Z0-9]{6,20}$/i.test(passport);

// Rule 3: No two passengers in the same booking can share Aadhaar, phone, or passport
const checkDuplicatePassengers = (passengers = []) => {
  const aadhaarSet = new Set();
  const phoneSet = new Set();
  const passportSet = new Set();

  for (const p of passengers) {
    if (p.aadhaarNumber) {
      const cleanAadhaar = String(p.aadhaarNumber).trim();
      if (aadhaarSet.has(cleanAadhaar)) {
        return { valid: false, message: 'Duplicate Aadhaar number detected' };
      }
      aadhaarSet.add(cleanAadhaar);
    }

    if (p.phone) {
      const cleanPhone = String(p.phone).trim();
      if (phoneSet.has(cleanPhone)) {
        return { valid: false, message: 'Duplicate phone number detected' };
      }
      phoneSet.add(cleanPhone);
    }

    if (p.passportNumber && String(p.passportNumber).trim()) {
      const cleanPassport = String(p.passportNumber).trim().toUpperCase();
      if (passportSet.has(cleanPassport)) {
        return { valid: false, message: 'Duplicate passport number detected' };
      }
      passportSet.add(cleanPassport);
    }
  }

  return { valid: true };
};

module.exports = {
  validateAadhaar,
  validatePassport,
  checkDuplicatePassengers,
};
