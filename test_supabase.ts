
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqjybyraiffvggqitwgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxanlieXJhaWZmdmdncWl0d2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODM0OTIsImV4cCI6MjA4Njc1OTQ5Mn0.QOqV4x8kmsV7mt7qVEadftPKIWVuFcAudASWZFNt9oM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  console.log(`Attempting signup with ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup Error:', error.message, error.status);
  } else {
    console.log('Signup Success:', data.user?.id);
    console.log('Session:', data.session ? 'Created' : 'Not created (needs confirmation?)');
  }
}

testSignup();
