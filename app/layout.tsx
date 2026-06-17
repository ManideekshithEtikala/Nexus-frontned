import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "../components/Authwrapper";

export const metadata: Metadata = {
  title: "Nexus-AI Polymorphic UI Agent Control Console",
  description: "Enterprise Headless Control Workspace Agent Matrix UI Layout Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="h-full min-h-full flex flex-col bg-zinc-50 dark:bg-[#0c0c0e]">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}