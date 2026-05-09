
/**
 * Generates a string payload for the QR code based on reservation data.
 */
export const generateQRPayload = (res: any) => {
  if (!res) return '';
  
  const payload = {
    id: res.id,
    guest: res.guestName,
    date: res.date,
    time: res.time,
    guests: res.guests,
    table: res.selectedTables?.join(', ') || 'Waitlist'
  };

  return JSON.stringify(payload);
};
