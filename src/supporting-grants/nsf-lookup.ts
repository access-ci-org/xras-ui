export interface NSFAwardDetails {
  title?: string;
  pdPIName?: string;
  startDate?: string;
  expDate?: string;
  fundsObligatedAmt?: string;
  poName?: string;
  poEmail?: string;
}

export async function fetchNSFGrantDetails(
  grantNumber: string,
): Promise<NSFAwardDetails | null> {
  const res = await fetch(
    `https://www.research.gov/awardapi-service/v1/awards/${grantNumber}.json?printFields=id,title,agency,poName,poEmail,pdPIName,startDate,expDate,fundsObligatedAmt`,
  );
  if (res.status !== 200) return null;
  const data = await res.json();
  return data.response?.award?.length ? data.response.award[0] : null;
}

// NSF dates come back as MM/DD/YYYY; convert to the YYYY-MM-DD format used
// by the rest of the form.
export function nsfDateToIso(value: string): string {
  const parts = value.split("/");
  const year = parts.pop();
  if (!year) return value;
  return [year, ...parts].join("-");
}
