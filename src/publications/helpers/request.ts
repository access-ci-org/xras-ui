import type { Routes } from "../../shared/routes";
// Type-only, so it is erased at build time and no cycle reaches the bundle:
// `PublicationForm.tsx` imports this module for real, this module only borrows
// the value type the form declares. Leaving `PublicationFormValues` where it is
// beats moving it to `types.ts` and editing eight unrelated import sites.
import type { PublicationFormValues } from "../PublicationForm";
import type {
  EditableProject,
  PublicationAuthor,
  PublicationField,
  TagCategory,
} from "../types";

// The wire shape the Rails controller consumes. Named rather than left to
// inference so that a typo in a key is a compile error at the one place the
// payload is built, instead of a field the server quietly ignores. The open
// `Record` on `publication` is what lets `extraFields` in.
export type PublicationRequestPayload = {
  authenticity_token: string;
  publication: Record<string, unknown> & {
    publication_id?: number | string;
    publication_type: string;
    title: string;
    publication_year: string;
    publication_month: string;
    doi: string;
    peer_reviewed: boolean;
    fields: PublicationField[];
    access_staff_publication: boolean;
  };
  authors: (PublicationAuthor & { order: number })[];
  tags: TagCategory[];
  projects: EditableProject[];
  resources: { resource_id: number }[];
};

export type PublicationRequest = {
  url: string;
  method: "POST" | "PATCH";
  payload: PublicationRequestPayload;
};

// Payload construction and URL/method selection, split out of `onSubmit` so
// they are reachable without a network mock. Everything here is a pure function
// of its arguments; the CSRF token and the selected projects are passed in
// rather than read, because their sources (a `<meta>` tag and a jotai atom) are
// the parts that are not.
//
// `projects` is a parameter even though every other field comes off `value`:
// project selection lives in `selectedProjectsAtom`, not in the form.
export function buildPublicationRequest(
  value: PublicationFormValues,
  token: string,
  projects: EditableProject[],
  routes: Routes,
): PublicationRequest {
  const payload: PublicationRequestPayload = {
    authenticity_token: token,
    publication: {
      // Spread first, so a leftover DOI-lookup key that collides with one of
      // the form's own fields loses to the form. `extraFields` is whatever the
      // DOI response carried that `DoiSearch` did not map to a known field, so
      // a collision is possible in principle.
      ...value.extraFields,
      publication_id: value.publication_id,
      publication_type: value.publication_type,
      title: value.title,
      publication_year: value.publication_year,
      publication_month: value.publication_month,
      doi: value.doi,
      // `publications.peer_reviewed` is NOT NULL with no database default and
      // `publication_params` permits it, so leaving it out of the payload is a
      // guaranteed NotNullViolation on create. It has to be sent even though
      // nothing in the UI can change it.
      peer_reviewed: value.peer_reviewed,
      fields: value.fields,
      access_staff_publication: value.resourcesNoneSelected,
    },
    // `order: 0` on every author, i.e. author order is not actually sent; the
    // server has only the array order to go on. Preserved as-is - changing what
    // the payload means is not a refactor.
    authors: value.authors.map((a) => ({ ...a, order: 0 })),
    // Always empty. The form carries `value.tags`, but `Tags.tsx` is not
    // mounted anywhere, so there is never anything to send.
    tags: [],
    projects,
    resources: value.resourceIds.map((resource_id) => ({ resource_id })),
  };

  // One decision rather than the two same-condition ternaries this replaces:
  // an existing publication is updated in place, a new one is created.
  return value.publication_id
    ? { url: routes.publication_path(value.publication_id), method: "PATCH", payload }
    : { url: routes.publications_path(), method: "POST", payload };
}
