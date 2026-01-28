Proje Review Raporu
KRITIK Seviye

1. Kaynak Kodda Hardcoded Credentials
   Dosya: application-dev.properties

Veritabanı şifresi, Gmail app password ve JWT secret doğrudan kaynak kodda. Git geçmişinde de mevcut. Bu credentials'lar derhal iptal edilmeli, .gitignore'a eklenmeli ve environment variable'lara taşınmalı.

2. Token'ların localStorage'da Saklanması (XSS Riski)
   Dosya: authStore.ts

Access token ve refresh token Zustand persist ile localStorage'a yazılıyor. Herhangi bir XSS açığı tüm kullanıcı oturumlarını ele geçirebilir. httpOnly cookie tabanlı bir yaklaşıma geçilmeli.

3. IDOR (Insecure Direct Object Reference) Zafiyetleri
   Dosya: UserController.java

Controller seviyesinde authorization kontrolü yok. PUT /users/{id}/password, PUT /users/{id}/profile gibi endpoint'ler yalnızca service layer'a güveniyor. Service'te bug varsa, başka kullanıcıların verilerine erişim mümkün.

4. Race Condition - Position Hesaplama
   Dosyalar: TaskService.java, SubtaskService.java

findMaxPositionByTaskId() atomik değil. Eş zamanlı isteklerde aynı position değeri atanabilir. Database-level atomic operation kullanılmalı.

YÜKSEK Seviye

5. XSS Protection Header Devre Dışı
   Dosya: SecurityConfig.java:47

.xssProtection(xss -> xss.disable())
Browser XSS koruması kasıtlı olarak kapatılmış.

6. Zayıf Doğrulama Kodu (6 haneli)
   Dosyalar: EmailVerificationService.java:72, PasswordResetService.java:124

6 haneli numerik kod = 900.000 olasılık. 15 dakikalık pencerede brute-force saldırısına açık. Password reset ve email verification için rate limiting endpoint bazlı olsa da kod bazlı değil.

7. Logout'ta Backend Çağrısı Yok
   Dosya: authStore.ts:35-42

logout() sadece local state temizliyor. Backend'de refresh token invalidate edilmiyor. Çalınan token sunucu tarafında geçerli kalmaya devam eder.

8. N+1 Query Problemi
   Dosyalar: NotificationService.java:42-91, BoardMemberService.java:336-339

Notification servisi findAllById() ile tüm entity'leri yükleyip sadece id ve status kullanıyor. BoardMember'da assignments lazy loading döngüde tetikleniyor.

9. Error Handling'de Unsafe Type Casting (Frontend)
   Dosyalar: RegisterPage.tsx, SettingsPage.tsx, BoardDetailPage.tsx

const error = err as { response?: { data?: { message?: string } } };
instanceof AxiosError kontrolü yapılmadan casting. Network error veya timeout durumlarında undefined erişimi.

10. Batch İşlemlerde Boyut Limiti Yok
    Dosya: TaskController.java:168

batchReorder endpoint'i gelen dizinin boyutunu sınırlamıyor. Milyonlarca öğe göndererek DoS yapılabilir.

11. TaskController'da Base @RequestMapping Boş
    Dosya: TaskController.java

@RequestMapping path tanımlı değil. /lists, /tasks, /subtasks gibi generic path'ler diğer controller'larla çakışabilir.

12. Tutarsız Validation Limitleri
    CreateTaskRequest.description → max 100 karakter, ama Task entity → max 500 karakter. Kullanıcı 100-500 arası açıklama oluşturamıyor, ancak update ile 500'e kadar yazabilir.

ORTA Seviye

13. Eksik Database Index'ler
    tasks.assignee_id - FK index yok
    password_reset_tokens.user_id - index yok
    labels.board_id - index yok
    notifications(recipient_id, type) - composite index yok
    email_verification_tokens.email - index yok

14. HSTS Header Eksik
    Dosya: SecurityConfig.java

Strict-Transport-Security header'ı yapılandırılmamış. Üretim ortamında HTTPS zorunlu kılınmalı.

15. Pagination Eksikliği
    NotificationService.getNotifications(), ConnectionService.getAcceptedConnections() gibi metodlar pagination desteklemiyor. Binlerce kayıtta OOM riski.

16. Async Email Exception Yutulması
    Dosya: EmailService.java:19-33

@Async metotlarda fırlatılan exception çağırana ulaşmıyor. Email gönderim hataları sessizce kayboluyor.

17. NOT IN Subquery Performansı
    Dosya: NotificationRepository.java:28-38

Stale notification temizleme sorguları NOT IN ile subquery kullanıyor. Büyük veri setlerinde NOT EXISTS veya LEFT JOIN ... IS NULL daha performanslı.

18. Error Response Format Tutarsızlığı
    Dosyalar: JwtFilter.java:78-84, RateLimitFilter.java:100-103

Filter'lar response'a doğrudan JSON yazıyor, GlobalExceptionHandler'ın ErrorResponse formatıyla uyumsuz.

19. useEffect Dependency Eksiklikleri (Frontend)
    Dosya: SettingsPage.tsx:71-100

useEffect'in dependency array'inde userId var ama effect body'sinde updateAuthUsername, login, setDeletionScheduledAt kullanılıyor. Stale closure riski.

20. Session Restore'da Token Validasyonu Yok
    Dosya: authStore.ts

Sayfa yenilendiğinde localStorage'dan token restore edilirken sunucuyla doğrulama yapılmıyor. Expired veya geçersiz token ile oturum başlatılabilir.

21. Unhandled Promise Rejection
    Dosya: ErrorBoundary.tsx

Error Boundary sadece render hatalarını yakalar. Async hataları için window.addEventListener('unhandledrejection', ...) yok.

22. Single Refresh Token per User
    Dosya: RefreshTokenService.java:38-39

Kullanıcı başına tek refresh token. Yeni giriş yapıldığında önceki cihazın oturumu sonlandırılır (masaüstü + mobil aynı anda kullanılamaz).

23. System.out.println Kullanımı
    Dosya: ConnectionService.java:274

Logger yerine System.out.println kullanılmış. Log dosyalarında görünmez.

24. Türkçe Karakter Dönüşümü Eksik
    Dosya: BoardService.java:402-416

toKebabCase() metodu toLowerCase() sonrası Türkçe karakter dönüşümü yapıyor ama toLowerCase() öncesindeki büyük harfler (Ğ, Ü, İ vs.) dönüştürülemiyor. toLowerCase(Locale.forLanguageTag("tr")) kullanılmalı.

DÜŞÜK Seviye 25. Eksik @Version Annotasyonları
BoardMemberAssignment, EmailVerificationToken, PasswordResetToken, RefreshToken, UserProfilePicture entity'lerinde optimistic locking yok.

26. Refresh Token Süresi (7 gün)
    Application.properties'te refresh token 7 gün. Güvenlik açısından 1-3 gün daha uygun olabilir.

27. Rate Limit Header'ları Eksik
    RateLimitFilter.java - RateLimit-Remaining, RateLimit-Reset gibi standart header'lar dönülmüyor.

28. Profil Resmi Base64 Olarak DB'de
    Profil resimleri Base64 string olarak veritabanında saklanıyor. Büyük resimler DB boyutunu artırır. File storage veya object storage (S3) kullanılmalı.

29. Frontend Büyük Listelerde Virtualization Yok
    BoardDetailPage.tsx - Miller Columns ve task listeleri tüm öğeleri DOM'a ekliyor. Büyük boardlarda performans düşüşü.
