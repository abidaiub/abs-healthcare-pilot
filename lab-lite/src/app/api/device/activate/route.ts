import { activateDevice } from "../../../../services/devices";
import { errorResponse } from "../../../../lib/session";

export async function POST(request:Request){try{const body=await request.json();return Response.json(await activateDevice(body));}catch(error){return errorResponse(error);}}
