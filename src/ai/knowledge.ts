export const AI_KNOWLEDGE = {
  reservations: {
    status_flow: "Pending -> Confirmed -> Arrived -> Seated -> Completed",
    common_issues: {
      "Time Conflict": "A reservation already exists at this table for this time slot.",
      "Capacity Exceeded": "Guest count exceeds the table's maximum capacity.",
      "Voucher Failure": "WhatsApp voucher could not be generated due to image processing issues."
    }
  },
  menu_uploads: {
    formats: ["PDF", "PNG", "JPG", "CSV", "XLSX"],
    smart_import: "Uses Vision AI to extract Name, Price, and Category from menu images."
  },
  shortcuts: {
    "dashboard": "Overview of today's stats.",
    "reservations": "List and management of all bookings.",
    "calendar": "Monthly availability view."
  }
};

export const TROUBLESHOOTING_GUIDE = [
  {
    id: 'whatsapp_fail',
    trigger: (context: any) => context.lastAction === 'whatsapp_share' && context.currentPage === 'reservations',
    steps: [
      "Check if simple popup was blocked by browser",
      "Verify that client phone number is valid in E.164 format",
      "Ensure the reservation voucher image was generated successfully"
    ]
  }
];
