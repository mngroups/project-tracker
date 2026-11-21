# Mobile & Responsive UI

**Every UI change must work on mobile.** There is no separate mobile codebase, so
a screen that only works on desktop is a broken screen.

> Definition of done for any UI change: it works at **360px wide** as well as on
> desktop, and it reuses the design-system mobile components below instead of
> inventing a new pattern.

## Breakpoint

One breakpoint: Tailwind's **`md` (768px)**.

| Width      | Treated as | Tailwind         | Hook                      |
| ---------- | ---------- | ---------------- | ------------------------- |
| `< 768px`  | Mobile     | `max-md:` (base) | `useIsMobile() === true`  |
| `>= 768px` | Desktop    | `md:`            | `useIsMobile() === false` |

## CSS first, hook second

1. **Prefer CSS** (`max-md:` / `md:`). It renders correctly on the first paint,
   on the server and in the client.
2. **Use `useIsMobile()` from `@mono/hooks` only when the tree differs**, e.g. a
   table on desktop and a card list on mobile. It returns `false` during SSR and
   hydration. Never read `window.innerWidth` in render.

## Use the design-system mobile components (`@mono/ui`)

| Desktop pattern  | Mobile counterpart                  | Notes                                              |
| ---------------- | ----------------------------------- | -------------------------------------------------- |
| `DataTable` list | `MobileCardList` + `MobileDataCard` | See `features/example/components/example-page.tsx` |
| Dialog / modal   | `DynamicModal`                      | Bottom sheet on mobile, dialog on desktop          |
| Popover / picker | `BottomSheet`                       | Drag-to-dismiss, safe-area padding                 |
| Form action row  | `StickyFormFooter`                  | Pins Batal/Simpan to the bottom on mobile          |
| Sidebar          | `Sidebar` (off-canvas on mobile)    | `features/app-shell/components/app-shell.tsx`      |

## Layout rules

- **No horizontal page scroll** at 360px. Long values wrap (`min-w-0`, `break-words`).
- **Touch targets** are at least 40×40px; don't rely on hover to reveal actions.
- **Safe areas:** bottom-anchored UI pads with `var(--safe-bottom)` (top: `var(--safe-top)`).
- **Viewport height:** prefer `dvh` over `100vh`.

## Testing

`vitest.setup.tsx` mocks `matchMedia` as desktop. Cover the mobile branch by
mocking the hook partially:

```tsx
let mobile = false;
vi.mock("@mono/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mono/hooks")>()),
  useIsMobile: () => mobile,
}));
```

Before a PR: check Chrome DevTools device mode at 360px and 390px, and attach a
mobile screenshot next to the desktop one.
