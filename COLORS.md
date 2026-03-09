# Friendli Color Reference

## Original Login Gradient (Ombre)

The original login page used a CSS gradient from top-left to bottom-right:

```css
background: linear-gradient(to bottom right, #D4803F, #E04A2B);
```

### Gradient Color Stops

| Position | Hex | Description |
|----------|-----|-------------|
| 0% | #D4803F | Warm golden orange (start, top-left) |
| 15% | #D77240 | Slightly deeper orange |
| 25% | #D96A3B | Medium warm orange |
| 35% | #DB6237 | Richer orange |
| 50% | #DA6534 | Midpoint - burnt orange |
| 65% | #DD5A31 | Orange-red transition |
| 75% | #DE552F | Deep orange-red |
| 85% | #DF4F2D | Approaching red |
| 100% | #E04A2B | Deep red-orange (end, bottom-right) |

### Current Solid Color

The login page currently uses `#D77240` as a solid color (approximately 15% into the gradient). This was chosen because Safari cannot extend CSS gradients into the safe-area zones on iOS, so a solid color is required to avoid visible bars at the top and bottom of the screen.

## App Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | #0D3B66 | Text, headings, dark elements |
| Cream | #FDFAEC | Page backgrounds |
| Orange (accent) | #EE964B | Buttons, highlights, active states |
| Red-orange | #F95738 | Destructive actions, reject button |
| Yellow | #F4D35E | Secondary accents, premium icons |
| Login orange | #D77240 | Login page solid background |

## Sign-in Button Gradient

```css
background: linear-gradient(to right, #D4803F, #E04A2B);
```

## Premium Badge Gradient

```css
background: linear-gradient(to right, #EE964B, #F95738);
```
