/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Vercel fotoğrafları otomatik küçültüp modern formatlarda sunar
    formats: ["image/avif", "image/webp"],
  },
};
export default nextConfig;
