# Voice AI Guide - Implementation Instructions

Follow these steps to activate the Voice AI system in **Reserve Dine In**.

## 1. Install Dependencies
Run the following command in your terminal:
```bash
npm install driver.js
```

## 2. Prepare Your Components (HTML IDs)
For the AI Guide to point to specific buttons, you MUST add `id` attributes to your elements.

### Dashboard Screen (`/src/views/DashboardScreen.tsx`)
- Today's Bookings Card: `<div id="todays-bookings">...</div>`
- New Booking Button: `<button id="new-booking-btn">...</button>`
- Table Status Grid: `<div id="table-grid">...</div>`

### New Booking Screen (`/src/components/modals/NewReservationModal.tsx`)
- Customer Name Input: `<input id="customer-name" ... />`
- Date Picker: `<div id="booking-date">...</div>`
- Time Picker: `<div id="booking-time">...</div>`
- Guest Count: `<div id="guest-count">...</div>`
- Confirm Button: `<button id="confirm-btn">...</button>`

### Tables Screen (`/src/views/TableManagement.tsx`)
- Available Group: `<div id="available-tables">...</div>`
- Occupied Group: `<div id="occupied-tables">...</div>`

## 3. How to add VoiceGuide to a Screen
Import and use the component at the bottom of your screen components.

```tsx
import VoiceGuide from '../components/VoiceGuide';
import { VoiceLanguage } from '../services/voiceGuide';

// ... inside your component
const [guideLang, setGuideLang] = useState<VoiceLanguage>('en-IN');

return (
  <div>
    {/* Your regular screen content */}
    
    <VoiceGuide 
      screen="dashboard" 
      language={guideLang} 
      onLanguageChange={setGuideLang} 
    />
  </div>
);
```

## 4. Gemini API Configuration
The voice service uses your Gemini API key automatically. Ensure you have the key in your `.env` file:
```env
GEMINI_API_KEY=your_key_here
```
Note: In AI Studio, this is managed via the Settings menu.

## 5. Test Checklist
- [ ] **Voice Speaker:** Tap 'Help Guide' -> Does it speak in the selected language?
- [ ] **Visual Tour:** Does Driver.js highlight the correct buttons with instructions?
- [ ] **Language Shift:** Change language to Hindi (🇮🇳) -> Does it speak in Hindi?
- [ ] **Voice AI:** Tap the Mic -> Ask "How do I make a booking?" -> Does it answer by voice?
- [ ] **Multi-Screen:** Navigate to New Booking -> Does the guide change its script?
