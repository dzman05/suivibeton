export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare("SELECT * FROM formulations").all();

        const mapped = results.map(r => ({
            id: r.id,
            code: r.code_formulation,
            ciment: r.dosage_cement,
            eau: r.dosage_water,
            poly: r.dosage_polyflow,
            g1525: r.dosage_gravillon_15_25,
            g815: r.dosage_gravillon_8_15,
            s01: r.dosage_sable_0_1,
            s03: r.dosage_sable_0_3
        }));

        return new Response(JSON.stringify(mapped), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
