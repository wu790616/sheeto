## 1. UI Changes

- [x] 1.1 Replace the static amount display in `src/App.jsx` with an `<input>` element using `type="text"`, `inputmode="decimal"`, and `pattern="[0-9]*\.?[0-9]*"`.
- [x] 1.2 Remove the custom onscreen virtual numeric keypad container (`keypad-container`) from `src/App.jsx`.

## 2. React Logic & Event Handling

- [x] 2.1 Implement an `onChange` handler for the amount input that sanitizes inputs to only allow numbers and a single decimal point (max 10 characters), stripping leading zeros.
- [x] 2.2 Implement an `onKeyDown` handler on the amount input to submit the form when the `Enter` key is pressed.
- [x] 2.3 Remove the obsolete global keyboard `keydown` event listener from the `useEffect` hook in `src/App.jsx`.

## 3. Styling Changes

- [x] 3.1 Style the new input field in `src/App.css` to ensure it is borderless, has a transparent background, right-aligns text, matches the existing typography (48px Outfit), and behaves gracefully on focus.
- [x] 3.2 Clean up the unused CSS rules for `.keypad-container` and `.keypad-btn` from `src/App.css`.
