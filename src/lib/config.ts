
// Application Configuration

// Toggle this to switch between Real Supabase Backend and Local Mock Service Layer
// DEMO MODE: Using local mock data for demonstration
export const USE_MOCK = true;

// Gemini API Key for AI Chat
export const GEMINI_API_KEY = import.meta.env.VITE_AI_API_KEY || "AIzaSyAJS3o7JTKskUpDNAkPR6CJQgsgIVDcXDw";

// Mock user delay to simulate network requests (only applies when USE_MOCK = true)
export const MOCK_DELAY_MS = 600;

export const APP_CONFIG = {
    name: 'ConceptPulse',
    version: '1.0.0',
    description: 'AI-Powered Learning Loop',
    environment: 'production'
};

export const logConfig = () => {
    console.log(`%c${APP_CONFIG.name} v${APP_CONFIG.version}`, 'font-weight: bold; color: #4F46E5; font-size: 14px;');
    console.log(`Environment: ${APP_CONFIG.environment} (Mock Mode: ${USE_MOCK})`);
};
