import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AddNewModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
  buttonText?: string;
  cancelText?: string;
  canSave?: boolean;
};

export const AddNewModal = ({
  show,
  onClose,
  title,
  children,
  onSave,
  buttonText = "Save",
  cancelText = "Cancel",
  canSave = true,
}: AddNewModalProps) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            {cancelText}
          </Button>
          <Button onClick={onSave} disabled={!canSave}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
