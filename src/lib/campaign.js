// Kampanya hesabı. Hem sunucu (sepet doğrulama, ödeme) hem arayüz (sepet,
// ürün kartı) aynı fonksiyonu kullanır; böylece müşterinin sepette gördüğü
// tutar ile kartından çekilen tutar her zaman aynıdır.
//
// Kural: "Üst Giyim" kategorisinde 2. ürüne %20 indirim, indirim EN UCUZ ürünlere.
// Sepetteki üst giyim adedinin yarısı kadar ürün (aşağı yuvarlanır) indirimli
// olur ve bunlar her zaman en ucuz olanlardır (farklı ürün/beden fark etmez).
//   Örn. 890 ₺ + 540 ₺            → 540 ₺ indirimli
//   Örn. 890 ₺ + 540 ₺ + 260 ₺    → 260 ₺ indirimli (1 indirim, en ucuza)
//   Örn. 890 + 650 + 540 + 260 ₺  → 540 ₺ ve 260 ₺ indirimli

export const CAMPAIGN = {
  id: "ust-giyim-2-urune-20",
  active: true,
  category: "Üst Giyim",
  percent: 20,
  label: "Üst giyimde 2. ürüne %20 indirim",
  shortLabel: "2. üründe %20",
};

export function isCampaignProduct(p) {
  return CAMPAIGN.active && p?.cat === CAMPAIGN.category;
}

// Birim başına indirim (tam TL, yuvarlanmış)
export function unitDiscountFor(price) {
  return Math.round((price * CAMPAIGN.percent) / 100);
}

// lines: [{ key, price, qty, category }]
// Dönüş: Map<key, discountQty> — her satırda kaç adedin indirimli olduğu
export function discountedQuantities(lines) {
  const result = new Map(lines.map((l) => [l.key, 0]));
  if (!CAMPAIGN.active) return result;

  const units = [];
  for (const l of lines) {
    if (l.category !== CAMPAIGN.category) continue;
    for (let i = 0; i < l.qty; i++) units.push({ key: l.key, price: l.price });
  }
  // Ucuzdan pahalıya; eşit fiyatta anahtara göre (sunucu ve istemci aynı sonucu versin)
  units.sort((a, b) => a.price - b.price || String(a.key).localeCompare(String(b.key)));

  const discountCount = Math.floor(units.length / 2);
  for (let i = 0; i < discountCount; i++) {
    result.set(units[i].key, result.get(units[i].key) + 1);
  }
  return result;
}

// Sepetin tamamını fiyatlar.
// lines: [{ key, price, qty, category }]
// Dönüş: { lines: [...lines + { discountQty, unitDiscount, lineTotal }], subtotal, discount, total }
export function priceCart(lines) {
  const dq = discountedQuantities(lines);
  let subtotal = 0;
  let discount = 0;

  const priced = lines.map((l) => {
    const discountQty = dq.get(l.key) || 0;
    const unitDiscount = discountQty > 0 ? unitDiscountFor(l.price) : 0;
    const gross = l.price * l.qty;
    const lineDiscount = unitDiscount * discountQty;
    subtotal += gross;
    discount += lineDiscount;
    return { ...l, discountQty, unitDiscount, lineTotal: gross - lineDiscount };
  });

  return { lines: priced, subtotal, discount, total: subtotal - discount };
}

// Kısmi iadede para iadesi: satırda ödenen tutar, adetlere orantılı dağıtılır.
// Aynı satırdan parça parça iade yapılsa bile toplam, satırda ödenen tutarı
// asla aşmaz (farklar yuvarlamadan birikmez).
//   line: { lineTotal, qty }   alreadyReturned: önceki aktif iadelerdeki adet   k: şimdi iade edilen adet
export function refundForUnits(line, alreadyReturned, k) {
  const upTo = (n) => Math.round((line.lineTotal * n) / line.qty);
  return upTo(alreadyReturned + k) - upTo(alreadyReturned);
}