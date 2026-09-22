import { authorizeRequest, errorResponse } from "../../../../lib/session";
import { issueActivationCode, setDeviceStatus } from "../../../../services/devices";

export async function POST(request:Request){try{const principal=await authorizeRequest(request,"devices","create");const body=await request.json();if(body.action==="issue")return Response.json(await issueActivationCode(principal,{branchId:String(body.branchId),expiresInMinutes:Number(body.expiresInMinutes??15)}));if(body.action==="disable"||body.action==="revoke")return Response.json(await setDeviceStatus(principal,String(body.deviceId),body.action==="disable"?"DISABLED":"REVOKED"));return Response.json({error:"Unknown device administration action"},{status:404});}catch(error){return errorResponse(error);}}
