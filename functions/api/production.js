export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare("SELECT * FROM production ORDER BY date_production DESC").all();

        // Map to frontend format if needed, but schema matches closely
        const mapped = results.map(r => ({
            id: r.id,
            date: r.date_production,
            centrale: r.centrale_name,
            formulationId: r.formulation_id,
            quantity: r.quantity_m3,
            destination: '' // Not in schema yet? Add if needed or infer
        }));

        return new Response(JSON.stringify(mapped), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { date, centrale, formulationId, quantity, destination } = body;

        const { success } = await env.DB.prepare(
            "INSERT INTO production (date_production, centrale_name, formulation_id, quantity_m3) VALUES (?, ?, ?, ?)"
        ).bind(date, centrale, formulationId, quantity).run();

        return new Response(JSON.stringify({ success }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
