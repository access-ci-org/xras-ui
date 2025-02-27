import {useState} from "react";
import Accordion from "react-bootstrap/Accordion";

const Publication = ({publication}) => {
  const [showAllAuthors, setShowAllAuthors] = useState(false);

  const getAuthorsToShow = () => {
    if (showAllAuthors) {
      return publication.authors;
    }

    return publication.authors.slice(0, 3);
  }

  const handleClick = () => {
    setShowAllAuthors(!showAllAuthors);
  }

  const authorsToDisplay = getAuthorsToShow

  const shouldShowEllipses = (index) => {
    const isLastAuthor = index === authorsToDisplay().length - 1
    const hasMoreAuthors = publication.authors.length > 3
    const isNotShowingAll = !showAllAuthors

    return isLastAuthor && hasMoreAuthors && isNotShowingAll
  }

  const cleanDOI = (doi) => {
    return doi.startsWith("https") ? doi.split("/").slice(3) : doi
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        <span className="fw-bold">{publication.title}</span>
        <br/>
        <span className="fst-italic">
            {authorsToDisplay().map((author, index) => (
              <small key={`author_${index}`}>
                {author.first_name} {author.last_name}
                {index < authorsToDisplay().length - 1 && ", "}
                {shouldShowEllipses(index) ? "..." : ""}
              </small>
            ))}
          <>
            {publication.authors.length > 3 && (
              <button onClick={handleClick}
                      className="btn"
                      style={{textTransform: "lowercase", textDecoration: "none", color: "white", backgroundColor: "inherit", border: "none"}}>
                {showAllAuthors ? "(See Less)" : "(See More)"}
              </button>
            )}
          </>
        </span>
      </div>
      <div className="card-body">
        <div className="row fw-bold border-bottom">
          <div className="col">
            <span className="mb-1 pb-0 tooltip-underline">Publication Type</span>
          </div>
          <div className="col">
            <span className="mb-1 pb-0">Publication Year</span>
          </div>
        </div>
        <div className="row">
          <div className="col">
            {publication.publication_type}
          </div>
          <div className="col">
            {publication.publication_year ? publication.publication_year : "N/A"}
          </div>
        </div>
        {(publication.doi || publication.journal.title) && (
          <Accordion flush className="mt-3 mb-1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                Additional Information
              </Accordion.Header>
              <Accordion.Body>
                <div className="row fw-bold border-bottom">
                  {publication.doi && (
                    <div className="col">
                      <span className="mb-1 pb-0">DOI</span>
                    </div>
                  )}
                  {publication.journal.title && (
                    <div className="col">
                      <span className="mb-1 pb-0">Journal</span>
                    </div>
                  )}
                </div>
                <div className="row">
                  {publication.doi && (
                    <div className="col">
                      <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        className='text-decoration-none'
                      >
                        {cleanDOI(publication.doi)}
                      </a>
                    </div>
                  )}
                  <div className="col">
                    {publication.journal.title && (
                      <div className="col">
                        {publication.journal.title}
                      </div>
                    )}
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>

          </Accordion>
        )}
      </div>
    </div>
  )
}

export default Publication;