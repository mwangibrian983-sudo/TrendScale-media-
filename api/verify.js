const PRODUCTS = {
  a1: { price: 2500, url: 'PASTE_PRIVATE_DOWNLOAD_LINK_FOR_PAYSTACK_SCRIPT' },
  a2: { price: 1200, url: 'PASTE_NOTION_TEMPLATE_DUPLICATE_LINK' },
  a3: { price: 1500, url: 'PASTE_PRIVATE_DOWNLOAD_LINK_FOR_YOUTUBE_PACK' },
  report: { price: 4500, url: 'PASTE_PRIVATE_LINK_TO_PDF_MANUAL' },
  r1: { price: 500, text: 'PASTE FULL ARTICLE 1 TEXT HERE' },
  r2: { price: 500, text: 'PASTE FULL ARTICLE 2 TEXT HERE' },
  r3: { price: 500, text: 'PASTE FULL ARTICLE 3 TEXT HERE' }
};
const KES_PER_USD = 130;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'Server not configured' });
  try {
    const { reference, id } = req.body || {};
    const product = PRODUCTS[id];
    if (!reference || !product) return res.status(400).json({ error: 'Bad request' });
    const r = await fetch(
      'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
      { headers: { Authorization: 'Bearer ' + secret } }
    );
    const d = await r.json();
    const t = d && d.data;
    if (!d.status || !t || t.status !== 'success')
      return res.status(402).json({ error: 'Payment not confirmed' });
    const expected = t.currency === 'USD'
      ? Math.max(1, Math.round(product.price / KES_PER_USD))
      : product.price;
    if (!['KES', 'USD'].includes(t.currency) || t.amount < expected * 100)
      return res.status(402).json({ error: 'Amount mismatch' });
    if (!t.metadata || t.metadata.id !== id)
      return res.status(402).json({ error: 'Product mismatch' });
    return res.status(200).json({ ok: true, url: product.url || null, text: product.text || null });
  } catch (e) {
    return res.status(500).json({ error: 'Verification failed' });
  }
};
