# Switch2GO AAC — Website & Support

Marketing site, privacy policy, browser demo embed, and image isolation tool for [Switch2GO AAC](https://switch2goaac.org).

## Live URLs

| Resource | URL |
|----------|-----|
| **Website** | https://switch2goaac.org |
| **Web app (try without installing)** | https://grahamthetvi.github.io/Switch2GO_AAC_iPadOS/ |
| **App Store (iOS)** | https://apps.apple.com/gb/app/switch2go-aac/id6758625551 |

The homepage embeds the web app so visitors can test eye tracking, head tracking, touch input, and phrase boards in the browser before downloading.

## Input methods

- **Eye tracking** — hands-free selection via gaze
- **Head tracking** — pointer control via head movement
- **Touch input** — standard tap interaction
- **Switch support** — coming soon (USB/Arduino switches)

## Repository contents

| File | Purpose |
|------|---------|
| `index.html` | Landing page, embedded web demo, image tool |
| `privacy.html` | App privacy policy (App Store / legal) |
| `style.css` | Layout and theme |
| `script.js` | Navigation, animations, image processing |
| `CNAME` | Custom domain for GitHub Pages |
| `.github/workflows/static.yml` | Deploy to GitHub Pages on push to `main` |

## Local development

```bash
cd Switch2GO_AAC_iPadOS_Explanation_and_Support
python3 -m http.server 8765
```

Open http://localhost:8765

The **image isolation tool** runs entirely in the browser (background removal via `@imgly/background-removal` from jsDelivr). It works on iPad Safari; the first run downloads a large model and may take a minute.

## Deployment

Pushes to `main` deploy automatically via GitHub Actions to GitHub Pages. Custom domain `switch2goaac.org` is set in `CNAME`.

## Contact

**Addison Graham** — Teacher of the Visually Impaired  
[grahamthetvi@icloud.com](mailto:grahamthetvi@icloud.com)

## License

MIT — see [LICENSE](LICENSE).
