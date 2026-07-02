---
name: Nook colors type fix
description: useColors.ts cast fails when colors object has mixed-type keys (palette objects + number radius)
---

The scaffold's `useColors.ts` used `(colors as Record<string, typeof colors.light>).dark` which TypeScript rejects because `colors.radius` is `number`, not `typeof colors.light`.

**Fix:** Access `colors.dark` directly without the cast:
```ts
const palette = scheme === 'dark' && colors.dark ? colors.dark : colors.light;
return { ...palette, radius: colors.radius };
```

**Why:** The cast to `Record<string, typeof colors.light>` fails when the object contains mixed value types. Direct access is type-safe as long as `colors.dark` is typed as the same palette type as `colors.light`.

**How to apply:** Whenever updating `constants/colors.ts` to add a dark palette, use the direct property access pattern in `hooks/useColors.ts`, not the generic cast.
