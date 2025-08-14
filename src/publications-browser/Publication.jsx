import PublicationCitation from "./PublicationCitation";

const citationStyle = {
  textIndent: "-50px",
  marginLeft: "50px",
};

const Publication = ({ publication, index }) => {
  const { projects, publication_type: pubType } = publication;
  const grant_numbers = projects.map((project) => project.grant_number);
  const bgColor = index % 2 == 0 ? "bg-light" : "";

  return (
    <div className="col-12 mb-2 border-bottom">
      <div className="card" style={{ border: "unset" }}>
        <div className={`card-body pt-2 mb-2 ${bgColor}`}>
          <p style={citationStyle}>
            <PublicationCitation publication={publication} />
          </p>
          {projects.length > 0 && (
            <>
              <p className="text-decoration-underline mb-2">
                Projects Supporting this{" "}
                {pubType === "Other" ? "Publication" : pubType}
              </p>
              <ul style={{ ...citationStyle, listStyleType: "none" }}>
                {grant_numbers.map((grant, index) => (
                  <li key={`grant_${index}`} id={`project_${index}`}>
                    <a
                      href={`https://allocations.access-ci.org/current-projects?_requestNumber=${grant}`}
                      id={`grant_link${index}`}
                      target="_blank"
                      rel="noreferrer"
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
  );
};

export default Publication;
