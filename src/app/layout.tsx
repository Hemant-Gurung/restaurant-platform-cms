import React from "react";

// Payload's RootLayout (in the (payload) group) renders its own <html> and <body>.
// This root layout must exist for Next.js but should not add its own shell.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
