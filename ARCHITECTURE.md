# Sudoris mimarisi

## Genel bakış

Sudoris, Sudoku benzeri satır ve sütun kısıtlarını Tetris benzeri sürükle-bırak parçalarla birleştiren, mobil öncelikli bir web oyunudur. Android uygulaması Capacitor 7'nin yerel kabuğu içinde aynı web oyununu bir WebView'da çalıştırır. Oyun kurallarını uygulayan JavaScript veya Android tarafında ayrı bir oyun implementasyonu yoktur.

```text
www/index.html + www/style.css + www/script.js
                    │
                    ├── Web'de doğrudan açılır
                    │
                    └── Capacitor sync → android/app/src/main/assets/public
                                                   │
                                      MainActivity → Capacitor WebView
```

## Kaynak ve sorumluluklar

| Yol | Sorumluluk |
| --- | --- |
| `www/index.html` | Karşılama, seviye haritası, ayarlar ve oyun ekranlarının DOM yapısı; çeviri işaretleri ve kaynak bağlantıları |
| `www/style.css` | Gece mavisi/nane renk sistemi, mobil ekran düzeni, seviye kartları, tahta, parçalar ve sürükleme görünümü |
| `www/i18n.js` | Türkçe/İngilizce sözlük, cihaz dilini ilk açılışta algılama, kalıcı dil tercihi ve DOM metinlerinin çevrilmesi |
| `www/script.js` | Seviye ayarları, oyun durumu, Latin kare üretimi, parça büyütme, çizim, dokunmatik sürükleme, yerleştirme doğrulama, ilerleme kaydı ve çevrilen dinamik metinler |
| `www/sudoris-hero.svg` | Sudoris için projeye özel, vektör ana ekran oyun illüstrasyonu |
| `assets/sudoris-app-icon.svg` | Android ve web uygulama ikonlarının vektör ana kaynağı |
| `tools/generate-app-icons.mjs` | Ana SVG'den Android launcher yoğunluklarını ve webp PWA ikonlarını üretir (`npm run icons:android`) |
| `capacitor.config.json` | Uygulama kimliği/adı (`com.artiumlab.sudoris`, `Sudoris`) ve web kaynak klasörü (`www`) |
| `android/` | Android Studio/Gradle projesi, Capacitor yapılandırması, yerel etkinlik ve Android kaynakları |
| `assets/`, `icons/`, `public/` | Logo, ikonlar ve web uygulaması manifesti gibi görsel/PWA kaynakları |
| `package.json` | Capacitor bağımlılıkları ve npm betikleri |

**Web uygulamasının kaynak dosyaları `www/` içindedir.** `android/app/src/main/assets/public/` Capacitor tarafından senkronizasyonda oluşturulan Android kopyasıdır; kalıcı değişiklikleri orada yapmayın. `android/` içindeki Gradle, manifest, tema, ikon ve Java dosyaları Android kabuğu veya derleme ayarları için değiştirilir.

## Oyun akışı ve durum

