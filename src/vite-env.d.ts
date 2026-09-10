/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_JITSI_DOMAIN: string;
  readonly VITE_REGISTRATION_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
