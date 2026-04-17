const check = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/admin-create-user'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Simulate the exact request from the frontend but we need an actual auth token for Authorization header.
            // Since I don't have a user token, I can't trigger it directly without auth unless the edge func bypasses it. 
        },
        body: JSON.stringify({ email: 'keuangan2@gmail.com', password: 'password234', nama_lengkap: 'Kasi Keuangan 2', role: 'supervisor', unit_id: null })
    })
    const text = await res.text()
    console.log("Response text:", text)
}
check()
