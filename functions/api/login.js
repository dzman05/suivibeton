export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const { username, password } = body;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
        }

        const { results } = await env.DB.prepare(
            "SELECT id, username, role, full_name FROM users WHERE username = ? AND password_hash = ?"
        ).bind(username, password).all();

        if (results && results.length > 0) {
            const user = results[0];
            return new Response(JSON.stringify(user), {
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ error: "Identifiants invalides" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
