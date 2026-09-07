import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MATRIX — Project Controlling",
  description: "Project Controlling System for Die/Tooling Manufacturing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          id="anti-extension-hydration"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                function isExtensionHydrationError(args) {
                  for (var i = 0; i < args.length; i++) {
                    var a = args[i];
                    var str = '';
                    try {
                      if (typeof a === 'string') {
                        str = a;
                      } else if (a && typeof a === 'object') {
                        str = (a.message || '') + ' ' + (a.stack || '') + ' ' + (a.name || '') + ' ' + (a.componentStack || '');
                        if (!str.trim()) {
                          try { str = JSON.stringify(a); } catch (e) {}
                        }
                      }
                    } catch (e) {}
                    if (
                      str.indexOf('bis_skin_checked') !== -1 ||
                      str.indexOf('bis_register') !== -1 ||
                      str.indexOf('bis_frame_id') !== -1 ||
                      str.indexOf('browser extension installed') !== -1
                    ) {
                      return true;
                    }
                  }
                  return false;
                }

                // 1. Intercept window error events with capture to prevent Next.js overlay
                window.addEventListener('error', function(e) {
                  var str = (e && e.message ? e.message : '') + ' ' + (e && e.error && e.error.message ? e.error.message : '');
                  if (
                    str.indexOf('bis_skin_checked') !== -1 ||
                    str.indexOf('bis_register') !== -1 ||
                    str.indexOf('bis_frame_id') !== -1 ||
                    str.indexOf('browser extension installed') !== -1
                  ) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);

                // 2. Intercept console.error and console.warn
                if (console && console.error) {
                  var origError = console.error;
                  console.error = function() {
                    if (isExtensionHydrationError(arguments)) return;
                    origError.apply(console, arguments);
                  };
                }

                if (console && console.warn) {
                  var origWarn = console.warn;
                  console.warn = function() {
                    if (isExtensionHydrationError(arguments)) return;
                    origWarn.apply(console, arguments);
                  };
                }

                // 3. Actively strip extension attributes from DOM nodes
                var cleanNode = function(el) {
                  if (!el || el.nodeType !== 1) return;
                  if (el.hasAttribute('bis_skin_checked')) el.removeAttribute('bis_skin_checked');
                  if (el.hasAttribute('bis_register')) el.removeAttribute('bis_register');
                  if (el.hasAttribute('bis_frame_id')) el.removeAttribute('bis_frame_id');
                  if (el.querySelectorAll) {
                    var children = el.querySelectorAll('[bis_skin_checked], [bis_register], [bis_frame_id]');
                    for (var i = 0; i < children.length; i++) {
                      children[i].removeAttribute('bis_skin_checked');
                      children[i].removeAttribute('bis_register');
                      children[i].removeAttribute('bis_frame_id');
                    }
                  }
                };

                try {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        if (
                          m.attributeName === 'bis_skin_checked' ||
                          m.attributeName === 'bis_register' ||
                          m.attributeName === 'bis_frame_id'
                        ) {
                          cleanNode(m.target);
                        }
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          cleanNode(m.addedNodes[j]);
                        }
                      }
                    }
                  });

                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked', 'bis_register', 'bis_frame_id']
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
