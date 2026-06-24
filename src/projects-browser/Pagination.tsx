import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { getProjectsAtom, pageDataAtom, updatePageDataAtom } from "./atoms";

type PageLink = number | "spacer" | ["current", number];

const linkClass = "flex h-10 w-[50px] items-center justify-center border text-center";

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
  }, [pageData]);

  const pageLink = (link: PageLink) => {
    if (link === "spacer") {
      return (
        <span className={cn(linkClass, "cursor-default text-muted-foreground")}>. . .</span>
      );
    }

    if (Array.isArray(link)) {
      return <span className={cn(linkClass, "bg-primary text-primary-foreground")}>{link[1]}</span>;
    }

    return (
      <button type="button" className={linkClass} onClick={() => handleGetPage(link)}>
        {link}
      </button>
    );
  };

  return (
    <nav aria-label="Pages for the table">
      <ul className="flex flex-wrap">
        <li>
          <button
            type="button"
            className={cn(linkClass, "disabled:cursor-not-allowed disabled:opacity-50")}
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
              className={cn(linkClass, "h-10")}
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
            className={cn(linkClass, "disabled:cursor-not-allowed disabled:opacity-50")}
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
