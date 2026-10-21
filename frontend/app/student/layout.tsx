"use client";

import React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout allowedRoles={["student"]}>{children}</PortalLayout>;
}
