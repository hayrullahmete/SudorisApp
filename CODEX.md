# Codex çalışma rehberi

Bu depoda işe başlamadan önce `ARCHITECTURE.md` dosyasını oku; kaynakları ve değişikliklerin Android'e nasıl taşındığını açıklar. Ardından yalnızca görevle ilgili dosyaları incele.

Oyun kuralları, Sudoku bölgeleri veya gelecek seviye içeriğiyle ilgili tasarım kararı vermeden önce `DESIGN_NOTES.md` dosyasındaki açık kararları ve yapılacakları kontrol et. Bu notlar üzerinde çalışırken kullanıcıyla birlikte değerlendirilmek üzere kaydedilmiştir; onaylanmış ürün davranışı gibi uygulama.

## Temel kurallar

- Oyun arayüzü, oyun mantığı ve stilin ana kaynakları sırasıyla `www/index.html`, `www/script.js` ve `www/style.css` dosyalarıdır.
- Kullanıcıya görünen tüm metinleri, düğmeleri, onay/uyarı pencerelerini ve erişilebilir adları `www/i18n.js` içindeki mevcut bütün dillere ekle. HTML'de `data-i18n`, erişilebilir adlarda `data-i18n-aria-label` kullan; oyun mantığından üretilen metinlerde `t(key, values)` çağır. Yeni bir kullanıcı metnini tek dile sabitleme; yeni bir akış eklenirken TR ve EN karşılıklarını birlikte tamamla.
- Seviye sayısını ve zorluk akışını `www/script.js` içindeki `chapterPlans` üzerinden düzenle; `levelConfig` bu planlardan üretilir. Harita bölümleri için yeni başlık veya açıklama eklenirse iki dilde de `www/i18n.js` çevirilerini ekle.
- Seviye tamamlanınca normal akış sonraki seviyeye otomatik ilerler; bölüm sınırları ve son seviye özel pencereler kullanır. Bu akışı değiştirirken tamamlanan seviye kaydını, chapter reset davranışını ve TR/EN mesajlarını birlikte koru.
- Level Map yeniden çizildiğinde veya açıldığında kaydırma odağını sıradaki tamamlanmamış seviyenin chapter grubunda tut; tüm seviyeler bitmişse son chapter'a odaklan.
- Ana ekran illüstrasyonu `www/sudoris-hero.svg` dosyasıdır. Arayüzün renkleri ve bileşen görünümü `www/style.css` içindeki değişken ve sınıflarla yönetilir; yeni görselleri mevcut koyu gece mavisi/nane paletiyle eşleştir.
- Uygulama ikonunun düzenlenebilir ana kaynağı `assets/sudoris-app-icon.svg` dosyasıdır. Bu dosyadan Android ve web ikonlarını üretmek için `npm run icons:android` komutu `tools/generate-app-icons.mjs` betiğini çalıştırır.
- Android uygulaması bu web oyununu Capacitor WebView içinde çalıştırır. Web dosyalarındaki değişikliği `android/app/src/main/assets/public/` altına elle kopyalama; Android'e aktarmak için proje kökünden `npx cap sync android` kullan.
- Android'e özel değişikliklerde `android/` altındaki gerçek kaynakları düzenle: manifest, `MainActivity`, Gradle yapılandırması veya `res/`. Generated olduğu belirtilen dosyaları ve derleme çıktısı/önbellek klasörlerini incelemeden düzenleme.
- Mevcut görsel dili ve etkileşim akışını koru; istenen kapsam dışındaki oyun kurallarını, seviye üretimini veya ilerleme davranışını değiştirme.
- Uygulama görünümünü etkileyen değişikliklerde dar ekranları ve dokunmatik kullanımı gözet. Tahta ölçüsü `www/script.js` içinde de hesaplanıyor; sadece CSS değişikliği yeterli olmayabilir.
- Türkçe kullanıcıyla Türkçe iletişim kur. Kod içindeki mevcut İngilizce adlandırmaları, istenmedikçe topluca yeniden adlandırma.
- Depoda proje testi tanımlı değildir (`npm test` yalnızca hata veren yer tutucu komuttur). Kullanıcı doğrulama istemedikçe test ekleme veya çalıştırma; yaptığın doğrulamayı açıkça bildir.

## Çalıştırma ve senkronizasyon

- Android Studio'da proje olarak `android/` klasörünü aç; kök dizini seçmek Android modülünü yüklemeyebilir.
- Telefon/emülatörü Android Studio cihaz listesinden seçip **Run** ile çalıştır.
- Web kaynaklarını Android paketine güncelledikten sonra proje kökünde `npx cap sync android` çalıştır. Bağımlılıklar eksikse `npm install` kullan.
- `package.json` içindeki `npm start` betiği bulunmayan `server.js` dosyasını çağırıyor; bu betiği web önizleme komutu olarak önermeyin.
- Android derleme hatalarında önce `android/gradle/wrapper/gradle-wrapper.properties`, `android/build.gradle` ve Android Studio'da seçili Gradle JDK'yı beraber kontrol et. Sürümleri gelişigüzel güncelleme.

## Kaynak doğruluğu

Dokümanlar yön bulma içindir; davranış değişmiş olabileceği için bir dosyada değişiklik yapmadan önce dosyanın güncel içeriğini kontrol et. Kaynak kod ile bu rehber çelişirse kaynak kodu esas al ve rehberi gerekiyorsa güncelle.
