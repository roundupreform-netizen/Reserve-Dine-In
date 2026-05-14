import { contextVision } from '../../services/8848/8848ContextVision';

export const runLocalDiagnostics = () => {
  const context = contextVision.getCapture();
  const issues: string[] = [];

  if (!context.currentPage) {
    issues.push("System is in neutral state. Navigation required.");
  }

  if (context.currentPage === 'menu' && !context.activeModal) {
    issues.push("Menu section active. Ensure all categories are synchronized.");
  }

  if (context.currentPage === 'reservations') {
    issues.push("Monitoring table occupancy and reservation flow...");
  }

  return issues;
};
