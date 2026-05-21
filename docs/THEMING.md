# Theming & dark mode

The app supports Light / Dark / Match-device, persisted in AsyncStorage under
`horae.theme-mode.v1` and exposed via the **Appearance** section in General
preferences. The provider lives at the root of `app/_layout.tsx`, and React
Navigation's theme is rebuilt from the active palette so headers/cards repaint
in sync. There are **two color palettes** in `constants/theme.ts`
(`LIGHT_COLORS` and `DARK_COLORS`, typed `ThemeColors`); every component MUST
read its colors through the theme hook so styles recompute on mode switch.

## Required pattern for new components

Use a `makeStyles(c: ThemeColors)` factory at the bottom of the file, and call
`useThemedStyles(makeStyles)` from the component:

```tsx
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

export function MyCard(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme(); // only if you need an inline color in JSX
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Hi</Text>
      <Feather name="check" color={colors.primary} size={16} />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: c.surface, padding: SPACING.lg },
    label: { ...TYPOGRAPHY.titleMd, color: c.onSurface },
  });
}
```

## Rules

- Never call `StyleSheet.create({ ... COLORS.x ... })` at module scope — the
  values get baked in at module load and won't react to mode changes.
- Never import `COLORS` into a `.tsx` component. The static `COLORS` export
  aliases `LIGHT_COLORS` and exists only as a fallback for non-React modules
  that genuinely can't read from context (none exist today).
- If a sibling helper outside a component needs colors (e.g. a chart palette
  function or a derived lookup table), make it take `c: ThemeColors` as a
  parameter and have the caller pass `useTheme().colors`. See
  `components/insights/delta-polarity.ts` for the pattern.
- Multiple sub-components in the same file can each call
  `useThemedStyles(makeStyles)` — the memoized result is cheap.
- `SPACING`, `TYPOGRAPHY`, `RADIUS`, `FONTS`, `SHADOWS`, and `CATEGORY_PALETTE`
  are theme-independent and stay as module-level imports.
- When you add a new color token to `LIGHT_COLORS`, add the dark counterpart to
  `DARK_COLORS` in the same commit — `ThemeColors` enforces parity but only
  catches it at type-check time.
