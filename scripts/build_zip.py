#!/usr/bin/env python3
import os
import zipfile
import time
import shutil

def build_github_ready_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(base_dir, 'public')
    dist_dir = os.path.join(base_dir, 'dist')
    
    public_zip = os.path.join(public_dir, 'akg-cmms-sistemi.zip')
    github_zip = os.path.join(public_dir, 'akg-cmms-github-release.zip')
    dist_zip = os.path.join(dist_dir, 'akg-cmms-sistemi.zip')
    dist_github_zip = os.path.join(dist_dir, 'akg-cmms-github-release.zip')
    
    # Exclude version control and huge caches
    exclude_dirs = {'.git', 'node_modules', '.cache', '__pycache__'}
    exclude_files = {'.DS_Store', 'Thumbs.db', 'test_win.zip', 'temp_pack.zip', 'temp_github.zip', 'akg-cmms-sistemi.zip', 'akg-cmms-github-release.zip'}
    
    os.makedirs(public_dir, exist_ok=True)
    temp_zip = os.path.join(public_dir, 'temp_pack.zip')
    if os.path.exists(temp_zip):
        os.remove(temp_zip)

    added_entries = set()

    def add_file_to_zip(zf, file_path, arcname):
        if arcname in added_entries or not os.path.exists(file_path):
            return
        try:
            mtime = os.path.getmtime(file_path)
            date_time = time.localtime(mtime)[:6]
        except Exception:
            date_time = time.localtime(time.time())[:6]
        
        with open(file_path, 'rb') as f:
            content = f.read()

        zinfo = zipfile.ZipInfo(arcname)
        zinfo.date_time = date_time
        zinfo.create_system = 0  # MS-DOS / Windows
        zinfo.external_attr = 0x20
        zinfo.compress_type = zipfile.ZIP_DEFLATED
        zf.writestr(zinfo, content)
        added_entries.add(arcname)

    with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        # 1. CRITICAL FOR GITHUB PAGES:
        # Place pre-built production files at root level so dragging files to GitHub Pages works IMMEDIATELY!
        if os.path.exists(dist_dir):
            for root, dirs, files in os.walk(dist_dir):
                for f in files:
                    if f.endswith('.zip'):
                        continue
                    full_p = os.path.join(root, f)
                    rel_to_dist = os.path.relpath(full_p, dist_dir).replace(os.sep, '/')
                    
                    # Root-level deployable files
                    add_file_to_zip(zf, full_p, rel_to_dist)
                    
                    # Also keep dist/ prefix copy for standard setups
                    add_file_to_zip(zf, full_p, f"dist/{rel_to_dist}")

        # 2. Add source code, launchers, workflows and documentation
        # Keep original dev index.html as dev-index.html
        dev_index = os.path.join(base_dir, 'index.html')
        if os.path.exists(dev_index):
            add_file_to_zip(zf, dev_index, 'dev-index.html')

        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.') and d != 'dist']
            for f in sorted(files):
                if f in exclude_files or f.endswith('.zip') or f.startswith('.DS_Store'):
                    continue
                # If f is index.html at base_dir, it's already replaced by dist/index.html at root
                if root == base_dir and f == 'index.html':
                    continue
                full_p = os.path.join(root, f)
                rel_base = os.path.relpath(full_p, base_dir).replace(os.sep, '/')
                add_file_to_zip(zf, full_p, rel_base)

    # Save to public and dist
    if os.path.exists(public_zip):
        os.remove(public_zip)
    shutil.copy2(temp_zip, public_zip)
    
    if os.path.exists(github_zip):
        os.remove(github_zip)
    os.rename(temp_zip, github_zip)
    
    if os.path.exists(dist_dir):
        shutil.copy2(public_zip, dist_zip)
        shutil.copy2(github_zip, dist_github_zip)

    print(f"Generated clean GitHub-ready distribution packages with root-level dist files:")
    print(f" - {public_zip}")
    print(f" - {github_zip}")

if __name__ == '__main__':
    build_github_ready_zip()
