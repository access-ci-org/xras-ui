import { useAtomValue, useSetAtom } from "jotai";
import InfiniteScroll from "../shared/InfiniteScroll";
import Publication from "./Publication";
import {
  getPublicationsAtom,
  pageAtom,
  publicationsAtom,
  publicationsLoadedAtom,
  usePaginationAtom,
} from "./atoms";

export default function PublicationsList({
  allowEdit = true,
  emptyMessage = "No matching publications.",
}: {
  allowEdit?: boolean;
  emptyMessage?: string;
}) {
  const { current, last } = useAtomValue(pageAtom);
  const publicationsLoaded = useAtomValue(publicationsLoadedAtom);
  const usePagination = useAtomValue(usePaginationAtom);
  const publications = useAtomValue(publicationsAtom);
  const getPublications = useSetAtom(getPublicationsAtom);

  if (publicationsLoaded && publications.length === 0) return <p>{emptyMessage}</p>;

  return (
    <InfiniteScroll
      isLoading={!publicationsLoaded}
      hasMore={usePagination && current < last}
      loadMore={() => getPublications()}
    >
      {publications.map((pub, i) => (
        <Publication
          allowEdit={allowEdit}
          key={pub.publication_id}
          publication={pub}
          last={i === publications.length - 1}
        />
      ))}
    </InfiniteScroll>
  );
}
