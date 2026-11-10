# Sudoris tasarım notları ve sonraki işler

Bu belge, henüz uygulanmamış oyun tasarımı kararlarını ve daha sonra birlikte değerlendirmek üzere açık tutulan önerileri kaydeder. Buradaki maddeler mevcut davranışın açıklaması değil, gelecek çalışma notlarıdır.

## Sayı kuralları ve Sudoku bölgeleri

### Mevcut karar

Ana oyun tahtası, her satırda ve sütunda sayıların tekrar etmediği bir **Latin kare** olarak üretilir. Klasik Sudoku'daki 3×3 bölge kuralı uygulanmaz. Bu tercih, tahtaların 4×4'ten 9×9'a kadar farklı boyutlarda ilerlemesini ve Tetris benzeri parçaların farklı biçimlerde üretilmesini kolaylaştırır.

Bu karar, klasik Sudoku'yu eksik uygulamaktan ziyade Sudoris'in blok yerleştirme tarafını koruyan bilinçli bir oyun tasarımı tercihidir. Ana oyun bu kural setiyle devam edebilir; oyuncuya satır ve sütun kuralının açıkça anlatılması gerekir.

### İleride değerlendirilecek seçenek

Klasik Sudoku'ya daha yakın bir deneyim istenirse, ana oyun kuralını değiştirmek yerine ayrı bir meydan okuma türü düşünülebilir:

- 4×4 tahtada 2×2 bölgeler.
- 6×6 tahtada 2×3 bölgeler.
- 8×8 tahtada 2×4 bölgeler.
- 9×9 tahtada klasik 3×3 bölgeler.

Parçaların bölge sınırlarını geçmesi tek başına sorun değildir; parçalar hücre koordinatlarına yerleşebilir. Zor kısım, bölge kuralının oyuncuya tutarlı ve adil ipuçları sağlamasıdır. 5×5 ve 7×7 gibi asal boyutlarda doğal dikdörtgen bölge bölünmesi olmadığından, bu boyutlar bölgesiz kalmalı veya düzensiz bölgeler gibi standart dışı bir varyant kullanılmalıdır.

### Açık tasarım soruları

- Oyuncuya ana oyun kurallarını kısa bir öğreticiyle nasıl anlatacağız? Önerilen açıklama: Her satırda ve sütunda her sayı en fazla bir kez bulunur.
- Ek bir Sudoku meydan okuması istenecek mi? İstenirse ayrı mod mu, belirli bölümlerde kural değişimi mi olacak?
- `tryPlacePiece()` şu anda parçanın gizli `solutionGrid` ile tam eşleşmesini şart koşuyor. Görünür satır/sütun kurallarına uyan alternatif bir düzen de reddedilebilir. Gelecekte kural doğrulaması ile gizli çözüm eşleşmesinin oyuncuya nasıl açıklanacağını veya kabul mantığının değiştirilip değiştirilmeyeceğini değerlendirin.
- Bölge kuralı eklenirse, ipuçlarının tek bir çözüm üretmesi ve rastgele parça bölümlemesinin çözülebilir kalması ayrıca doğrulanmalı.

## Sonraki değerlendirme listesi

- [ ] Ana oyunda satır/sütun kuralını Türkçe ve İngilizce öğretici metinleriyle görünür hale getir.
- [ ] Klasik Sudoku bölgeli ayrı bir meydan okuma türünün oynanış ve seviye üretim tasarımını değerlendir.
- [ ] 60 seviyeye çıkış için yeni mekanikler, çeşitlilik ve oyuncu bağlılığı seçeneklerini analiz et.
- [ ] Oyuncunun yalnızca gizli hedef düzenini mi, yoksa görünür kuralları sağlayan geçerli düzenleri mi yerleştirebilmesi gerektiğine karar ver.
- [ ] Yeni kullanıcı akışlarında tüm düğme, onay, uyarı ve erişilebilirlik metinlerinin desteklenen tüm dillere eklenmesini koru.
