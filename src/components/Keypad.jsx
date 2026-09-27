/**
 * Zahlen-Tastatur für Touch-Geräte (Tablet/Kindertablet).
 */
export default function Keypad({ onDigit, onDelete, onSubmit, disabled }) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="keypad" role="group" aria-label="Zahlen-Tastatur">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          className="keypad__key"
          onClick={() => onDigit(String(digit))}
          disabled={disabled}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="keypad__key keypad__key--gray"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Letzte Ziffer löschen"
      >
        ⌫
      </button>
      <button
        type="button"
        className="keypad__key"
        onClick={() => onDigit('0')}
        disabled={disabled}
      >
        0
      </button>
      <button
        type="button"
        className="keypad__key keypad__key--ok"
        onClick={onSubmit}
        disabled={disabled}
        aria-label="Antwort abschicken"
      >
        ✓
      </button>
    </div>
  );
}
