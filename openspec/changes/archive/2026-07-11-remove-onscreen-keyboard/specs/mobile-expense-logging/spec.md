## MODIFIED Requirements

### Requirement: Enter transaction details
The system SHALL provide a mobile-friendly user interface with inputs for Amount (using a native HTML input field with decimal input mode to trigger the native device keyboard), Category (selectable buttons), Date (date picker defaulting to today's date, with a quick "Yesterday" selector), and Remarks (optional text input). The interface SHALL NOT display a custom on-screen virtual keyboard.

#### Scenario: Interface initialization
- **WHEN** the user opens the mobile application
- **THEN** the interface defaults the date to today and focuses on the amount input field, showing the device's native keyboard.

#### Scenario: Date toggle
- **WHEN** the user clicks the "Yesterday" quick selector
- **THEN** the date input field value changes to yesterday's date.
