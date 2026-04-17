import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
    const { data, error } = await supabase.from('profiles').update({ unit_id: 'invalid-but-not-for-where-clause' }).eq('id', '9b7a9cf1-5ea2-4b95-b23f-6927155af026')
    console.log("Error on unit_id type check:", error)
}
check()
