# Sistema Remitos - Aguas Mar MR

Aplicación web para gestión de remitos con React + Vite + Supabase.

## Requisitos

- Node.js 20 o superior
- Cuenta de Supabase

## Variables de entorno

Creá un archivo local `.env` con:

```env
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Deploy online (GitHub Pages)

El repo ya incluye workflow de deploy automático en [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

1. En GitHub, abrí Settings > Secrets and variables > Actions.
2. Creá estos secrets:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
3. En Settings > Pages:
	- Source: GitHub Actions
4. Hacé push a `master`.

Cuando termine el workflow, tu app quedará publicada en:

https://agusaguirre033.github.io/sistema-remitos/

Eso te permite usarla desde cualquier computadora o celular, sin abrir VS Code ni correr comandos localmente.
