export interface WalkthroughStep {
  targetId: string;
  advice: string;
  highlight: string;
}

export const LOCAL_WALKTHROUGHS: Record<string, WalkthroughStep[]> = {
  "onboarding": [
    { targetId: "nav-reservations", advice: "Start by checking your current reservations.", highlight: "reservations_link" },
    { targetId: "nav-menu", advice: "Upload your menu to enable digital ordering.", highlight: "menu_link" },
    { targetId: "nav-settings", advice: "Finally, configure your WhatsApp alerts.", highlight: "settings_link" }
  ],
  "reservation_help": [
    { targetId: "add-reservation-btn", advice: "Click here to add a new guest to your list.", highlight: "add_btn" },
    { targetId: "table-grid", advice: "This grid shows all your available and occupied tables.", highlight: "grid" }
  ]
};

export const getWalkthrough = (key: string) => LOCAL_WALKTHROUGHS[key] || null;
