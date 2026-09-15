import Swal from 'sweetalert2';

/**
 * Robust Project ZIP Downloader for Browser & Iframe environments
 * Fetches the binary blob, checks integrity, and triggers native download for GitHub distribution
 */
export async function downloadProjectZip(filename = 'akg-cmms-github-release.zip'): Promise<boolean> {
  try {
    Swal.fire({
      title: 'ZIP Paketi Hazırlanıyor...',
      text: 'GitHub dağıtım arşivi indiriliyor, lütfen bekleyin.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#0f172a',
      color: '#f8fafc'
    });

    let targetUrl = `/${filename}`;
    let response = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });

    if (!response.ok) {
      // Fallback to akg-cmms-sistemi.zip
      targetUrl = '/akg-cmms-sistemi.zip';
      response = await fetch(targetUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Dağıtım ZIP dosyası sunucudan alınamadı.`);
    }

    const blob = await response.blob();
    if (blob.size < 1000) {
      throw new Error('İndirilen arşiv boyutu beklenenden küçük veya eksik.');
    }

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 2500);

    Swal.fire({
      icon: 'success',
      title: 'GitHub Paketi İndirildi',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-300">
          <p><b>${filename}</b> başarıyla cihazınıza indirildi.</p>
          <div class="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 space-y-1">
            <div class="font-bold text-white">🐙 GitHub'a Dağıtmak İçin:</div>
            <div>1. Arşivi klasöre çıkartın veya doğrudan GitHub'a push edin.</div>
            <div>2. Terminalde <code>npm install</code> ve <code>npm run dev</code> çalıştırın.</div>
            <div>3. Detaylar için zip içindeki <b>README.md</b> dosyasını inceleyebilirsiniz.</div>
          </div>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#0284c7'
    });

    return true;
  } catch (error: any) {
    console.error('ZIP indirme hatası:', error);
    Swal.fire({
      icon: 'error',
      title: 'İndirme Hatası',
      text: error.message || 'ZIP arşivi indirilirken bir sorun oluştu.',
      background: '#0f172a',
      color: '#f8fafc'
    });

    // Direct link fallback
    const fallbackLink = document.createElement('a');
    fallbackLink.href = '/akg-cmms-github-release.zip';
    fallbackLink.target = '_blank';
    fallbackLink.download = 'akg-cmms-github-release.zip';
    fallbackLink.click();
    return false;
  }
}
