import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatContextProvider from "./useContext/chatContex";
import { MessageProvider } from "./useContext/message-context";
import { Providers } from "./Providers";
import CoinContextProvider from "./useContext/coinContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <MessageProvider>
            <ChatContextProvider>
              <CoinContextProvider>{children}</CoinContextProvider>
            </ChatContextProvider>
          </MessageProvider>
        </Providers>
      </body>
    </html>
  );
}
