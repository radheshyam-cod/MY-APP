import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { initializeApplication } from './lib/startup-validation';
import { USE_MOCK, logConfig } from './lib/config';

// Demo mode initialization
async function initializeDemoMode() {
  if (USE_MOCK) {
    // Check if we already have an active demo session
    const existingProfile = localStorage.getItem('mock_active_user_profile');
    if (existingProfile) {
      console.log('✅ Using existing demo session (skipping re-init)');
      return;
    }

    console.log('🎭 Initializing demo mode...');

    // Dynamic import to avoid bundling demo script in production
    const { initializeDemoState, setupLocalStorage } = await import('./lib/initialize-demo');
    const demoState = initializeDemoState();
    setupLocalStorage(demoState);

    console.log('✅ Demo mode initialized');
  }
}

// Initialize application with validation
async function startApplication() {
  try {
    console.log('🚀 ConceptPulse - Starting application...');

    // Log configuration
    logConfig();

    // Initialize demo mode if enabled
    await initializeDemoMode();

    // Run startup validation
    const validationResult = await initializeApplication();

    if (!validationResult.success) {
      // Show startup error screen
      const root = createRoot(document.getElementById('root')!);
      root.render(
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Application Startup Failed</h1>
              <p className="text-gray-600 mb-4">ConceptPulse could not start due to configuration issues.</p>
            </div>

            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-gray-900">Errors:</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>

            {validationResult.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="font-semibold text-gray-900">Warnings:</h3>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
      return;
    }

    // Application validation passed, render the app
    console.log('✅ Application validation passed - rendering app');

    const root = createRoot(document.getElementById('root')!);
    root.render(<App />);

  } catch (error) {
    console.error('💥 Critical application error:', error);

    // Show critical error screen
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Critical Error</h1>
          <p className="text-gray-600 mb-4">
            A critical error occurred during application startup.
          </p>
          <p className="text-sm text-red-600 mb-4 font-mono bg-red-50 p-2 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

// Start the application
startApplication();