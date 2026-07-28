---
title: "Architecture: src/utils"
type: architecture
tier: slow
module: codebase
module-path: src/utils
language: typescript
exports-hash: "e26cd525691a487a8a635b9317a393ca53311cd37b56fc8ab7cbc3da6be11121"
tags: [architecture, typescript, titan-design]
created: 2026-03-14T15:53:52.797Z
modified: 2026-03-14T15:53:52.797Z
---

## Purpose

No module-level documentation found.

## Public API

| Export | Kind | Signature |
|--------|------|-----------|
| alpha | function | export function alpha(color: string, opacity: number): string |
| cn | function | export function cn(...inputs: ClassValue[]): string |
| cn | const | export |
| composeValidators | function | export function composeValidators( ...validators: Array<(value: any) => string \| undefined> ) |
| createFieldId | function | export function createFieldId(label: string): string |
| darken | const | export |
| export | type | export type |
| FieldState | interface | export interface FieldState |
| FieldWrapperProps | interface | export interface FieldWrapperProps |
| FormErrors | type | export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>> |
| FormTouched | type | export type FormTouched<T extends FormValues> = Partial<Record<keyof T, boolean>> |
| FormValues | type | export type FormValues = Record<string, unknown> |
| getContrastText | function | export function getContrastText(backgroundColor: string): string |
| getFieldAriaProps | function | export function getFieldAriaProps(props: FieldWrapperProps & |
| getFieldValidationProps | function | export function getFieldValidationProps(state: FieldState): |
| getLuminance | function | export function getLuminance(color: string): 'light' \| 'dark' |
| getResultColor | function | export function getResultColor(result: ResultType): string |
| getStatusColor | function | export function getStatusColor(status: StatusType): string |
| getTheme | function | export function getTheme(): 'light' \| 'dark' |
| hasMaxLength | function | export function hasMaxLength(value: string, maxLength: number): boolean |
| hasMinLength | function | export function hasMinLength(value: string, minLength: number): boolean |
| isEmpty | function | export function isEmpty(value: unknown): boolean |
| isValidEmail | function | export function isValidEmail(email: string): boolean |
| lighten | const | export |
| ResultType | type | export type ResultType = 'improve' \| 'degrade' \| 'inconclusive' \| 'neutral' |
| StatusType | type | export type StatusType = 'success' \| 'error' \| 'warning' \| 'info' |
| useTheme | function | export function useTheme(): 'light' \| 'dark' |
| validationRules | const | export const validationRules = |

## Dependencies

### Internal

*(none)*

### External

- `clsx` — ClassValue, clsx
- `react` — React, useSyncExternalStore
- `tailwind-merge` — twMerge

## Invariants

*(none yet)*
