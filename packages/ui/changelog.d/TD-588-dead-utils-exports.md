---
section: Removed
---

Removed unused utility exports (TD-588). Minor release, breaking for 0.x consumers of these names:

- `utils/form.ts`: `getFieldValidationProps`, `createFieldId`, `getFieldAriaProps`, `isValidEmail`,
  `hasMinLength`, `hasMaxLength`, `isEmpty`, `validationRules`, `composeValidators`, and the types
  `FieldState`, `FieldWrapperProps`, `FormValues`, `FormErrors`, `FormTouched`.
- `utils/colors.ts`: `getStatusColor`, `getResultColor`, `getLuminance`, `getContrastText`, and the types
  `StatusType`, `ResultType`. `alpha`, `lighten` and `darken` stay.
- `utils/workout-format.ts`: `formatSignedPct`, `formatPrescription`, and the type `PrescriptionInput`.

Consumer check, `git grep -n -w <symbol> -- packages/` at origin/main (`src/` has no other root):
every form.ts and colors.ts symbol above hits only its defining file, `utils/index.ts` and
`api/index.api.md` (`isEmpty` also matches unrelated local variables and `isEmpty` fields in chart hooks,
none of which import it). `formatSignedPct` and `formatPrescription` hit only their defining file, the
barrel, the API report and `workout-format.test.ts`. `StatusType`, `ResultType` and `PrescriptionInput`
hit no other file in `src/`. `formatRepsRange` keeps its callers: `SetStrip.tsx` and `formatExpectedRange`.
