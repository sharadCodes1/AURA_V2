import { redirect } from "next/navigation";

// The app is client-auth'd; send first-time visitors to login.
// (The login page redirects to /dashboard once a session exists.)
export default function Home() {
  redirect("/login");
}
