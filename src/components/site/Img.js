import Image from "next/image";

// next/image: /public altındaki görselleri WebP/AVIF'e çevirip ekran boyuna göre küçültür.
// Admin panelinden harici bir adres (https://...) girilmişse optimizasyon atlanır,
// çünkü next.config'de izin verilmemiş alan adları hata verir.
export default function Img({ src, ...props }) {
  return <Image src={src} unoptimized={!src.startsWith("/")} {...props} />;
}
