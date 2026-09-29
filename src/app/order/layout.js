// Ödeme dönüş sayfaları kişiye özeldir, arama motorlarında görünmesin
export const metadata = {
  title: "Sipariş durumu",
  robots: { index: false, follow: false },
};

export default function OrderLayout({ children }) {
  return children;
}
