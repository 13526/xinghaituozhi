from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
files = [
    "index.html",
    "styles.css",
    "game.js",
    "README.md",
    "tools/generate_bgm.py",
    "tools/build_single.py",
    "tools/build_zip.py",
    "vendor/three.min.js",
    "assets/class64-badge.png",
    "assets/bgm-colony.wav",
    "screenshots/title.png",
    "screenshots/gameplay.png",
    "screenshots/landing.png",
    "screenshots/construction.png",
    "screenshots/strategy.png",
    "screenshots/network.png",
    "screenshots/underground.png",
    "screenshots/orbit.png",
    "screenshots/base.png",
    "screenshots/upgrade.png",
    "screenshots/research.png",
    "screenshots/complete.png",
]
out = root / "星海拓殖64班-网页版.zip"
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for relative in files:
        archive.write(root / relative, arcname=relative)
print(f"wrote {out} ({out.stat().st_size} bytes)")
