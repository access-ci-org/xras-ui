import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { dismissUpdatePublicationsNoticeAtom, showUpdatePublicationsAtom } from "./atoms";

export default function PublicationDismissPublicationsNotice() {
  const showUpdatePublications = useAtomValue(showUpdatePublicationsAtom);
  const dismissNotice = useSetAtom(dismissUpdatePublicationsNoticeAtom);

  if (!showUpdatePublications) return null;

  return (
    <Button
      onClick={(e) => {
        dismissNotice();
        e.currentTarget.blur();
      }}
    >
      I HAVE NO NEW PUBLICATIONS
    </Button>
  );
}
