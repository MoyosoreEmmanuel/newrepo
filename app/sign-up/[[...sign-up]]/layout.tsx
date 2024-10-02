import Footer from "@/app/components/Footer";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = auth();
  const isAuth = !!userId;
  const user = await currentUser();
  if (isAuth) {
    redirect("/dashboard");
  }
  return <>{children}</>;
};

export default layout;
