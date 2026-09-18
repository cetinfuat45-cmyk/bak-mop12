# AKG Bakım Operatör Paneli v2.0

Müdahale modalı mevcut React projesinde 5 adımlı wizard yapısına dönüştürüldü:
1. Sonuç seçimi
2. Arıza ve duruş nedenleri
3. Yapılan işlem ve süre
4. Değişen parça
5. Özet ve kayıt

Kayıt başarılı olduğunda onClose çağrılır ve modal kapanır. Kayıt hatasında modal açık kalır ve hata mesajı gösterilir.
