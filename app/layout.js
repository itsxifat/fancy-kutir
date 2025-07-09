import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import FacebookPixelTracker from "@/components/FacebookPixelTracker";
import { SearchProvider } from "@/context/SearchContext";  // <- import here

const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] });

export const metadata = {
  title: "Fancy Kutir - Handcrafted Women’s Fashion",
  description: "Discover Fancy Kutir – a women’s fashion brand crafting timeless, handcrafted wear for the modern woman. Elevate your style with artisanal elegance and slow fashion made with love.",
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
        <head>
          {/* Facebook Pixel script */}
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </head>

        <body className={`${outfit.className} antialiased text-gray-700`}>
          <Toaster />
          <AppContextProvider>
            <SearchProvider> {/* Wrap with SearchProvider */}
              <FacebookPixelTracker />
              {children}
            </SearchProvider>
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
