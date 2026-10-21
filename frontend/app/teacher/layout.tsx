"use client";

import React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout allowedRoles={["teacher"]}>{children}</PortalLayout>;
}
