import React, { useEffect, useState } from "react";
import { Input, InputGroup, InputProps } from "reactstrap";
import tnFlag from "../../assets/images/flags/tn.svg";
import dzFlag from "../../assets/images/flags/dz.svg";
import {
  PhoneCountry,
  PHONE_COUNTRIES,
  convertPhoneCountry,
  detectPhoneCountry,
  formatPhoneInput,
} from "../../helpers/phone_helper";

const FLAGS: Partial<Record<PhoneCountry, string>> = { TN: tnFlag, DZ: dzFlag };
const COUNTRIES: PhoneCountry[] = ["TN", "DZ", "OT"];

interface PhoneInputProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  value?: string | null;
  onChange: (value: string) => void;
  defaultCountry?: PhoneCountry;
}

/**
 * Phone field with a Tunisia / Algeria / Autre switch. Tunisia and Algeria
 * format the value as it is typed ("22 222 222", "0555 12 34 56"); "Autre" is
 * a plain field — nothing is grouped or capped in length beyond the column
 * itself, for a foreign number or anything that doesn't fit the other two.
 */
const PhoneInput = ({
  value,
  onChange,
  defaultCountry = "TN",
  bsSize,
  placeholder,
  ...inputProps
}: PhoneInputProps) => {
  const [country, setCountry] = useState<PhoneCountry>(
    () => detectPhoneCountry(value) ?? defaultCountry
  );

  // Follow the number when it is loaded from a client, pasted with a +216/+213
  // prefix, typed with a leading 0 (always Algerian), or grown past either
  // shape (falls into "Autre" on its own). "Autre" itself is sticky, though:
  // once picked — by hand or by outgrowing TN/DZ — only the buttons below
  // switch back, so a number that happens to shrink back to eight digits
  // isn't suddenly reformatted out from under the person typing it.
  useEffect(() => {
    const detected = detectPhoneCountry(value);
    if (!detected) return;
    setCountry((current) => (current === "OT" ? current : detected));
  }, [value]);

  const selectCountry = (next: PhoneCountry) => {
    setCountry(next);
    if (value) onChange(convertPhoneCountry(value, next));
  };

  return (
    <InputGroup size={bsSize === "lg" || bsSize === "sm" ? bsSize : undefined}>
      {COUNTRIES.map((code) => {
        const active = code === country;
        const flag = FLAGS[code];
        const { label, dialCode } = PHONE_COUNTRIES[code];
        return (
          <button
            key={code}
            type="button"
            className={`btn d-flex align-items-center gap-1 ${active ? "btn-primary" : "btn-light"}`}
            style={active ? undefined : { opacity: 0.6 }}
            title={dialCode ? `${label} (${dialCode})` : label}
            aria-pressed={active}
            disabled={inputProps.disabled}
            onClick={() => selectCountry(code)}
          >
            {flag ? (
              <img src={flag} alt={label} width={18} height={18} className="rounded-circle" />
            ) : (
              <i className="ri-global-line fs-15" aria-hidden="true"></i>
            )}
            {dialCode && <span className="fs-12">{dialCode}</span>}
          </button>
        );
      })}
      <Input
        {...inputProps}
        type="tel"
        inputMode="tel"
        bsSize={bsSize}
        value={value || ""}
        placeholder={placeholder ?? PHONE_COUNTRIES[country].placeholder}
        onChange={(e) => onChange(formatPhoneInput(e.target.value, country))}
      />
    </InputGroup>
  );
};

export default PhoneInput;
