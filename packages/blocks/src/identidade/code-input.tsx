import * as React from "react";

/* ------------------------------------------------------------------ */
/* Campo de codigo numerico                                            */
/* ------------------------------------------------------------------ */

export interface AuthCodeInputProps {
  /** Valor atual, somente digitos. */
  value: string;
  /** Recebe o novo valor a cada digito digitado. */
  onChange: (value: string) => void;
  /** Quantidade de caixas (padrao 6). */
  length?: number;
  disabled?: boolean;
  /** Rotulo do grupo para leitores de tela. */
  ariaLabel?: string;
  /** Chamado quando o codigo fica completo. */
  onComplete?: (value: string) => void;
}

/**
 * Campo de codigo em caixas separadas, controlado por um unico valor.
 * Aceita colar o codigo inteiro e navega entre as caixas com as setas.
 */
export function AuthCodeInput({
  value,
  onChange,
  length = 6,
  disabled,
  ariaLabel,
  onComplete,
}: AuthCodeInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = React.useState<string[]>(() =>
    Array.from({ length }, (_unused, i) => value[i] ?? ""),
  );

  React.useEffect(() => {
    setDigits(Array.from({ length }, (_unused, i) => value[i] ?? ""));
  }, [value, length]);

  const commit = (next: string[]) => {
    setDigits(next);
    const joined = next.join("");
    onChange(joined);
    if (onComplete && joined.length === length && !joined.includes(" ")) onComplete(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = digit;
    commit(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (key === "ArrowRight" && index < length -  1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    event.preventDefault();
    const next = Array.from({ length }, (_unused, i) => text[i] ?? "");
    commit(next);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div
      className="flex items-center gap-2"
      onPaste={handlePaste}
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digito ${index + 1} de ${length}`}
          className="bloco-mono h-12 w-11 rounded-[var(--r-md)] border border-border bg-surface-strong/60 text-center bloco-control-lg tracking-[0.08em] text-fg transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export default AuthCodeInput;
