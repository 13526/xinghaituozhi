from pathlib import Path
import base64

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
game = (root / "game.js").read_text(encoding="utf-8")
three = (root / "vendor" / "three.min.js").read_text(encoding="utf-8")
badge = base64.b64encode((root / "assets" / "class64-badge.png").read_bytes()).decode("ascii")
badge_uri = f"data:image/png;base64,{badge}"
bgm = base64.b64encode((root / "assets" / "bgm-colony.wav").read_bytes()).decode("ascii")
bgm_uri = f"data:audio/wav;base64,{bgm}"
game = game.replace("'assets/bgm-colony.wav'", f"'{bgm_uri}'")

html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
html = html.replace('<link rel="icon" type="image/png" href="assets/class64-badge.png">',
                    f'<link rel="icon" type="image/png" href="{badge_uri}">')
html = html.replace('<script src="vendor/three.min.js"></script>',
                    "<script>\n" + three.replace("</script>", "<\\/script>") + "\n</script>")
html = html.replace('<script src="game.js"></script>', "<script>\n" + game + "\n</script>")
html = html.replace("assets/class64-badge.png", badge_uri)
html = html.replace("<!doctype html>",
                    "<!doctype html>\n<!-- 星海拓殖 · 笃实书院64班：Three.js、样式、脚本与班徽已内联，可直接双击打开。 -->", 1)

out = root / "星海拓殖64班.html"
out.write_text(html, encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")
