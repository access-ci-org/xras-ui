const Publication = ({publication}) => {

  const cleanDOI = (doi) => {
    return doi.startsWith("https") ? doi.split("/").slice(3) : doi
  }

  const fields = ["Publication Type", "Publication Year", "DOI", "Journal" ];

  const getFieldContent = (field) => {
    switch (field) {
      case "Publication Type":
        return publication.publication_type;
      case "Publication Year":
        return publication.publication_year ? publication.publication_year : "N/A";
      case "DOI":
        if(!publication.doi) return false;
        return(
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              className='fw-normal'
            >
              {cleanDOI(publication.doi)}
            </a>
        )
      case "Journal":
        return publication.journal.title ? publication.journal.title : false;
    }
  }

  const renderField = (field) => {
    const content = getFieldContent(field);
    if(!content) return "";

    return (
      <div className="col-12 col-md-6 mb-2" key={`field_${field}_${publication.publication_id}`}>
        <div className="row fw-bold">
          <div className="col">
            <span className="mb-1 pe-3 border-bottom">{field}</span>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <span className="mb-1 pb-0">
              { content }
            </span>
          </div>
        </div>
      </div>
    )
  }

  const authors = publication.authors
    .map((author) => `${author.last_name}, ${author.first_name}`)
    .join(',')

  return (
    <div className="col-12 mb-2">
      <div className="card" style={{ borderRadius: '0.375rem' }}>
        <div className="card-header bg-primary text-white">
          <span className="fw-bold">{publication.title}</span>
        </div>
        <div className="card-body pt-2">
          <div className="row fw-bold">
            <div className="col">
              <span className="mb-1 pb-0 pe-3 border-bottom">Authors</span>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col">
              { authors }
            </div>
          </div>
          <div className="row">
            { fields.map((field) => renderField(field) )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Publication;