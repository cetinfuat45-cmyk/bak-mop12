#!/usr/bin/env python3
import zlib
import struct
import math
import os

def create_png(width, height, draw_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc))
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    return bytes(png)

def icon_drawer(x, y, w, h, is_maskable=False):
    # Normalized coordinates (-1.0 to 1.0)
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    r = math.sqrt(nx * nx + ny * ny)

    # Scale down geometry for maskable safe zone (80% safe zone = 0.8)
    scale = 0.7 if is_maskable else 0.85
    sx = nx / scale
    sy = ny / scale
    sr = math.sqrt(sx * sx + sy * sy)
    
    # Background: Dark Industrial Slate Gradient
    # from #0f172a (top) to #020617 (bottom)
    t = (ny + 1) / 2
    bg_r = int(15 * (1 - t) + 2 * t)
    bg_g = int(23 * (1 - t) + 6 * t)
    bg_b = int(42 * (1 - t) + 23 * t)
    
    # Outer rounded square emblem
    # Round rectangle: max(|sx|, |sy|) - 0.75
    in_emblem = False
    emblem_rad = 0.78
    corner_r = 0.22
    qx = abs(sx) - (emblem_rad - corner_r)
    qy = abs(sy) - (emblem_rad - corner_r)
    if qx < 0 and qy < 0:
        in_emblem = True
    elif qx < 0 and qy <= corner_r:
        in_emblem = True
    elif qy < 0 and qx <= corner_r:
        in_emblem = True
    elif qx > 0 and qy > 0 and math.sqrt(qx * qx + qy * qy) <= corner_r:
        in_emblem = True
        
    if in_emblem:
        # Subtle cyan-teal glow inside emblem
        glow = max(0.0, 1.0 - sr * 0.8)
        bg_r = min(255, int(bg_r + 14 * glow))
        bg_g = min(255, int(bg_g + 75 * glow))
        bg_b = min(255, int(bg_b + 110 * glow))

    # Center Cog / Gear Symbol
    # Outer gear teeth (8 teeth)
    angle = math.atan2(sy, sx)
    teeth = math.sin(8 * angle)
    gear_outer = 0.52 + 0.08 * teeth
    gear_inner = 0.44
    hole_radius = 0.22
    
    is_gear = False
    if sr <= gear_outer and sr >= hole_radius:
        is_gear = True
        
    # Central wrench or cross mark inside cog
    is_wrench = False
    if abs(sx) <= 0.09 and abs(sy) <= 0.32:
        is_wrench = True
    if abs(sy) <= 0.09 and abs(sx) <= 0.32:
        is_wrench = True

    if is_gear or is_wrench:
        # Vibrant Cyan / Emerald industrial gradient
        grad = (sy + 0.5)
        # Cyan #06b6d4 to Emerald #10b981
        cr = int(6 * (1 - grad) + 16 * grad)
        cg = int(182 * (1 - grad) + 185 * grad)
        cb = int(212 * (1 - grad) + 129 * grad)
        return (cr, cg, cb, 255)
    
    # Emblem border highlight
    border_dist = abs(max(abs(sx), abs(sy)) - emblem_rad)
    if in_emblem and border_dist < 0.035:
        return (6, 182, 212, 220)  # Cyan border

    return (bg_r, bg_g, bg_b, 255)

def main():
    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
    os.makedirs(public_dir, exist_ok=True)
    
    configs = [
        ('pwa-192x192.png', 192, 192, False),
        ('pwa-512x512.png', 512, 512, False),
        ('pwa-maskable-512x512.png', 512, 512, True),
        ('apple-touch-icon.png', 180, 180, False),
        ('favicon.png', 64, 64, False)
    ]
    
    for filename, w, h, maskable in configs:
        filepath = os.path.join(public_dir, filename)
        print(f"Generating {filename} ({w}x{h})...")
        data = create_png(w, h, lambda x, y, width, height: icon_drawer(x, y, width, height, is_maskable=maskable))
        with open(filepath, 'wb') as f:
            f.write(data)
        print(f"Saved: {filepath} ({len(data)} bytes)")

    # Also create clean icon.svg
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="#06b6d4" stroke-width="4" opacity="0.3"/>
  <!-- Cog & Wrench -->
  <g transform="translate(256,256)">
    <circle r="130" fill="none" stroke="url(#cyanGrad)" stroke-width="38" stroke-dasharray="60 42"/>
    <circle r="70" fill="#0f172a" stroke="url(#cyanGrad)" stroke-width="12"/>
    <rect x="-24" y="-80" width="48" height="160" rx="12" fill="url(#cyanGrad)"/>
    <rect x="-80" y="-24" width="160" height="48" rx="12" fill="url(#cyanGrad)"/>
    <circle r="34" fill="#020617"/>
  </g>
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="4">AKG CMMS</text>
</svg>'''
    svg_path = os.path.join(public_dir, 'icon.svg')
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"Saved: {svg_path}")

if __name__ == '__main__':
    main()
