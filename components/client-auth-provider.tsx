"use client";

import { useSession } from "next-auth/react";
import { UserAuth } from "@/components/user-auth";

export function ClientAuthProvider() {
  const { data: session } = useSession();
  return <UserAuth user={session?.user} />;
} 