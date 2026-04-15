import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
    const { data: tickets, error: e1 } = await supabase.from('tickets').select('*').limit(1)
    console.log('tickets:', Object.keys(tickets?.[0] || {}), e1?.message)

    const { data: units, error: e2 } = await supabase.from('units').select('*').limit(1)
    console.log('units:', Object.keys(units?.[0] || {}), e2?.message)

    const { data: profiles, error: e3 } = await supabase.from('profiles').select('*').limit(1)
    console.log('profiles:', Object.keys(profiles?.[0] || {}), e3?.message)
}

check()
