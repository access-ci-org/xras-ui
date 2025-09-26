import { useDispatch, useSelector } from "react-redux";
import {
  getPublications,
  selectPage,
  selectPublications,
  selectPublicationsLoaded,
  selectUsePagination,
} from "./helpers/publicationsSearchSlice.js";

import InfiniteScroll from "../shared/InfiniteScroll.jsx";
import Publication from "./Publication";

export default function PublicationsList() {
  const dispatch = useDispatch();
  const { current, last } = useSelector(selectPage);
  const publicationsLoaded = useSelector(selectPublicationsLoaded);
  const usePagination = useSelector(selectUsePagination);

  const publications = useSelector(selectPublications);
  if (publicationsLoaded && publications.length === 0)
    return <div>No matching publications.</div>;

  return (
    <>
      <InfiniteScroll
        isLoading={!publicationsLoaded}
        hasMore={usePagination && current < last}
        loadMore={() => dispatch(getPublications())}
      >
        {publications.map((pub) => (
          <Publication key={pub.publication_id} publication={pub} />
        ))}
      </InfiniteScroll>
    </>
  );
}
