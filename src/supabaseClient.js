import { createClient } from '@supabase/supabase-js'

// الـ URL الأساسي بس (من غير /rest/v1/)
const SUPABASE_URL = 'https://jlljnveeikdapezzhvji.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbGpudmVlaWtkYXBlenpodmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNzA2MjcsImV4cCI6MjEwMjc0NjYyN30.ohrxe4GTwJNQ3G_CSdVSuGidtPdQfnWhV4eLeEoqpqs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)