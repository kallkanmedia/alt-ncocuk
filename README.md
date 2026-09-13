# Altın Çocuk — Frontend Önizleme Paketi

Bu paket, Altın Çocuk için hazırlanmış özel HTML/CSS/JavaScript arayüzünün müşteri sunumuna uygun sürümüdür.

## Başlangıç
`index.html` dosyasını açarak ana sayfadan başlayabilirsiniz.

## Sayfalar
- `index.html` — ana sayfa
- `products.html` — ürün kataloğu
- `product-1.html` … `product-5.html` — ürün detayları
- `category.html` — kategori / filtreleme görünümü
- `cart.html` — çalışan sepet görünümü
- `checkout.html` — teslimat ve ödeme önizleme akışı
- `guide.html` ve `article.html` — Altın Rehberi
- `information.html` — marka ve müşteri bilgilendirme alanları

## Mobil uyumluluk
Mobil navigasyon, ortalanmış marka alanı, ikonlu sepet, mobil kategori ağacı, sürekli görünür ürün ekleme butonları ve ürün detaylarındaki sabit satın alma çubuğu küçük ekranlar için optimize edilmiştir.

## Etkileşimler
Sepete ekleme, adet güncelleme, ürün kaldırma, favori, ürün galerisi, kişiselleştirme önizlemesi, arama, filtreleme, sıralama, newsletter doğrulaması ve checkout form doğrulaması `script.js` üzerinden çalışır. Sepet verisi tarayıcının localStorage alanında korunur.

## Canlı Entegrasyon Notu
Bu frontend paketinde gerçek para tahsilatı yapılmaz. Canlı mağazada iyzico kimlik bilgileri ve sunucu tarafı ödeme entegrasyonu ayrıca bağlanmalıdır. Ürün verileri gerçek katalog sistemiyle değiştirilebilir.
