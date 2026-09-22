import { authorizeRequest, errorResponse } from "../../../../lib/session";
import { query } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const p = await authorizeRequest(request, "tenant_settings", "read");
    const result = await query(`select code,name,legal_name,address,phone,email,timezone,currency_code,receipt_footer from tenants where id=$1`, [p.tenantId]);
    return Response.json(result.rows[0]);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const p = await authorizeRequest(request, "tenant_settings", "update");
    const body = await request.json() as { name?: string; receiptFooter?: string };
    if (!body.name?.trim()) return Response.json({ error: "name is required" }, { status: 422 });
    await query(`update tenants set name=$2,receipt_footer=$3,updated_at=now() where id=$1`, [p.tenantId, body.name.trim(), body.receiptFooter?.trim() || null]);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
