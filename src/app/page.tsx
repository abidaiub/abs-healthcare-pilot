import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPostLoginPath } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect(getPostLoginPath(session));
  }

  redirect("/login");
}
