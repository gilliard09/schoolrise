import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SchoolRise | Gestão Escolar",
  description: "Sistema de gestão para escolas e produtores digitais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Removemos a Sidebar e a div flex. 
            O conteúdo agora ocupa a tela inteira com um fundo suave. */}
        <div className="min-h-screen bg-slate-50">
          <main className="w-full">
            {children}
          </main>
        </div>
        
        {/* Configuração das Notificações (Toasts) */}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            style: { 
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontWeight: 'bold'
            },
          }}
        />
      </body>
    </html>
  );
}