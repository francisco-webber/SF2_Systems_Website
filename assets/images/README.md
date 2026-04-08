# SF2 Media Structure

Use this structure for screenshots and technical visuals.

- `assets/images/software/studio-se/`
- `assets/images/software/suite-rt/`
- `assets/images/software/engine-rt/`
- `assets/images/hardware/edge-modul/`
- `assets/images/hardware/verification-device/`
- `assets/images/proof-center/`

## Naming pattern

Use lowercase names with product + topic + variant.

Examples:
- `studio-se-csv-import-v1.webp`
- `suite-rt-scada-output-v1.webp`
- `edge-modul-deployment-topology-v1.png`

Current integrated assets:
- `assets/images/software/studio-se/sf2-studio-full-ui.png`
- `assets/images/landing/sensor-fusion-hero.png`
- `assets/images/hardware/edge-modul/edge-modul-2.png`
- `assets/images/hardware/edge-modul/edge-modul-3.png`
- `assets/images/hardware/edge-modul/edge-modul-4.png`
- `assets/images/hardware/edge-modul/edge-modul-5.png`
- `assets/videos/software/studio-se/sf2-studio-timeseries.mov`

## Recommended export

- UI screenshots: WebP (quality 75-85), width 1400-1800 px
- Diagrams: SVG or PNG
- Keep 16:10 or 16:9 aspect ratio where possible

## HTML pattern

```html
<figure class="media-frame">
  <picture>
    <source srcset="assets/images/software/studio-se/studio-se-csv-import-v1.webp" type="image/webp">
    <img src="assets/images/software/studio-se/studio-se-csv-import-v1.png" alt="SF2 Suite SE CSV import view" loading="lazy" decoding="async" width="1600" height="1000">
  </picture>
  <figcaption>CSV import and channel mapping in SF2 Suite SE.</figcaption>
</figure>
```
