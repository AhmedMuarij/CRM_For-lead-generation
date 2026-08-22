import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "EV CRM — Lead Manager",
  description: "Call-center CRM for EV automobile company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
