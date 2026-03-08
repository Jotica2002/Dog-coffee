import { createClient } from '@supabase/supabase-js'

// Reemplaza los textos entre comillas simples con tus datos reales
const supabaseUrl = 'https://gpqcdmesfmyachumfhri.supabase.co'
const supabaseKey = 'sb_publishable_7DbHm4THlXm6bH-u4QwteA_8U9qKxz7'

export const supabase = createClient(supabaseUrl, supabaseKey)