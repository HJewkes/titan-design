// Theme subpath entry: @titan-design/react-ui/theme
//
// The full theme surface. This is the nativewind-free `./barrel` PLUS the
// `ThemeProvider` value — which imports `nativewind` and therefore does NOT
// belong on the root barrel (that split happened in titan 0.5.0). Native
// consumers wrap their app root in `<ThemeProvider>` and import it from HERE.
export * from './barrel'
export { ThemeProvider } from './ThemeProvider'
