import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  addCreatedByUsername,
  removeCreatedByUsername,
} from "./helpers/publicationsSearchSlice";

import PublicationsGrid from "./PublicationsGrid";

export default function PublicationsSelect() {
  const dispatch = useDispatch();
  // Attach event listeners to detect when users are added to
  // or removed from the request.
  useEffect(() => {
    addEventListener("requestAddRole", (e) =>
      dispatch(addCreatedByUsername(e.detail.username)),
    );
    addEventListener("requestRemoveRole", (e) =>
      dispatch(removeCreatedByUsername(e.detail.username)),
    );
  }, [dispatch]);

  return <PublicationsGrid allowSelect={true} />;
}
