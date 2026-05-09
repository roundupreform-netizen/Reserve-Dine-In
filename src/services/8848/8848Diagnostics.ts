import { DiagnosticIssue } from '../../store/8848/use8848Diagnostics';
import { isPast, isToday } from 'date-fns';

export const analyzeSystemState = async (context: any, data: any): Promise<DiagnosticIssue[]> => {
  const issues: DiagnosticIssue[] = [];

  // 1. Check for Stale Reservations (Past time but still pending/confirmed)
  if (data.reservations) {
    data.reservations.forEach((res: any) => {
      const resDate = new Date(res.date);
      if (isPast(resDate) && !isToday(resDate) && ['pending', 'confirmed'].includes(res.status)) {
        issues.push({
          id: `stale-${res.id}`,
          type: 'stale',
          severity: 'medium',
          title: 'Stale Reservation Detected',
          description: `${res.customerName}'s reservation is from a past date. Should we mark it as completed or no-show?`,
          affectedElement: `[data-res-id="${res.id}"]`,
          suggestedFix: 'Update status to completed'
        });
      }
    });
  }

  // 2. Check for Double Bookings
  if (data.reservations) {
    const bookingMap: Record<string, any[]> = {};
    data.reservations.forEach((res: any) => {
      const key = `${res.date}-${res.time}-${res.tableId}`;
      if (!bookingMap[key]) bookingMap[key] = [];
      bookingMap[key].push(res);
      if (bookingMap[key].length > 1) {
        issues.push({
          id: `conflict-${key}`,
          type: 'conflict',
          severity: 'high',
          title: 'Table Conflict Detected',
          description: `Multiple units allocated to Table ${res.tableId} at ${res.time}.`,
          affectedElement: `[data-table-id="${res.tableId}"]`,
          suggestedFix: 'Reassign one reservation'
        });
      }
    });
  }

  // 3. UI Context Issues
  if (context.currentPage === 'reservations' && context.activeModal === 'new_reservation') {
    // If we are in the flow but data is missing
    if (!context.selectedReservation?.customerPhone) {
      issues.push({
        id: 'missing-phone',
        type: 'invalid_data',
        severity: 'low',
        title: 'Incomplete Guest Profile',
        description: 'Customer phone number is missing. Strategic communication (WhatsApp) will be unavailable.',
        affectedElement: '#customer-phone-input',
        suggestedFix: 'Enter phone number'
      });
    }
  }

  // 4. Upload Issues
  if (context.uploadState === 'error') {
    issues.push({
      id: 'upload-failure',
      type: 'system',
      severity: 'critical',
      title: 'Tactical Data Upload Failed',
      description: 'The menu upload sequence was interrupted. Check network or file format.',
      suggestedFix: 'Retry upload'
    });
  }

  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return issues;
};
