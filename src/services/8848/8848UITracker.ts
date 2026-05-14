export const UI_ELEMENTS = {
  // Navigation
  DASHBOARD_NAV: '#nav-dashboard',
  RESERVATIONS_NAV: '#nav-reservations',
  CALENDAR_NAV: '#nav-calendar',
  TABLES_NAV: '#nav-tables',
  MENU_DINEIN_NAV: '#nav-dineInMenu',
  MENU_HIGHTEA_NAV: '#nav-highTeaMenu',
  OUTLET_NAV: '#nav-outlet',
  AI_TRAINER_BTN: '#ai-trainer-btn',

  // Dashboard
  NEW_BOOKING_DASHBOARD: '#dashboard-new-booking',
  LIVE_STATUS_CARD: '#live-status-card',

  // Reservations
  NEW_RESERVATION_BTN: '#new-reservation-btn',
  SEARCH_RESERVATION: '#res-search-input',
  RESERVATION_LIST: '#reservation-list',

  // Modal: New Reservation
  MODAL_DATE_PICKER: '#interactive-date-picker',
  MODAL_GUEST_NAME: 'input[placeholder="Enter customer name"]',
  MODAL_GUEST_PHONE: 'input[placeholder="Enter phone number"]',
  MODAL_GUEST_EMAIL: 'input[placeholder="Enter email address (optional)"]',
  MODAL_PARTY_SIZE: 'input[type="number"]',
  MODAL_OCCASION: 'select',
  MODAL_TYPE_DINEIN: '#res-type-dine-in',
  MODAL_TYPE_HIGHTEA: '#res-type-high-tea',
  MODAL_NEXT_BTN: '#res-modal-action-btn',
  
  // Menu
  MENU_CATEGORY_LIST: '#menu-category-list',
  MENU_ITEM_GRID: '#menu-item-grid',
  ADD_MENU_ITEM_BTN: '#add-menu-item-btn',

  // Tables
  TABLE_GRID: '#table-grid',
  ADD_TABLE_BTN: '#add-table-btn',
};

export class UITracker8848 {
  public static getSelector(name: string): string {
    if (!name) return '';
    const key = name.toUpperCase().replace(/\s+/g, '_');
    return (UI_ELEMENTS as any)[key] || name;
  }

  public static getRect(selector: string): DOMRect | null {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect() : null;
  }
}
