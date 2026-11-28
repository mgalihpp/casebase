import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SplashScreen } from "@/features/auth/components/splash-screen";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/belajar");
  return <SplashScreen />;
}
