import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/messages";
import { FollowListView } from "../follow-list-view";

export const metadata: Metadata = { title: t.follow.following };

export default function Page() {
  // o @ vem da URL (useParams), que é dado de runtime: precisa de Suspense.
  return (
    <Suspense>
      <FollowListView kind="following" />
    </Suspense>
  );
}
