import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADMIN_BODY,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_SUCCESS,
  ADMIN_MODAL,
  ADMIN_MODAL_BODY,
  ADMIN_MODAL_CLOSE,
  ADMIN_MODAL_FOOTER,
  ADMIN_MODAL_HEADER,
  ADMIN_MODAL_TITLE,
} from "../shared/adminTheme";

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

/*
 * The header is assembled here rather than with `DialogHeader`, whose own close
 * button is the ACCESS theme's: this one is Bootstrap 2's red `×`.
 */
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
      <DialogContent
        className={cn(ADMIN_BODY, ADMIN_MODAL)}
        overlayClassName="bg-black/80"
      >
        <div className={ADMIN_MODAL_HEADER}>
          <DialogTitle className={ADMIN_MODAL_TITLE}>{title}</DialogTitle>
          <DialogClose className={ADMIN_MODAL_CLOSE} aria-label="Close">
            <span aria-hidden="true">×</span>
          </DialogClose>
        </div>
        <DialogBody className={ADMIN_MODAL_BODY}>{children}</DialogBody>
        <DialogFooter className={ADMIN_MODAL_FOOTER}>
          <button type="button" className={ADMIN_BTN_DANGER} onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={cn(ADMIN_BTN_SUCCESS, "ml-[5px]")}
            onClick={onSave}
            disabled={!canSave}
          >
            {buttonText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
