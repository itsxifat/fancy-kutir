import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] })

export const metadata = {
  title: "Fancy Kutir - Handcrafted Women’s Fashion",
  description: "Discover Fancy Kutir – a women’s fashion brand crafting timeless, handcrafted wear for the modern woman. Elevate your style with artisanal elegance and slow fashion made with love. ",
  keywords: "Fancy Kutir, Fancy, Kutir, 3 pice, three pice, 3 pis, thre pis, meyeder jama, orna, jama, kapor, handmade 3 pis, design three pice, women’s fashion, handcrafted wear",
  author: {
    name: "Sifat Hosen",
    url: "https://facebook.com/itsxifat0",
  },
};

export default function RootLayout({ children }) {
  return (
  <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
  </ClerkProvider>
  );
}
