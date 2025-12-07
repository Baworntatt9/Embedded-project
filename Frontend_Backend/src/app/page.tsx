import { redirect } from "next/navigation";

export default function Home() {
  // return to dashboard page
  redirect("/dashboard");
}
