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
    
    exclude_dirs = {'.git', 'node_modules', 'dist', '.cache', '__pycache__'}
    exclude_files = {'.DS_Store', 'Thumbs.db', 'test_win.zip', 'temp_pack.zip', 'temp_github.zip', 'akg-cmms-sistemi.zip', 'akg-cmms-github-release.zip'}
    
    # Ensure public folder exists
    os.makedirs(public_dir, exist_ok=True)
    
    temp_zip = os.path.join(public_dir, 'temp_pack.zip')
    if os.path.exists(temp_zip):
        os.remove(temp_zip)

    added_dirs = set()

    with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            rel_root = os.path.relpath(root, base_dir)
            if rel_root != '.':
                norm_root = rel_root.replace(os.sep, '/').strip('/')
                parts = norm_root.split('/')
                cur = ''
                for part in parts:
                    cur = f"{cur}/{part}" if cur else part
                    dir_entry = f"{cur}/"
                    if dir_entry not in added_dirs:
                        zinfo = zipfile.ZipInfo(dir_entry)
                        zinfo.date_time = time.localtime(time.time())[:6]
                        zinfo.create_system = 0  # MS-DOS / FAT
                        zinfo.external_attr = 0x10  # Directory flag for MS-DOS
                        zf.writestr(zinfo, b'')
                        added_dirs.add(dir_entry)

            for file in sorted(files):
                if file in exclude_files or file.endswith('.zip') or file.startswith('.DS_Store'):
                    continue
                file_path = os.path.join(root, file)
                rel_file = os.path.relpath(file_path, base_dir).replace(os.sep, '/').strip('/')
                
                try:
                    mtime = os.path.getmtime(file_path)
                    date_time = time.localtime(mtime)[:6]
                except Exception:
                    date_time = time.localtime(time.time())[:6]
                
                with open(file_path, 'rb') as f:
                    content = f.read()

                zinfo = zipfile.ZipInfo(rel_file)
                zinfo.date_time = date_time
                zinfo.create_system = 0  # MS-DOS / FAT
                zinfo.external_attr = 0x20  # Archive flag for MS-DOS
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zf.writestr(zinfo, content)

    # Replace public zip atomically
    if os.path.exists(public_zip):
        os.remove(public_zip)
    shutil.copy2(temp_zip, public_zip)
    
    if os.path.exists(github_zip):
        os.remove(github_zip)
    os.rename(temp_zip, github_zip)
    
    print(f"Generated clean GitHub-ready distribution packages:")
    print(f" - {public_zip}")
    print(f" - {github_zip}")

    # If dist exists, copy there too
    if os.path.exists(dist_dir):
        shutil.copy2(public_zip, dist_zip)
        shutil.copy2(github_zip, dist_github_zip)
        print(f"Copied to dist: {dist_zip} & {dist_github_zip}")

if __name__ == '__main__':
    build_github_ready_zip()
