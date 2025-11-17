import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPageData,
  getProjects,
  updatePageData,
} from "./helpers/browserSlice";
import style from "./Pagination.module.scss";

const Pagination = () => {
  const dispatch = useDispatch();
  const pageData = useSelector(selectPageData);

  const [pageLinks, setPageLinks] = useState([]);
  const [manualPage, setManualPage] = useState("0");
  const pageNumbers = Array.from(
    { length: pageData.last_page },
    (value, index) => index
  );
  const pageBreak = 10;
  const linkStyle = { width: "50px", textAlign: "center" };

  useEffect(() => {
    buildPaginator();
  }, [pageData]);

  const handleGetPage = (page) => {
    const pageNumber = parseInt(page);
    dispatch(updatePageData({ current_page: page }));
    dispatch(getProjects(pageNumber));
  };

  const goToPage = (page) => {
    event.preventDefault();
    setManualPage("0");
    handleGetPage(page);
    return false;
  };

  const nextPage = () => {
    handleGetPage(parseInt(pageData.current_page) + 1)
  }

  const prevPage = () => {
    handleGetPage(parseInt(pageData.current_page) - 1)
  }

  const buildPaginator = () => {
    const pages = [];

    if (pageData.last_page > pageBreak) {
      if (pageData.current_page > 4) {
        pages.push(1);
        pages.push("spacer");

        for (var i = 1; i > 0; i--) {
          if (pageData.current_page - i > 1) {
            pages.push(pageData.current_page - i);
          }
        }

        pages.push(["current", pageData.current_page]);

        for (var i = 1; i < 2; i++) {
          if (pageData.current_page + i <= pageData.last_page) {
            pages.push(pageData.current_page + i);
          }
        }

        if (pageData.last_page - pageData.current_page > 1) {
          pages.push("spacer");
          pages.push(pageData.last_page);
        }
      } else {
        [1, 2, 3, 4, 5].forEach((i) => {
          i == pageData.current_page
            ? pages.push(["current", i])
            : pages.push(i);
        });
        pages.push("spacer");
        pages.push(pageData.last_page);
      }
    } else {
      for (var i = 1; i <= pageData.last_page; i++) {
        i == pageData.current_page ? pages.push(["current", i]) : pages.push(i);
      }
    }

    setPageLinks(pages);
  };

  const pageLink = (page) => {
    let label = "";

    if (typeof page === "object") {
      [page, label] = page;
    } else {
      label = page;
    }

    if (page == "spacer") {
      return (
        <li className="page-item disabled">
          <span className={`page-link`} style={linkStyle}>. . .</span>
        </li>
      );
    }

    if (page == "current") {
      return (
        <li className="page-item active" aria-current="page">
          <span className={`page-link`} style={linkStyle}>{label}</span>
        </li>
      );
    }

    return (
      <li className="page-item">
        <button
          className={`page-link`}
          style={linkStyle}
          onClick={() => handleGetPage(page)}
        >
          {label}
        </button>
      </li>
    );
  };

  const pageJump = () => {
    return (
      <li className="page-item">
        <select
          className={`page-link`}
          style={{ ...linkStyle, height: "100%" }}
          value={manualPage}
          onChange={(e) => goToPage(e.target.value)}
        >
          <option value={"0"}>Go To</option>
          {pageNumbers.map((p) => (
            <option key={`page_option_${p}`} value={p + 1}>
              {p + 1}
            </option>
          ))}
        </select>
      </li>
    );
  };

  return (
    <div>
      <nav aria-label="Pages for the table">
        <ul className="pagination">
          <li
            className={`page-item ${
              pageData.current_page == 1 ? "disabled" : ""
            }`}
          >
            <button
              className={`page-link`}
              style={{ width: "50px", textAlign: "center" }}
              onClick={prevPage}
              disabled={pageData.current_page == 1}
              aria-label="Previous Page Button"
            >
              &lt;
            </button>
          </li>
          {pageLinks.map((link, index) => (
            <React.Fragment key={`page_${index}`}>
              {pageLink(link)}
            </React.Fragment>
          ))}

          {pageData.last_page > pageBreak ? pageJump() : ""}

          <li
            className={`page-item ${
              pageData.current_page == pageData.last_page ? "disabled" : ""
            }`}
          >
            <button
              className={`page-link`}
              style={linkStyle}
              onClick={nextPage}
              disabled={pageData.current_page == pageData.last_page}
              aria-label="Next Page Button"
            >
              &gt;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
