/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use fallbacks
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl = envUrl || 'https://hqjybyraiffvggqitwgd.supabase.co';
const supabaseAnonKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxanlieXJhaWZmdmdncWl0d2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODM0OTIsImV4cCI6MjA4Njc1OTQ5Mn0.QOqV4x8kmsV7mt7qVEadftPKIWVuFcAudASWZFNt9oM';

// Sanitize the URL in case the user pasted the dashboard URL instead of the project URL
if (supabaseUrl.includes('supabase.com/dashboard/project/')) {
    const projectId = supabaseUrl.split('supabase.com/dashboard/project/')[1].split('/')[0];
    supabaseUrl = `https://${projectId}.supabase.co`;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

