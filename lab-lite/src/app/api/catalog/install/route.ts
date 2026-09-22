import { authorizeRequest, errorResponse } from "../../../../lib/session";
import { installCatalogTier, installTemplate, type CatalogTier } from "../../../../services/catalog";

export async function POST(request: Request) {
  try {
    const p = await authorizeRequest(request, "catalog", "create");
    const body = await request.json() as { templateCode?: string; tier?: CatalogTier; price?: string };
    if (body.tier) return Response.json(await installCatalogTier(p.tenantId, body.tier));
    if (!body.templateCode) return Response.json({ error: "templateCode or tier is required" }, { status: 422 });
    return Response.json(await installTemplate(p.tenantId, body.templateCode, body.price ?? null));
  } catch (error) { return errorResponse(error); }
}
