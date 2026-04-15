const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
    console.log("Creating superadmin user...");
    const { data, error } = await supabase.auth.signUp({
        email: 'mukhsin9@gmail.com',
        password: 'Jlamprang233!!',
        options: {
            data: {
                role: 'superadmin',
                full_name: 'Mukhsin Superadmin'
            }
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log("User already exists!");
        } else {
            console.error("Error creating user:", error);
        }
    } else {
        console.log("User created successfully:", data.user?.email);
    }
}

seedAdmin();
