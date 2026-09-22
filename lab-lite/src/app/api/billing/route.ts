import { authorizeRequest, errorResponse } from "../../../lib/session";
import { cancelBill, cancelDraft, collectDue, dailyCollectionReport, decideRefund, findBills, getBillingRecord, payRefund, postBill, requestRefund, saveDraft, searchBillingContext } from "../../../services/billing";
import { createPatient } from "../../../services/records";

export async function GET(request:Request){
  try{const url=new URL(request.url);const view=url.searchParams.get("view")??"context";const permission=view==="report"?"collection_reports":"billing";const p=await authorizeRequest(request,permission,"read");
    if(view==="context")return Response.json(await searchBillingContext(p.tenantId,url.searchParams.get("q")??""));
    if(view==="bills")return Response.json(await findBills(p.tenantId,url.searchParams.get("q")??""));
    if(view==="report")return Response.json(await dailyCollectionReport(p.tenantId,{date:url.searchParams.get("date")??new Date().toISOString().slice(0,10),branchId:url.searchParams.get("branchId")??undefined,cashierId:url.searchParams.get("cashierId")??undefined,method:url.searchParams.get("method")??undefined}));
    if(view==="receipt"){const type=url.searchParams.get("type") as "bill"|"collection"|"refund";const id=url.searchParams.get("id");if(!id||!["bill","collection","refund"].includes(type))throw new Error("Invalid receipt request");return Response.json(await getBillingRecord(p.tenantId,type,id));}
    return Response.json({error:"Unknown view"},{status:404});
  }catch(error){return errorResponse(error);}
}

export async function POST(request:Request){
  try{const body=await request.json() as Record<string,unknown>;const action=String(body.action??"");
    if(action==="quickPatient"){const p=await authorizeRequest(request,"patients","create");return Response.json(await createPatient({tenantId:p.tenantId,branchId:p.branchId,patientNumber:String(body.patientNumber),fullName:String(body.fullName),mobile:String(body.mobile??""),sex:(body.sex??"UNKNOWN") as "M"|"F"|"OTHER"|"UNKNOWN"}));}
    const p=await authorizeRequest(request,"billing","read");
    if(action==="postBill")return Response.json(await postBill(p,body.input as Parameters<typeof postBill>[1]));
    if(action==="collectDue")return Response.json(await collectDue(p,body.input as Parameters<typeof collectDue>[1]));
    if(action==="cancelBill")return Response.json(await cancelBill(p,body.input as Parameters<typeof cancelBill>[1]));
    if(action==="refundRequest")return Response.json(await requestRefund(p,body.input as Parameters<typeof requestRefund>[1]));
    if(action==="refundDecision")return Response.json(await decideRefund(p,body.input as Parameters<typeof decideRefund>[1]));
    if(action==="refundPayout")return Response.json(await payRefund(p,body.input as Parameters<typeof payRefund>[1]));
    if(action==="saveDraft")return Response.json(await saveDraft(p,body.input as Parameters<typeof saveDraft>[1]));
    if(action==="cancelDraft"){await cancelDraft(p,String(body.draftId));return Response.json({ok:true});}
    return Response.json({error:"Unknown operation"},{status:404});
  }catch(error){return errorResponse(error);}
}
