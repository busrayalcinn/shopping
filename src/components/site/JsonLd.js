// Google zengin sonuçları için yapısal veri (schema.org, JSON-LD)
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // "<" kaçırılır: ürün adı gibi alanlar script etiketini kapatamasın
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
