# Khon Kaen Oil Prices — Mueang District

Static website comparing **Gasohol 91** and **Gasohol 95** pump prices across major fuel brands in **Mueang Khon Kaen** district (อำเภอเมืองขอนแก่น), sorted from cheapest to most expensive.

## Live site

After enabling GitHub Pages, the site will be available at:

`https://inwkoki.github.io/khon-kaen-oil-prices/`

## Features

- Compare PTT OR, Bangchak, Shell, Caltex, PT, Susco (and Pure when available)
- Gasohol 91 and 95 only
- Sorted by price (cheapest first)
- Auto-fetches live brand prices from [thai-oil-api](https://github.com/max180643/thai-oil-api) with Khon Kaen provincial adjustment
- Falls back to `data/prices.json` when API is unavailable

## Local preview

Open `index.html` in a browser, or use any static server:

```bash
npx serve .
```

## Data sources

- Live: `https://api.chnwt.dev/thai-oil-api/latest`
- Fallback: `data/prices.json`
- Khon Kaen provincial prices are derived from national brand retail minus Bangkok maintenance tax adjustment

## License

MIT
