import { Suspense } from "react";
import { ListView } from "./list-view";

export default function Page() {
  return (
    <Suspense>
      <ListView />
    </Suspense>
  );
}
