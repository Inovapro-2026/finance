
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqjybyraiffvggqitwgd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxanlieXJhaWZmdmdncWl0d2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4MzQ5MiwiZXhwIjoyMDg2NzU5NDkyfQ.aheo63gqPPL99-EtwoKHk8bizffZsxNTJ-1smCVoX60';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDb() {
  console.log('Checking database tables...');
  const { data, error } = await supabase.from('users_profile').select('*').limit(1);
  if (error) {
    console.error('Error accessing users_profile:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('Table users_profile DOES NOT EXIST. You need to run the SQL schema.');
    }
  } else {
    console.log('Table users_profile exists.');
  }
}

checkDb();
