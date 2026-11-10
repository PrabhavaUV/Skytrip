import React, { useState, useEffect } from 'react';

/**
 * Dynamic Passenger Details Form
 * Props:
 *  - selectedSeats: Array of seat numbers (e.g. ['E1A', 'E1B'])
 *  - onPassengersChange: ({ passengers, isValid, errors }) => void
 */
function PassengerForm({ selectedSeats = [], onPassengersChange }) {
  // Initialize or synchronize passenger state with selectedSeats
  const [passengers, setPassengers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPassengers((prevPassengers) => {
      return selectedSeats.map((seatNum) => {
        const existing = prevPassengers.find((p) => p.seatNumber === seatNum);
        if (existing) return existing;

        return {
          seatNumber: seatNum,
          fullName: '',
          age: '',
          email: '',
          phone: '',
          aadhaarNumber: '',
          passportNumber: '',
          mealPreference: 'VEG',
        };
      });
    });
  }, [selectedSeats]);

  // Validation function
  const validateForm = (passengerList) => {
    const newErrors = {};
    const aadhaarSet = new Set();
    const phoneSet = new Set();
    const passportSet = new Set();

    passengerList.forEach((p, idx) => {
      const pErrors = {};

      // Name check
      if (!p.fullName || !p.fullName.trim()) {
        pErrors.fullName = 'Full name is required';
      }

      // Age check
      const ageNum = parseInt(p.age, 10);
      if (!p.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        pErrors.age = 'Enter a valid age (1-120)';
      }

      // Phone check
      if (!p.phone || !/^\d{10}$/.test(p.phone.trim())) {
        pErrors.phone = 'Phone number must be 10 digits';
      }

      // Aadhaar check (exact 12 numeric digits)
      if (!p.aadhaarNumber || !/^\d{12}$/.test(p.aadhaarNumber.trim())) {
        pErrors.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
      }

      // Passport check (optional 6-20 alphanumeric)
      if (p.passportNumber && p.passportNumber.trim()) {
        if (!/^[A-Za-z0-9]{6,20}$/.test(p.passportNumber.trim())) {
          pErrors.passportNumber = 'Passport must be 6-20 alphanumeric characters';
        }
      }

      // Duplicate check across passengers
      const cleanAadhaar = p.aadhaarNumber ? p.aadhaarNumber.trim() : '';
      const cleanPhone = p.phone ? p.phone.trim() : '';
      const cleanPassport = p.passportNumber ? p.passportNumber.trim().toUpperCase() : '';

      if (cleanAadhaar) {
        if (aadhaarSet.has(cleanAadhaar)) {
          pErrors.aadhaarNumber = 'Duplicate detected: every passenger must have unique identification';
        } else {
          aadhaarSet.add(cleanAadhaar);
        }
      }

      if (cleanPhone) {
        if (phoneSet.has(cleanPhone)) {
          pErrors.phone = 'Duplicate phone number detected across passengers';
        } else {
          phoneSet.add(cleanPhone);
        }
      }

      if (cleanPassport) {
        if (passportSet.has(cleanPassport)) {
          pErrors.passportNumber = 'Duplicate passport number detected';
        } else {
          passportSet.add(cleanPassport);
        }
      }

      if (Object.keys(pErrors).length > 0) {
        newErrors[p.seatNumber] = pErrors;
      }
    });

    const isValid =
      passengerList.length > 0 &&
      Object.keys(newErrors).length === 0 &&
      passengerList.every(
        (p) =>
          p.fullName.trim() &&
          p.age &&
          /^\d{10}$/.test(p.phone.trim()) &&
          /^\d{12}$/.test(p.aadhaarNumber.trim())
      );

    setErrors(newErrors);

    if (onPassengersChange) {
      onPassengersChange({
        passengers: passengerList,
        isValid,
        errors: newErrors,
      });
    }
  };

  const handleFieldChange = (seatNumber, field, value) => {
    const updated = passengers.map((p) => {
      if (p.seatNumber === seatNumber) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPassengers(updated);
    validateForm(updated);
  };

  if (selectedSeats.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '2.5rem', width: '100%', maxWidth: '850px', margin: '2.5rem auto 0' }}>
      <div
        style={{
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', color: '#D4AF37', margin: 0 }}>
          📋 Passenger Information ({selectedSeats.length} Passenger{selectedSeats.length > 1 ? 's' : ''})
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          * Government ID (Aadhaar) required for all domestic passengers
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {passengers.map((passenger, idx) => {
          const seatErrors = errors[passenger.seatNumber] || {};

          return (
            <div
              key={passenger.seatNumber}
              style={{
                background: '#141b2d',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #b89628 100%)',
                      color: '#0a0f1f',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    Passenger {idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                    Seat: <strong style={{ color: '#D4AF37' }}>{passenger.seatNumber}</strong>
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Full Name (as per ID) *
                  </label>
                  <input
                    type="text"
                    value={passenger.fullName}
                    placeholder="e.g. Rahul Sharma"
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'fullName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: seatErrors.fullName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  />
                  {seatErrors.fullName && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {seatErrors.fullName}
                    </span>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={passenger.age}
                    placeholder="e.g. 28"
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'age', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: seatErrors.age ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  />
                  {seatErrors.age && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {seatErrors.age}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Mobile Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    maxLength="10"
                    value={passenger.phone}
                    placeholder="e.g. 9876543210"
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'phone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: seatErrors.phone ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  />
                  {seatErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {seatErrors.phone}
                    </span>
                  )}
                </div>

                {/* Aadhaar Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Aadhaar Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    maxLength="12"
                    value={passenger.aadhaarNumber}
                    placeholder="12 digit Aadhaar"
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'aadhaarNumber', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: seatErrors.aadhaarNumber ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      letterSpacing: '1px',
                    }}
                  />
                  {seatErrors.aadhaarNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {seatErrors.aadhaarNumber}
                    </span>
                  )}
                </div>

                {/* Passport Number (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Passport Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={passenger.passportNumber}
                    placeholder="e.g. A1234567"
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'passportNumber', e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: seatErrors.passportNumber ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  />
                  {seatErrors.passportNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {seatErrors.passportNumber}
                    </span>
                  )}
                </div>

                {/* Meal Preference */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.35rem' }}>
                    Meal Preference
                  </label>
                  <select
                    value={passenger.mealPreference}
                    onChange={(e) => handleFieldChange(passenger.seatNumber, 'mealPreference', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#0f1629',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="VEG">🥦 Vegetarian Meal</option>
                    <option value="NON_VEG">🍗 Non-Vegetarian Meal</option>
                    <option value="JAIN">🥗 Jain Meal</option>
                    <option value="DIABETIC">🍎 Diabetic Friendly</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PassengerForm;
