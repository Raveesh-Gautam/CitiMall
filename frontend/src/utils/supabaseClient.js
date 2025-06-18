import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://siltgcvoggnkfqjseaem.supabase.co'
const supabaseAnonKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbHRnY3ZvZ2dua2ZxanNlYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzkxNDIsImV4cCI6MjA2NTgxNTE0Mn0.Zbxb494Ic6FI9aJVXQ6cnnLFUYBGHiWdoZSdZ3hqXtM";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
