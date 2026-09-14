import "./globals.css";
export const metadata = { title: "Broker Bot", description: "Adaptive Trading Bot" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "monospace", background: "#0a0a0a", color: "#e5e5e5" }}>{children}</body>
    </html>
  );
}   