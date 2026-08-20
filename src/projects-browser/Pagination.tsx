import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { getProjectsAtom, pageDataAtom, updatePageDataAtom } from "./atoms";

type PageLink = number | "spacer" | ["current", number];

/*
 * Bootstrap's `.page-link`, at the 50px width the old markup set inline: a
 * block with 0.375rem / 0.75rem of padding around one body-copy line — 38px
 * tall in all — the theme's link teal on white, and a 1px border it shares
 * with its neighbour (see the `-ml-px` in `LIST` below).
 */
const linkClass = "block w-[50px] border bg-background px-3 py-1.5 text-center leading-6 text-teal-600";

/* Bootstrap greys a disabled `.page-item` out with `--bs-secondary-bg`. */
const disabledClass = "bg-[#e9ecef] text-[#212529]/75";

/*
 * `.pagination` is a flex `ul` — one that keeps the reboot's bottom margin —
 * whose links overlap by their shared border, leaving only the two ends of the
 * strip rounded.
 */
const LIST =
  "mb-4 flex flex-wrap [&>li:first-child>*]:rounded-l-md [&>li:last-child>*]:rounded-r-md [&>li:not(:first-child)>*]:-ml-px";

const Pagination = () => {
  const pageData = useAtomValue(pageDataAtom);
  const updatePageData = useSetAtom(updatePageDataAtom);
  const getProjects = useSetAtom(getProjectsAtom);

  const [pageLinks, setPageLinks] = useState<PageLink[]>([]);
  const [manualPage, setManualPage] = useState("0");
  const pageNumbers = Array.from({ length: pageData.last_page }, (_, index) => index);
  const pageBreak = 10;

  const handleGetPage = (page: number) => {
    updatePageData({ current_page: page });
    getProjects();
  };

  const goToPage = (page: string) => {
    setManualPage("0");
    handleGetPage(parseInt(page));
  };

  const nextPage = () => handleGetPage(pageData.current_page + 1);
  const prevPage = () => handleGetPage(pageData.current_page - 1);

  const buildPaginator = () => {
    const pages: PageLink[] = [];

    if (pageData.last_page > pageBreak) {
      if (pageData.current_page > 4) {
        pages.push(1);
        pages.push("spacer");

        if (pageData.current_page - 1 > 1) {
          pages.push(pageData.current_page - 1);
        }

        pages.push(["current", pageData.current_page]);

        if (pageData.current_page + 1 <= pageData.last_page) {
          pages.push(pageData.current_page + 1);
        }

        if (pageData.last_page - pageData.current_page > 1) {
          pages.push("spacer");
          pages.push(pageData.last_page);
        }
      } else {
        [1, 2, 3, 4, 5].forEach((i) => {
          pages.push(i == pageData.current_page ? ["current", i] : i);
        });
        pages.push("spacer");
        pages.push(pageData.last_page);
      }
    } else {
      for (let i = 1; i <= pageData.last_page; i++) {
        pages.push(i == pageData.current_page ? ["current", i] : i);
      }
    }

    setPageLinks(pages);
  };

  useEffect(() => {
    buildPaginator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  const pageLink = (link: PageLink) => {
    if (link === "spacer") {
      return <span className={cn(linkClass, disabledClass)}>. . .</span>;
    }

    if (Array.isArray(link)) {
      return (
        <span className={cn(linkClass, "border-primary bg-primary text-primary-foreground")}>
          {link[1]}
        </span>
      );
    }

    return (
      <button type="button" className={linkClass} onClick={() => handleGetPage(link)}>
        {link}
      </button>
    );
  };

  return (
    <nav aria-label="Pages for the table">
      <ul className={LIST}>
        <li>
          <button
            type="button"
            className={cn(linkClass, "disabled:pointer-events-none disabled:bg-[#e9ecef] disabled:text-[#212529]/75")}
            onClick={prevPage}
            disabled={pageData.current_page == 1}
            aria-label="Previous Page Button"
          >
            &lt;
          </button>
        </li>
        {pageLinks.map((link, index) => (
          <li key={`page_${index}`}>{pageLink(link)}</li>
        ))}

        {pageData.last_page > pageBreak && (
          <li>
            <select
              className={cn(linkClass, "h-[38px]")}
              value={manualPage}
              onChange={(e) => goToPage(e.target.value)}
            >
              <option value="0">Go To</option>
              {pageNumbers.map((p) => (
                <option key={`page_option_${p}`} value={p + 1}>
                  {p + 1}
                </option>
              ))}
            </select>
          </li>
        )}

        <li>
          <button
            type="button"
            className={cn(
              linkClass,
              "disabled:pointer-events-none disabled:bg-[#e9ecef] disabled:text-[#212529]/75",
            )}
            onClick={nextPage}
            disabled={pageData.current_page == pageData.last_page}
            aria-label="Next Page Button"
          >
            &gt;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
