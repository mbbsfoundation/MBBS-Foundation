import "./globals.css";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "MBBS Foundation: First Year Guide for Medical Students in India",
  description:
    "MBBS Foundation is a practical guide for first-year MBBS students covering transition, CPR, first aid, ethics, communication, and real-world medical learning.",
  keywords: [
    "MBBS Foundation",
    "MBBS first year guide",
    "MBBS book India",
    "book for MBBS students",
    "CPR training India",
    "First aid for medical students",
    "AETCOM",
    "medical student guide India",
  ],
  authors: [{ name: "Dr Lokesh Tiwari" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "MBBS Foundation: Your First Book of Medicine",
    description:
      "A complete guide for MBBS students covering CPR, first aid, ethics, communication, and the hidden curriculum of becoming a doctor.",
    url: "https://mbbsfoundation.com",
    siteName: "MBBS Foundation",
    images: [
      {
        url: "https://mbbsfoundation.com/book.png",
        width: 886,
        height: 1256,
        alt: "MBBS Foundation Book Cover",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MBBS Foundation: First Year Guide for Medical Students in India",
    description:
      "A practical guide for first-year MBBS students covering transition, CPR, first aid, ethics, communication, and real-world medical learning.",
    images: ["https://mbbsfoundation.com/book.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">
        <SiteHeader />

        {children}

        <footer className="border-t bg-slate-50">
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

            <p className="mt-8 text-xs text-slate-500">
              © 2026 MBBS Foundation. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}