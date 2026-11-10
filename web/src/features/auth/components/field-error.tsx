export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-destructive text-sm" role="alert">
      {errors[0]}
    </p>
  );
}
