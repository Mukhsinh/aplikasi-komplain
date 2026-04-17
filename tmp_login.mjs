import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'puasadm2025@gmail.com', // wait, I don't know the exact superadmin email
        password: 'password'
    })
    console.log("Login:", error)
}
check()
