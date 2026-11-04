import type { Metadata } from "next";
import { t } from "@/messages";
import { ListsView } from "./lists-view";

export const metadata: Metadata = { title: t.lists.title };

export default function Page() {
  return <ListsView />;
}
