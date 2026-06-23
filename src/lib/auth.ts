import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export async function currentUser() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("sat_user_id")?.value);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser(role?: "admin" | "teacher" | "student") {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) {
    if (user.role === "admin") redirect("/admin");
    redirect(user.role === "teacher" ? "/teacher" : "/student");
  }
  return user;
}

export async function setLoginCookie(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set("sat_user_id", String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearLoginCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("sat_user_id");
}
