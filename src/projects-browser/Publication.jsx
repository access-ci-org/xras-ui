export const cleanDOI = (doi) => {
  doi =  doi.startsWith("https") ? doi.split("https://doi.org/").join("") : doi
  return doi
}

const Publication = ({publication, index, fontSize="18px"}) => {

  const fields = ["Publication Type", "Publication Year", "DOI", "Journal", "Volume/Issue", "Pages" ];
  const authors = publication.authors
    .map((author) => `${author.last_name}, ${author.first_name.substring(0,1)}.`)
    .join(', ')
  const grant_numbers = publication.projects
    .map((project) => project.grant_number)
  const publication_type = publication.publication_type === 'Other' ? 'Publication' : publication.publication_type;

  const projects = publication.projects;

  const bgColor = index % 2 == 0 ? 'bg-light' : '';

  const citationStyle = {
    textIndent: "-50px",
    marginLeft: "50px",
    fontSize: fontSize
  }
  const pub_datas = publication.publication_datas ?? []

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
      case "Volume/Issue":
        return pub_datas["Volume/Issue"] ? pub_datas["Volume/Issue"] : false;
      case "Pages":
        return pub_datas["Pages"] ? pub_datas["Pages"] : false;
      case "Publisher":
        return pub_datas["Publisher"] ? pub_datas["Publisher"] : false;
    }
  }

  const buildCitation = () => {
    const year = getFieldContent("Publication Year");
    let title = publication.title;
    const journal = getFieldContent("Journal");
    const doi = getFieldContent("DOI");
    const volume = getFieldContent("Volume/Issue");
    const pages = getFieldContent("Pages");
    const publisher = getFieldContent("Publisher")

    if(title[title.length - 1]  != '.') title += ".";

    if(publication.publication_type === "Journal Paper" || (publication.publication_type === 'Other')) {
      return (
        <>
          { authors } ({year}). {title}
          { journal ? <em className="ms-1">{journal}.</em> : ''}
          { volume ?  <span className="ms-1">{volume},</span> : ''}
          { pages ?  <span className="ms-1">{pages}.</span> : ''}
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    if ((publication.publication_type === 'Conference Paper') || (publication.publication_type === 'Software')) {
      return(
        <>
          { authors } ({year}). {title}
          { journal ? <em className="ms-1">{journal}.</em> : ''}
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    if ((publication.publication_type === 'Book') || (publication.publication_type === 'Book Chapter')) {
      return(
        <>
          { authors } ({year}).
          { <em className="ms-1">{title}</em>}
          { publisher ? <em className="ms-1">{publisher}.</em> : ''}
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    if (publication.publication_type === 'Dataset') {
      return(
        <>
          { authors } ({year}).
          { <em className="ms-1">{title}</em>}
          {' [Dataset]. '}
          { publisher ? publisher : ''}.
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    if (publication.publication_type === 'Dissertation') {
      return(
        <>
          { authors } ({year}).
          { <em className="ms-1">{title}</em>}.
          [Doctoral dissertation{ publisher ? ", " + publisher : ''}].
          { doi ? <span className="ms-1">{doi}</span> : ''}
        </>
      );
    }

    return "";

  }


    return (
      <div className="col-12 mb-2 border-bottom">
        <div className="card" style={{ border: "unset" }}>
          <div className={`card-body pt-2 mb-2 ${bgColor}`}>
            <p style={citationStyle}>
              { buildCitation() }
            </p>
            {projects.length > 0 && (
              <>
                <p className="text-decoration-underline mb-2">Projects Supporting this {publication_type}</p>
                <ul style={{ ...citationStyle, listStyleType: "none" }}>
                  {grant_numbers.map((grant, index) => (
                    <li key={`grant_${index}`} id={`project_${index}`} >
                      <a
                        href={`https://allocations.access-ci.org/current-projects?_requestNumber=${grant}`}
                        id={`grant_link${index}`}
                        target="_blank"
                        style={{ fontWeight: '600' }}
                      >
                        {grant}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    )
}

export default Publication;