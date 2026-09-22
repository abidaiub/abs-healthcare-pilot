import { authenticateDevice, onlineDueCollection } from "../../../../services/devices";
import { errorResponse } from "../../../../lib/session";

export async function POST(request:Request){try{const context=await authenticateDevice(request.headers.get("x-device-id")??"",request.headers.get("x-device-secret")??"",request.headers.get("x-installation-id")??"");const body=await request.json();if(body.action!=="collectDue")return Response.json({error:"Unknown online-only action"},{status:404});return Response.json(await onlineDueCollection(context,body.input));}catch(error){return errorResponse(error);}}
