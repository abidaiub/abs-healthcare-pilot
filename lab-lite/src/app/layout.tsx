import "./globals.css";
export const metadata = { title: "ABS Lab Lite", description: "Independent laboratory foundation pilot" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
