/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_AI_API_KEY?: string;
    readonly VITE_AI_SERVICE_URL?: string;
    readonly VITE_STORAGE_BUCKET?: string;
    readonly VITE_JWT_SECRET?: string;
    readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
