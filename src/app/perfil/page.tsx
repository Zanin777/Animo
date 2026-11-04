import type { Metadata } from "next";
import { t } from "@/messages";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: t.profile.title };

export default function Page() {
  return <ProfileView />;
}
