import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import FacebookPixelTracker from "@/components/FacebookPixelTracker";
import { SearchProvider } from "@/context/SearchContext";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  metadataBase: new URL("https://fancykutir.com"),
  title: "Fancy Kutir - Handcrafted Women’s Fashion Bangladesh",
  description:
    "Discover Fancy Kutir – a women’s slow-fashion brand crafting premium handcrafted 3 piece, kurti & women's wear. Made by rural women in Bangladesh.",
  keywords:
    "Fancy Kutir, handcrafted women's fashion, handmade three piece, Bangladeshi fashion brand, slow fashion Bangladesh, kurti BD, women's wear Bangladesh",
  author: {
    name: "Sifat Hosen",
    url: "https://facebook.com/itsxifat0",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://fancykutir.shop",
  },
  openGraph: {
    type: "website",
    siteName: "Fancy Kutir",
    url: "https://fancykutir.shop",
    title: "Fancy Kutir - Handcrafted Women’s Fashion",
    description:
      "Premium handcrafted women's wear – designed and made by rural women in Bangladesh. Elevate your style with slow fashion.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fancy Kutir - Handcrafted Women’s Fashion",
    description:
      "Premium handcrafted women's wear brand from Bangladesh. Slow fashion. Made by rural women.",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en-BD">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {/* font performance */}
          <link
            rel="preload"
            as="font"
            href="/fonts/outfit.woff2"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          {/* Facebook Pixel */}
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
        </head>

        <body className={`${outfit.className} antialiased text-gray-700`} suppressHydrationWarning>
          <Toaster />
          <AppContextProvider>
            <SearchProvider>
              <FacebookPixelTracker />
              {children}
            </SearchProvider>
          </AppContextProvider>

          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </body>
      </html>
    </ClerkProvider>
  );
}
