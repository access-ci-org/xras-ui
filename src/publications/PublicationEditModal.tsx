import { useAtomValue, useSetAtom } from "jotai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PublicationEdit from "./PublicationEdit";
import { publicationIdAtom, showEditModalAtom } from "./atoms";

export default function PublicationEditModal() {
  const show = useAtomValue(showEditModalAtom);
  const setShow = useSetAtom(showEditModalAtom);
  const publicationId = useAtomValue(publicationIdAtom);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && setShow(false)}>
      <DialogContent className="max-w-[1140px]">
        <DialogHeader>
          <DialogTitle>{publicationId ? "Edit" : "Add"} Publication</DialogTitle>
        </DialogHeader>
        <PublicationEdit />
      </DialogContent>
    </Dialog>
  );
}
