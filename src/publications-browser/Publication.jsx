export const cleanDOI = (doi) => {
  doi =  doi.startsWith("https") ? doi.split("https://doi.org/").join("") : doi
  return doi
}

const Publication = ({publication}) => {

  const fields = ["Publication Type", "Publication Year", "DOI", "Journal", "Volume/Issue", "Pages" ];
  const authors = publication.authors
    .map((author) => `${author.last_name}, ${author.first_name.substr(0,1)}.`)
    .join(', ')
  const grant_numbers = publication.projects
    .map((project) => project.grant_number)

  const citationStyle = {
    textIndent: "-50px",
    marginLeft: "50px"
  }

  const pub_datas = publication.publication_datas

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
    const volume = getFieldContent("Volume/Issue");
    const pages = getFieldContent("Pages");
    const publisher = getFieldContent("Publisher")

    if(title[title.length - 1]  != '.') title += ".";

    if(publication.publication_type === "Journal Paper" || (publication.publication_type === 'Other')) {
      return (
        <>
          { authors } ({year}). {title}
          { journal ? <em className="ms-1">{journal}.</em> : ''}
          { volume ?  <span className="ms-1">{volume}</span> : ''}
          { pages ?  <span className="ms-1">,{pages}</span> : ''}
          { doi ? <span className="ms-1">.{doi}</span> : ''}
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

    if (publication.publication_type === 'Book') {
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
          [Dataset].
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
    <div className="col-12 mb-2">
      <div className="card" style={{ borderRadius: '0.375rem' }}>
        <div className="card-body pt-2">
          <p style={citationStyle}>
            { buildCitation() }
          </p>
          {grant_numbers.map((grant, index) => (
          <div key={`grant_${index}`} id={`project_${index}`} >
            <a
              href={`https://allocations.access-ci.org/current-projects?_requestNumber=${grant}`}
              id={`grant_link${index}`}
            >
              Link To Project {grant}
            </a>
          </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Publication;