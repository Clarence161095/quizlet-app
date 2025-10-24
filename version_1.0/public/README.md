# Public Assets Directory

This directory contains static assets served by Express.

## Structure

```
public/
├── css/           # Custom CSS files (optional)
├── js/            # Custom JavaScript files (optional)
├── images/        # Images, logos, icons
└── fonts/         # Custom fonts (optional)
```

## Current Setup

Currently using CDN for:
- Tailwind CSS
- Font Awesome Icons

For production, you may want to download and serve these locally for better performance and offline capability.

## Adding Static Assets

All files in this directory are served at the root URL.

Example:
- `public/images/logo.png` → `http://yoursite.com/images/logo.png`
- `public/css/custom.css` → `http://yoursite.com/css/custom.css`
