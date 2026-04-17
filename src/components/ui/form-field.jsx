import { Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

/**
 * FormField — wrapper around react-hook-form Controller to reduce boilerplate.
 *
 * Usage:
 *   <FormField
 *     name="email"
 *     control={control}
 *     label="Email"
 *     render={({ field, fieldState }) => (
 *       <Input {...field} aria-invalid={!!fieldState.error} />
 *     )}
 *   />
 */
function FormField({
  name,
  control,
  label,
  labelProps = {},
  fieldProps = {},
  render,
}) {
  return (
    <Field {...fieldProps}>
      {label && (
        <FieldLabel htmlFor={name} {...labelProps}>
          {label}
        </FieldLabel>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <>
            {render({ field, fieldState })}
            {fieldState.error && (
              <FieldError errors={[fieldState.error]} />
            )}
          </>
        )}
      />
    </Field>
  );
}

export { FormField };
