import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/messages";
import { PublicProfile } from "./public-profile";

export const metadata: Metadata = { title: t.profile.title };

export default function Page() {
  // O usuário vem da URL (useParams), que é dado de runtime: precisa de Suspense.
  return (
    <Suspense>
      <PublicProfile />
    </Suspense>
  );
}
