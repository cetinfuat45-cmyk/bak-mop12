# Sürüm Geçmişi

## V4.0.0
- Operatör arızayı kapattığında kayıt anında Google E-Tablolar'a gönderilir.
- E-Tablo başarılı yanıt vermeden Firestore kaydı silinmez.
- Başarılı aktarım sonrasında kapalı arıza `arizalar` koleksiyonundan silinir.
- Aktarım başarısız olursa kayıt korunur ve operatöre hata bilgisi gösterilir.
- Normal müdahale formu ve AI ile kapatma akışı aynı kurala bağlandı.
