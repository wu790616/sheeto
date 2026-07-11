## Context

The current expense logging app (`Sheeto`) implements an on-screen custom digital keypad for entering transaction amounts. On mobile viewports, this keypad is visually redundant and takes up a large portion of the screen height, pushing the input display and the "Submit" button out of view. We want to remove this custom virtual keypad and instead use a native HTML `<input>` element with `inputmode="decimal"` to leverage mobile-native numeric keyboards.

## Goals / Non-Goals

**Goals:**
- Replace the static amount display span with an HTML `<input>` element styled matching the existing glassmorphic design.
- Remove the custom virtual keypad component and its associated CSS code.
- Enable mobile devices to automatically open their native decimal keyboard when focusing on the amount field.
- Simplify key event handling by removing the global physical keyboard listener that intercepts numeric keys.

**Non-Goals:**
- Add complex currency formatting (e.g. commas) to the input value.
- Change the back-end submission payload structure.

## Decisions

### 1. Choice of Input Element Type
We will use a standard HTML `<input>` element with `type="text"`, `inputmode="decimal"`, and a validation pattern for decimals.
* **Why**: Standard `<input type="number">` has inconsistent browser styling (spin buttons), behaves poorly with decimal points in some locales, and has poor support for selection APIs. Using `type="text"` with `inputmode="decimal"` triggers the native numeric decimal keypad on both iOS and Android while offering complete layout control.
* **Alternative considered**: `<input type="number">` - rejected due to styling constraints (spinners are hard to hide consistently across browsers) and cursor handling issues.

### 2. State Validation & Input Sanitization
A React `onChange` handler will sanitize input using a regular expression: `/^[0-9]*\.?[0-9]*$/`.
* **Why**: This ensures that users cannot paste or type invalid characters (letters, symbols, or multiple decimals) into the text input, keeping the local React state sanitized at all times.
* **Leading Zeroes**: If the user enters a number after a single leading `0` (e.g. typing `5` when the value is `0`), the leading `0` is replaced, unless it is a decimal point.

### 3. Removal of Global Event Listener
The global `keydown` event listener in `src/App.jsx` will be removed.
* **Why**: Previously, it intercepted keys like backspace, digits, and escape to update the virtual amount state because there was no focusable input. With a native input field, the browser handles these events naturally.
* **Enter to Submit**: A specific keydown event handler on the input field will be kept to allow pressing `Enter` to submit the form.

## Risks / Trade-offs

- **[Risk]**: Input focus is lost or keyboard dismissed when category is clicked.
  - **Mitigation**: Category buttons will use `preventDefault` on click or standard click handlers without explicitly blurring the input, ensuring focus is kept on the amount input if desired.
