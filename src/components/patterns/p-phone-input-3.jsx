import { PhoneInput } from "@/components/ui/phone-input.jsx";

export function Pattern() {
  return (
    <PhoneInput
      variant="lg"
      placeholder="Enter phone number"
      defaultCountry="US"
      value="+12125551234"
    />
  );
}
