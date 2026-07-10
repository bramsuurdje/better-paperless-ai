import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Paperless AI",
      },
      {
        name: "application-name",
        content: "Better Paperless AI",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Paperless AI",
      },
      {
        name: "theme-color",
        content: "#0c401a",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "icon",
        href: "/favicon-32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        rel: "icon",
        href: "/favicon-16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
