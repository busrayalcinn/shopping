import { SITE } from "@/lib/site";

// /robots.txt
export default function robots() {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  // Vercel önizleme (preview) adresleri Google'da ana siteyle yarışmasın
  if (!isProd) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/account", "/order/", "/reset-password"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
