// Google OAuth Client ID — must be set via VITE_GOOGLE_CLIENT_ID env var
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!CLIENT_ID) console.error('⚠️ VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');

// Google Sheets API scope
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly openid profile email';

// Sheet tab name
export const SHEET_TAB = '25B';

// localStorage keys
export const STORAGE_KEY = 'dsa-tracker';
export const TOKEN_KEY = 'gis-token';
