import { useSelector } from "react-redux";
import { selectPublications } from "./helpers/publicationsSlice.js";
import Publication from "./Publication"

const ProjectList = () => {
  const publications = useSelector(selectPublications);
  if(publications.length === 0) return <div>No Publications Found</div>
  return (
    <div>
      {publications.map((pub, index) => (
          <Publication key={`publication_${index}`} publication={pub} index={index} />
      ))}
    </div>
  );
};

export default ProjectList;
