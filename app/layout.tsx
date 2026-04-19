import "./globals.css";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "MBBS Foundation: Your First Book of Medicine",
  description:
    "A complete guide for MBBS students covering transition into medicine, CPR, first aid, ethics, communication, and hidden curriculum.",
  keywords: [
    "MBBS Foundation",
    "MBBS book India",
    "CPR training India",
    "First aid book",
    "Medical student guide",
    "AETCOM",
    "BLS CPR India",
  ],
  authors: [{ name: "Dr Lokesh Tiwari" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "MBBS Foundation",
    description:
      "Build the doctor within – CPR, first aid, ethics, and real-life medicine.",
    url: "https://mbbsfoundation.com",
    siteName: "MBBS Foundation",
    images: [
      {
        url: "/book.png",
        width: 800,
        height: 1200,
      },
    ],
    type: "website",
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