/**
 * Shared test fixtures & selectors
 * ─────────────────────────────────
 * Central place for CSS selectors so tests stay DRY and resilient.
 */

/** CSS / aria selectors used across tests */
export const SEL = {
  // Layout
  topBar: '.topbar-root',
  sidebar: '.sidebar-enterprise-wrap',
  iconRail: '.icon-rail',
  mainContent: '.enterprise-main',

  // Navigation buttons (inside icon-rail)
  navHome: '.icon-rail button[aria-label="Home"]',
  navChat: '.icon-rail button[aria-label="Chat"]',
  navSettings: '.icon-rail button[aria-label="Settings"]',
  navDocs: '.icon-rail button[aria-label="Documents"]',

  // TopBar
  lindeLogo: '.topbar-root img[alt]',
  searchInput: '.topbar-search-wrap input',

  // Composer (Chat input)
  composerRoot: '.composer-root',
  composerTextarea: '.composer-textarea',
  sendButton: '.send-btn',
  attachButton: '.composer-attach-btn',

  // Chat
  chatThread: '.thread',
  chatMessage: '.chat-msg-group',
  typingIndicator: '.typing-indicator',

  // Home Dashboard
  dashboard: '.home-dashboard',
  dashboardTitle: '.hd-title',

  // Settings
  settingsPage: '.settings-page',
  settingsToggle: '[role="switch"]',
  settingsCard: '.sp-card',

  // Sidebar toggle
  sidebarCollapse: 'button[aria-label="Collapse sidebar panel"]',
  sidebarExpand: 'button[aria-label="Expand sidebar panel"]',
} as const;

/** Default page load timeout */
export const PAGE_LOAD_TIMEOUT = 15_000;

/** Chat response wait timeout (n8n roundtrip) */
export const CHAT_RESPONSE_TIMEOUT = 45_000;
