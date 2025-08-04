import { auth } from "@/auth";
import { UserAuth } from "@/components/user-auth";

export async function AuthProvider() {
  const session = await auth();
  return <UserAuth user={session?.user} />;
} 