import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "@fontsource/inter"; // 400, 500, 700... managed by CSS usually or import specific weights
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/dm-serif-display"; // For headers, "Grand-mother" feel maybe?

// const inter = Inter({ subsets: ["latin"] }); // Next.js standard way

export const metadata: Metadata = {
  title: "Sena Cucina - Groupes & Retraites",
  description: "Gestion de recettes et menus pour la restauration de groupe.",
};

import { Toaster } from "@/components/ui/sonner";
import { AssistantProvider } from "@/components/assistant-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="font-sans text-slate-900 antialiased bg-slate-50 dark:bg-slate-950 dark:text-slate-50 min-h-screen flex flex-col transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AssistantProvider>
            <Navbar />
            <main className="flex-1 container mx-auto px-4 md:px-8">
              {children}
            </main>
            <Toaster />
          </AssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
