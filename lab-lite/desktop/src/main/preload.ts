import { contextBridge,ipcRenderer } from "electron";
const invoke=(channel:string,payload?:unknown)=>ipcRenderer.invoke(channel,payload);
contextBridge.exposeInMainWorld("labLite",{
  state:()=>invoke("state"),activate:(value:unknown)=>invoke("activate",value),login:(value:unknown)=>invoke("login",value),logout:()=>invoke("logout"),context:()=>invoke("context"),saveDraft:(value:unknown)=>invoke("save-draft",value),deleteDraft:(value:unknown)=>invoke("delete-draft",value),postBill:(value:unknown)=>invoke("post-bill",value),captureRequest:(value:unknown)=>invoke("capture-request",value),sync:()=>invoke("sync"),refreshUser:(value:unknown)=>invoke("refresh-user",value),collectDue:(value:unknown)=>invoke("collect-due",value),report:(value:unknown)=>invoke("report",value),receipt:(value:unknown)=>invoke("receipt",value),backup:()=>invoke("backup"),restoreBackup:()=>invoke("restore-backup")
});
