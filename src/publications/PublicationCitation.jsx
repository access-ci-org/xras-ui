const doiRegexp = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

export const cleanDOI = (doi) => {
  const doiMatch = (doi || "").match(doiRegexp);
  return doiMatch ? doiMatch[0] : null;
};

export default function PublicationCitation({ publication }) {
  const {
    authors: authorsList,
    doi,
    fields,
    publication_type: pubType,
    publication_year: pubYear,
    title: pubTitle,
  } = publication;
  const {
    "Journal name": journal,
    Pages: pages,
    Publisher: publisher,
    "Volume/Issue": volume,
  } = fields;
  const authors = authorsList
    .map((author) => `${author.last_name}, ${author.first_name.substr(0, 1)}.`)
    .join(", ");
  const year = pubYear || "N/A";
  const title = pubTitle.endsWith(".") ? pubTitle : `${pubTitle}.`;
  const cleanedDOI = cleanDOI(doi);
  const doiLink = cleanedDOI ? (
    <a href={`https://doi.org/${cleanedDOI}`} target="_blank" rel="noreferrer">
      {cleanedDOI}
    </a>
  ) : null;

  if (["Journal Paper", "Other"].includes(pubType))
    return (
      <>
        {authors} ({year}). {title} {journal && <em>{journal}.</em>}{" "}
        {volume && <>{volume},</>} {pages && <>{pages}.</>} {doiLink}
      </>
    );

  if (["Conference Paper", "Software"].includes(pubType))
    return (
      <>
        {authors} ({year}). {title} {journal && <em>{journal}.</em>} {doiLink}
      </>
    );

  if (["Book", "Book Chapter"].includes(pubType))
    return (
      <>
        {authors} ({year}). <em>{title}</em>{" "}
        {publisher && <em>{publisher}.</em>} {doiLink}
      </>
    );

  if (pubType === "Dataset")
    return (
      <>
        {authors} ({year}).
        <em>{title}</em> [Dataset]. {publisher}. {doiLink}
      </>
    );

  if (pubType === "Dissertation")
    return (
      <>
        {authors} ({year}). <em>{title}</em>. [Doctoral dissertation
        {publisher && <>, {publisher}</>}]. {doiLink}
      </>
    );
}
