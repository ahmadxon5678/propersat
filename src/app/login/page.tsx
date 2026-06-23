import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { currentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) {
    if (user.role === "admin") redirect("/admin");
    redirect(user.role === "teacher" ? "/teacher" : "/student");
  }

  return <LoginForm />;
}
