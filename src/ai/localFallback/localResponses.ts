export const LOCAL_KNOWLEDGE_BASE: Record<string, string> = {
  "reservation": "To make a reservation, go to the 'Reservations' tab. You can view all upcoming tables and manage waitlists there.",
  "menu": "You can upload and manage your digital menu in the 'Menu' section. We support PDF and Image formats.",
  "whatsapp": "Configure your WhatsApp notifications in Settings > Integrations. This allows automatic confirmation messages to customers.",
  "walkthrough": "I can guide you through any feature. Just ask 'How do I use this?'",
  "8848": "8848 Meters is your AI Operating Layer, monitoring real-time diagnostics and providing operational intelligence.",
  "diagnostics": "I monitor system health, database latency, and user workflow efficiency in real-time.",
  "billing": "Check your account status and usage in the billing portal located in settings.",
  "help": "I can help with reservations, menu setup, staff management, and system diagnostics."
};

export const findLocalResponse = (query: string): string | null => {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(LOCAL_KNOWLEDGE_BASE)) {
    if (q.includes(key)) return response;
  }
  return null;
};
