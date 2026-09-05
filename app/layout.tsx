import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import SecurityGuard from "../components/SecurityGuard";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL("https://mbbsfoundation.com"),
  title: {
    default: "MBBS Foundation | First Year Guide for Medical Students & NEET UG 2026",
    template: "%s | MBBS Foundation",
  },
  description:
    "Authoritative guide for NEET UG qualified students, parents, and first-year MBBS doctors in India. Master NEET counselling, medical college selection, admission documents, CPR training, medical ethics (AETCOM), and medical school transition.",
  keywords: [
    "MBBS Foundation",
    "Dr Lokesh Tiwari MBBS book",
    "NEET to MBBS 2026",
    "NEET UG counselling 2026",
    "MCC AIQ counselling choice filling",
    "How to choose medical college after NEET",
    "Medical college comparison tool",
    "MBBS first year guide India",
    "Books for first year MBBS students",
    "First day in medical college orientation",
    "Documents required for NEET admission",
    "Rural service bond in medical colleges",
    "Medical ethics AETCOM NMC curriculum",
    "CPR training India IAP CPR Sanjeevani",
    "First aid training for medical students",
    "Ayurvigyan Foundation",
  ],
  authors: [{ name: "Dr Lokesh Tiwari", url: "https://mbbsfoundation.com/about" }],
  creator: "Dr Lokesh Tiwari",
  publisher: "Ayurvigyan Foundation",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://mbbsfoundation.com",
  },
  openGraph: {
    title: "MBBS Foundation: Essential Guide for Medical Students & NEET UG 2026",
    description:
      "A complete guide for NEET-selected candidates and MBBS students covering counselling, college selection, CPR, first aid, medical ethics, and medical school survival.",
    url: "https://mbbsfoundation.com",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/book.png",
        width: 886,
        height: 1256,
        alt: "MBBS Foundation: Your First Book of Medicine by Dr. Lokesh Tiwari",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MBBS Foundation: First Year Guide for Medical Students & NEET 2026",
    description:
      "A practical guide for first-year MBBS students and NEET aspirants covering counselling, college choices, CPR, first aid, ethics, and clinical learning.",
    images: ["https://mbbsfoundation.com/book.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const SITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://mbbsfoundation.com/#website",
      url: "https://mbbsfoundation.com",
      name: "MBBS Foundation",
      description:
        "Comprehensive educational resource and medical guide for NEET UG qualified students, parents, and first-year MBBS students in India.",
      publisher: {
        "@type": "Organization",
        "@id": "https://mbbsfoundation.com/#organization",
        name: "Ayurvigyan Foundation",
        url: "https://mbbsfoundation.com",
        logo: "https://mbbsfoundation.com/favicon.png",
      },
      inLanguage: "en-IN",
    },
    {
      "@type": "Organization",
      "@id": "https://mbbsfoundation.com/#organization",
      name: "Ayurvigyan Foundation",
      url: "https://mbbsfoundation.com",
      logo: "https://mbbsfoundation.com/favicon.png",
      founder: {
        "@type": "Person",
        name: "Dr. Lokesh Tiwari",
        jobTitle: "Professor & Head of Pediatrics",
        url: "https://mbbsfoundation.com/about",
      },
      sameAs: [
        "https://www.facebook.com/share/g/1DF14f2Npr/",
        "https://notionpress.com/in/read/mbbs-foundation",
      ],
    },
    {
      "@type": "Book",
      "@id": "https://mbbsfoundation.com/#book",
      name: "MBBS Foundation: Your First Book of Medicine",
      author: {
        "@type": "Person",
        name: "Dr. Lokesh Tiwari",
      },
      isbn: "9798903921355",
      publisher: "Notion Press",
      inLanguage: "English",
      description:
        "A complete guide for first-year MBBS students covering the hidden curriculum, CPR, first aid, medical ethics (AETCOM), communication, and clinical transition.",
      url: "https://mbbsfoundation.com/book",
      image: "https://mbbsfoundation.com/book.png",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SITE_STRUCTURED_DATA),
          }}
        />
      </head>
      <body className="bg-white text-slate-900">
        <SecurityGuard />
        <SiteHeader />

        {children}
        <Analytics />
        <SpeedInsights sampleRate={0.25} />

        <footer className="border-t bg-slate-50 print:hidden">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-lg font-semibold">MBBS Foundation</p>
                <p className="mt-2 text-sm text-slate-600">
                  More than a book. A companion in medicine.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Explore
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><a href="/about">About</a></p>
                  <p><a href="/book">Book</a></p>
                  <p><a href="/resources">Resources</a></p>
                  <p><a href="/contact">Contact</a></p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Connect
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>
                    <a href="mailto:admin@mbbsfoundation.com">
                      admin@mbbsfoundation.com
                    </a>
                  </p>
                  <p>
                    <a
                      href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy on Amazon
                    </a>
                  </p>
                  <p>
                    <a
                      href="https://www.flipkart.com/mbbs-foundation/p/itm36fc9614bbf64?pid=9798903921355&affid=editornoti&affid=editornoti"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy on Flipkart
                    </a>
                  </p>
                  <p>
                    <a
                      href="https://notionpress.com/author/1356076"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy on Notion Press
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="space-y-1">
                <p>© 2026 MBBS Foundation™. All rights reserved.</p>
                <p className="text-[11px] text-slate-400">MBBS Foundation™ is a trademark-applied brand.</p>
              </div>
              <div>
                <a
                  href="/admin"
                  className="text-[11px] text-slate-400 hover:text-slate-600 transition"
                  title="Master Admin Portal"
                >
                  Admin Portal
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}