- `www/script.js` içindeki `chapterPlans`, 4 bölümdeki 40 seviyenin tahta boyutunu, sabit hücre sayısını ve parça boyutu sınırını tanımlar. `levelConfig` bu planlardan seviye kayıtlarını üretir.
- `goToGame()` mevcut/açılan seviyeyi seçer ve `startLevel()` ile yeni bir tahta kurar. `goToMap()` seviyeleri açık, mevcut veya kilitli olarak gösterir.
- `generateLatinSquare()` ve `fillBoard()` her satır ve sütunda sayıların tekrar etmediği rastgele bir çözüm üretir. Bu, klasik 9×9 Sudoku'nun 3×3 bölge kuralını uygulamaz.
- Çözüm hücre değerleri Fisher–Yates ile karıştırılmış aday sıraları kullanılarak backtracking yöntemiyle bulunur. Bu, geçerli bir Latin kare üretir; bütün Latin kareler arasında eşit olasılıklı seçim garantisi vermez.
- `createPiecesAndBoard()` rastgele ipuçlarını sabitler; boş hücreleri `growPiece()` ile birbirine bağlı, bölüme göre en fazla 2, 3 veya 4 hücreli parçalara böler.
- Oyuncu parçaları tepsiden dokunarak sürükleyip tahtaya bırakır. `tryPlacePiece()` sınırları, dolu hücreleri ve parçadaki değerlerin üretilmiş çözümle tam eşleşmesini denetler. Eşleşmeyen yerleştirme reddedilir.
- Sürükleme hedefi tahta hücrelerinin gerçek ekran koordinatlarından ve CSS grid boşluklarından hesaplanır. `calculateGridTarget()` içindeki padding/gap ve ölçek hesabı değiştirilirse tüm tahta boyutlarında tekrar doğrulanmalıdır.
- Yerleştirme denetiminin gizli `solutionGrid` ile tam eşleşme istemesi, görünür satır/sütun kurallarıyla geçerli olabilecek alternatif bir Latin kareyi reddedebilir. Kuralın oyuncuya açık olması veya doğrulama biçiminin ileride yeniden ele alınması gerekebilir.
- `checkWin()` tahta dolduğunda ilerlemeyi kaydeder ve normal seviyelerde doğrudan sıradaki seviyeyi açar. Bölüm sonlarında iki dilde tebrik penceresi gösterir; son seviyede tüm oyun tamamlandı penceresi açıp haritaya dönüş sağlar.
- Tamamlanan seviyeler `localStorage` içindeki `sudoris_completed_levels` anahtarında indeks listesi olarak tutulur. Eski sürümlerdeki `sudoris_progress` sayacı ilk açılışta tamamlanan ardışık seviyeler listesine dönüştürülür. Oyun durumu, üretilmiş tahta veya yarım kalan yerleştirmeler kaydedilmez.
- Seviye haritasındaki tüm-harita sıfırlaması tamamlanan seviye listesini temizler ve onay ister. Her bölüm başlığındaki bölüm sıfırlaması yalnızca o bölümün tamamlanmış seviyelerini siler; diğer bölümlerin kayıtlarını korur ve onay ister. İlerleme halkası toplam tamamlanan seviyeleri sayar. Açılma sırası için tamamlanmış kesintisiz ilk seviye dizisi kullanılır; sıfırlanmayan daha ileri tamamlanmış seviyeler tekrar oynanabilir kalır.
- Seviye haritasında sıradaki seviye `.current` ile mercan renkte, tamamlanan seviyeler `.completed` ile nane/yeşil renkte gösterilir.
- Seviye haritası açılırken ve içerik yeniden çizilirken kaydırma, sıradaki tamamlanmamış seviyenin bölüm grubuna odaklanır. Tüm seviyeler bitmişse son bölüm gösterilir.
- Dil tercihi `localStorage` içindeki `sudoris_language` anahtarında saklanır. İlk açılışta kayıt yoksa tarayıcı dili İngilizce ise EN, diğer durumlarda TR seçilir. Ana ekrandaki TR/EN düğmeleri veya Ayarlar ekranı tercihi anında değiştirir.

## Android ve web çalışma biçimi

- Android giriş etkinliği: `android/app/src/main/java/com/artiumlab/sudoris/MainActivity.java`; Capacitor `BridgeActivity`'sini genişletir.
- Android manifestindeki uygulama adı, paket kimliği ve başlatıcı etkinlik `android/app/src/main/AndroidManifest.xml` ile `android/app/src/main/res/values/strings.xml` dosyalarındadır.
- Proje kökündeki `android/` klasörü Android Studio'da açılır. Telefon veya emülatör seçildikten sonra Android Studio'nun **Run** düğmesi debug uygulamasını kurup başlatır.
- Web dosyaları değişince proje kökünden `npx cap sync android` çalıştırılmalı; bu işlem `www/` içeriğini Android varlıklarına kopyalar ve Capacitor yapılandırmasını eşitler. Ardından Android Studio'da yeniden **Run** kullanılabilir.
- Gradle wrapper sürümü `android/gradle/wrapper/gradle-wrapper.properties`, Android Gradle Plugin sürümü `android/build.gradle` içindedir. Gradle'ın JVM'si Android Studio'da **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** yolundan seçilir. Wrapper ile eklenti sürümlerini değiştirmeden önce birbiriyle uyumluluklarını doğrulayın.

## Teknik sınırlar ve dikkat noktaları

- Projede sunucu/API katmanı veya veritabanı yoktur; oyun istemci tarafında çalışır.
- Dokunmatik sürükleme `touchstart` / `touchmove` / `touchend` olaylarını kullanır; fare ve klavye ile sürüklemenin desteklendiğini varsaymayın.
- Tahta boyutları ve seviye ayarları `levelConfig` içinde tanımlıdır. Ekran geometrisi CSS'e ek olarak `renderBoard()` içindeki JavaScript ölçülerinden de etkilenir.
- `package.json` içindeki `start` betiği `node server.js` çağırır, ancak kökte `server.js` bulunmuyor. Bu betik şu anda kullanılabilir bir yerel geliştirme sunucusu sağlamaz.
- `public/manifest.webmanifest` ikonları `../icons/` yolundan gösterir; web/PWA dağıtımı değişirse bu yolların hedef bağlamdaki doğruluğunu kontrol edin.
- Sudoku bölgeleri, ayrı meydan okuma modu ve gelecek seviye çeşitliliği hakkında açık tasarım kararları ve öneriler `DESIGN_NOTES.md` içinde tutulur.
