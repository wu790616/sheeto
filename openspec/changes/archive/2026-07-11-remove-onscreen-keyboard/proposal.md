## Why

The current mobile expense logging interface uses a custom on-screen numeric keypad which occupies significant vertical screen space. On mobile devices, this blocks the user from seeing the entered amount and the "Submit" button simultaneously, making the submission flow awkward and unnecessary when native mobile keyboards can be used directly.

## What Changes

- **Remove Custom Keypad**: Eliminate the custom on-screen virtual numeric keypad from the user interface.
- **Native Keyboard Support**: Replace the static amount display with a native input field supporting numeric and decimal entry, allowing users to leverage their device's built-in keyboard directly.
- **Improved UI Layout**: Re-style the amount container to house a real HTML input field that matches the current glassmorphism design and triggers the mobile decimal keypad (`inputmode="decimal"`) upon focus.
- **Update Keyboard Event Handlers**: Simplify keyboard event handling to rely on native input events instead of custom global key interceptors.

## Capabilities

### New Capabilities

### Modified Capabilities

- `mobile-expense-logging`: Update the amount entry requirement from using a custom on-screen keypad to supporting native device input directly.

## Impact

- **UI Components**: Modifications to `src/App.jsx` and `src/App.css` to replace the virtual keypad component with a styled input element.
- **User Experience**: Users on mobile devices will now interact with their system's native keyboard for amount entry.
