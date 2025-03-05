export const cleanDOI = (doi) => {
  doi =  doi.startsWith("https") ? doi.split("https://doi.org/").join("") : doi
  return doi
}

const Publication = ({publication}) => {

  const fields = ["Publication Type", "Publication Year", "DOI", "Journal" ];
  const authors = publication.authors
    .map((author) => `${author.last_name}, ${author.first_name.substr(0,1)}.`)
    .join(', ')

  const citationStyle = {
    textIndent: "-50px",
    marginLeft: "50px"
  }

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
              href={`https://doi.org/${cleanDOI(publication.doi)}`}
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

  const buildCitation = () => {
    const year = getFieldContent("Publication Year");
    let title = publication.title;
    const journal = getFieldContent("Journal");
    const doi = getFieldContent("DOI");

    if(title[title.length - 1]  != '.') title += ".";

    if(publication.publication_type == "Journal Paper"){
      return (
        <>
          { authors } ({year}). {title}
          { journal ? <em className="ms-1">{journal}.</em> : ''}
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    return "";

  }


  return (
    <div className="col-12 mb-2">
      <div className="card" style={{ borderRadius: '0.375rem' }}>
        <div className="card-body pt-2">
          <p style={citationStyle}>
            { buildCitation() }
          </p>
          <span>
            <a href="">Link To Project</a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Publication;