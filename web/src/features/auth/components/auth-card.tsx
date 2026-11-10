import Link from "next/link";
import type { ReactNode } from "react";

import { appName } from "@/lib/app-config";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export function AuthCard({
  children,
  description,
  homeHref,
  title,
}: {
  children: ReactNode;
  description: string;
  homeHref: string;
  title: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <Link className="sr-only" href={homeHref}>
        {appName}
      </Link>
    </main>
  );
}
