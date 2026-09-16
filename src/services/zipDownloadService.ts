import Swal from 'sweetalert2';

/**
 * Robust Project ZIP Downloader for Browser, Mobile, GitHub Pages & Iframe environments
 * Uses relative path resolution and direct download fallbacks to prevent 403 / CORS errors.
 */
export async function downloadProjectZip(filename = 'akg-cmms-github-release.zip'): Promise<boolean> {
  try {
    Swal.fire({
      title: 'ZIP Paketi Hazırlanıyor...',
      text: 'Dağıtım arşivi indiriliyor, lütfen bekleyin.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#0f172a',
      color: '#f8fafc'
    });

    // Detect base URL dynamically for GitHub Pages (e.g. /repository-name/)
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    const candidateUrls = [
      `${basePath}${filename}`,
      `./${filename}`,
      filename,
      `/${filename}`,
      `${basePath}akg-cmms-sistemi.zip`,
      './akg-cmms-sistemi.zip'
    ];

    let response: Response | null = null;
    let successfulUrl = '';

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache'
          }
        });
        if (res.ok) {
          response = res;
          successfulUrl = url;
          break;
        }
      } catch (err) {
        console.warn(`Fetch failed for candidate URL: ${url}`, err);
      }
    }

    if (!response || !response.ok) {
      // If fetch fails (e.g., HTTP 403 or CORS on GitHub Pages), try direct browser link download
      console.warn('Fetch failed on all candidates, triggering direct anchor download fallback...');
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = `./${filename}`;
      fallbackAnchor.setAttribute('download', filename);
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      setTimeout(() => {
        try {
          document.body.removeChild(fallbackAnchor);
        } catch {}
      }, 2000);

      Swal.fire({
        icon: 'info',
        title: 'İndirme Başlatıldı',
        html: `
          <div class="text-left text-xs space-y-2 text-slate-300">
            <p>Tarayıcınızın doğrudan dosya indirme mekanizması tetiklendi.</p>
            <p class="text-slate-400">Eğer indirme otomatik başlamadıysa aşağıdaki butona tıklayabilirsiniz:</p>
            <div class="pt-2 flex justify-center">
              <a href="./${filename}" download="${filename}" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-lg">
                ⬇️ Dosyayı Doğrudan İndir (${filename})
              </a>
            </div>
          </div>
        `,
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0284c7'
      });
      return true;
    }

    const blob = await response.blob();
    if (blob.size < 500) {
      throw new Error('İndirilen arşiv boyutu beklenenden küçük.');
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
    
    // Direct link fallback
    const directUrl = `./${filename}`;
    Swal.fire({
      icon: 'warning',
      title: 'Doğrudan İndirme Bağlantısı',
      html: `
        <div class="text-left text-xs space-y-3 text-slate-300">
          <p>Tarayıcı güvenlik kısıtlaması nedeniyle otomatik indirme tamamlanamadı (${error.message || 'CORS/403'}).</p>
          <p>Aşağıdaki bağlantıya tıklayarak ZIP dosyasını doğrudan cihazınıza kaydedebilirsiniz:</p>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <a href="${directUrl}" download="${filename}" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2">
              📦 ${filename} Dosyasını İndir
            </a>
          </div>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#059669'
    });

    return false;
  }
}
