import type { ReactNode } from "react";

export const validateForm = (
  publication: Record<string, unknown>,
  requiredPubFields: string[],
  requiredAuthFields: string[],
) => {
  let formValid = true;
  const missingFields: string[] = [];

  for (const field of requiredPubFields) {
    if (!publication[field]) {
      formValid = false;
      missingFields.push(field);
    }
  }

  const authors = (publication.authors as Record<string, unknown>[] | undefined) || [];

  for (const author of authors) {
    for (const authField of requiredAuthFields) {
      if (!author[authField]) {
        formValid = false;
        if (!missingFields.includes(authField)) {
          missingFields.push(authField);
        }
      }
    }
  }
  return { formValid, missingFields };
};

export const invalidFormAlert = (missingFields: string[]): ReactNode => {
  if (missingFields.length > 0) {
    return (
      <div role="alert">
        <p>Please provide the following information before submitting:</p>
        <ul>
          {missingFields.map((field) => (
            <li key={field}>{camelCaseToTitleCase(field)}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

export function camelCaseToTitleCase(camelCaseWord: string) {
  return camelCaseWord
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
