# Arıza Kapatma Akışı V4

1. Operatör arızayı kapatır.
2. Kapanış bilgileri Firestore'a yazılır.
3. Sistem tek arıza kaydını Google Apps Script üzerinden E-Tabloya gönderir.
4. Apps Script `success: true` döndürürse Firestore arıza kaydı silinir.
5. Aktarım başarısızsa arıza kaydı silinmez ve tekrar aktarılabilir.

## Apps Script beklentisi
Mevcut `exportClosedFaults` işlemi kullanılmaktadır. İstek gövdesinde `data` tek satırlık dizi ve `faultIds` alanı bulunur.
