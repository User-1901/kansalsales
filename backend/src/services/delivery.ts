// ── DELIVERY AREA SERVICE ──────────────────────────────────────────────────
// Manages delivery area restrictions by pincode
// Currently restricted to Chandigarh pincodes

// List of valid delivery pincodes in Chandigarh
// Easy to add/remove pincodes - just edit this array
const VALID_DELIVERY_PINCODES = [
  // Chandigarh Union Territory
  '160001', // Sector 1
  '160002', // Sector 2
  '160003', // Sector 3
  '160004', // Sector 4
  '160005', // Sector 5
  '160006', // Sector 6
  '160007', // Sector 7
  '160008', // Sector 8
  '160009', // Sector 9
  '160010', // Sector 10
  '160011', // Sector 11
  '160012', // Sector 12
  '160013', // Sector 13
  '160014', // Sector 14
  '160015', // Sector 15
  '160016', // Sector 16
  '160017', // Sector 17
  '160018', // Sector 18
  '160019', // Sector 19
  '160020', // Sector 20
  '160021', // Sector 21
  '160022', // Sector 22
  '160023', // Sector 23
  '160024', // Sector 24
  '160025', // Sector 25
  '160026', // Sector 26
  '160027', // Sector 27
  '160028', // Sector 28
  '160029', // Sector 29
  '160030', // Sector 30
  '160031', // Sector 31
  '160032', // Sector 32
  '160033', // Sector 33
  '160034', // Sector 34
  '160035', // Sector 35
  '160036', // Sector 36
  '160037', // Sector 37
  '160038', // Sector 38
  '160039', // Sector 39
  '160040', // Sector 40
  '160041', // Sector 41
  '160042', // Sector 42
  '160043', // Sector 43
  '160044', // Sector 44
  '160045', // Sector 45
  '160046', // Sector 46
  '160047', // Sector 47
  '160048', // Sector 48
  '160049', // Sector 49
  '160050', // Sector 50
  '160051', // Sector 51
  '160052', // Sector 52
  '160053', // Sector 53
  '160054', // Sector 54
  '160055', // Sector 55
  '160056', // Sector 56
  '160057', // Sector 57
  '160058', // Sector 58
  '160059', // Sector 59
  '160060', // Sector 60
  '160061', // Panchkula
  '160062', // Mohali
  '160100', // New Chandigarh
  '160014', // Burail
  '160014', // Industrial Area Phase 1
  '160014', // Industrial Area Phase 2
];

// ── VALIDATE DELIVERY PINCODE ──────────────────────────────────────────────
// Checks if the given pincode is a valid delivery area
// Returns { isValid: boolean, message: string }
export function validateDeliveryPincode(pincode: string): { isValid: boolean; message: string } {
  if (!pincode || pincode.trim() === '') {
    return { isValid: false, message: 'Pincode is required' };
  }

  if (!/^\d{6}$/.test(pincode.trim())) {
    return { isValid: false, message: 'Please enter a valid 6-digit pincode' };
  }

  const isValid = VALID_DELIVERY_PINCODES.includes(pincode.trim());

  if (!isValid) {
    return {
      isValid: false,
      message: 'Sorry we are not available in that area, will reach you soon'
    };
  }

  return { isValid: true, message: 'Delivery available in this pincode' };
}

// ── GET VALID DELIVERY PINCODES ────────────────────────────────────────────
// Returns list of all valid delivery pincodes
export function getValidDeliveryPincodes(): string[] {
  return VALID_DELIVERY_PINCODES;
}

// ── GET PINCODE SUGGESTIONS ────────────────────────────────────────────────
// Returns pincodes that match the search query (for autocomplete)
export function getDeliveryPincodeSuggestions(query: string): string[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalized = query.trim();
  return VALID_DELIVERY_PINCODES
    .filter(pincode => pincode.includes(normalized))
    .slice(0, 10);  // Return top 10 suggestions
}
