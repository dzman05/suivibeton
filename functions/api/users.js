export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare("SELECT id, username, role, full_name FROM users").all();
        return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { username, password, role, fullName } = body;

        const { success } = await env.DB.prepare(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)"
        ).bind(username, password, role, fullName).run();

        return new Response(JSON.stringify({ success }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
