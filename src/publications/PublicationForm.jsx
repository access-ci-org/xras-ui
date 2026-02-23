import { useDispatch, useSelector } from "react-redux";
import DoiSearch from "./DoiSearch";
import {
  changePublicationType,
  getFormValid,
  getPublication,
  getPubTypes,
  getSaveEnabled,
  savePublication,
  setFormValid,
  updateField,
  updatePublication,
} from "./helpers/publicationEditSlice";

import Authors from "./Authors";
import InfoTip from "../shared/InfoTip";
import Projects from "./Projects";
import ProjectSearch from "./ProjectSearch";
import Resources from "./Resources";

const START_YEAR = 1980;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalizePublicationYear = (value) => {
  return value == null ? "" : `${value}`;
};

const normalizePublicationMonth = (value) => {
  if (value == null || value === "") return "";

  const numericMonth = Number(value);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return `${numericMonth}`;
  }

  const normalizedMonth = `${value}`.trim().toLowerCase();
  const monthIndex = MONTHS.findIndex(
    (month) => month.toLowerCase() === normalizedMonth,
  );
  return monthIndex >= 0 ? `${monthIndex + 1}` : "";
};

export default function PublicationForm() {
  const dispatch = useDispatch();
  const publication = useSelector(getPublication);
  const publicationTypes = useSelector(getPubTypes);
  const saveEnabled = useSelector(getSaveEnabled);
  const formValid = useSelector(getFormValid);

  const updateTitle = (e) => {
    dispatch(setFormValid(e.target.value.trim() !== ""));
    dispatch(updatePublication({ key: "title", value: e.target.value }));
  };

  const dynamicFields = () => {
    return publication.fields.map((f, idx) => (
      <div key={`field_${f.csl_field_name}`} className={"row mb-3"}>
        <div className={"col"}>
          <label htmlFor={`field_${f.csl_field_name}`} className="form-label">
            {f.name}
          </label>
          <input
            type={"text"}
            className={"form-control"}
            name={`field_${f.csl_field_name}`}
            id={`field_${f.csl_field_name}`}
            value={f.field_value || ""}
            onChange={(e) =>
              dispatch(updateField({ index: idx, value: e.target.value }))
            }
          />
        </div>
      </div>
    ));
  };

  const fixedFields = () => {
    const lastYear = new Date().getFullYear() + 2;
    const years = Array.from(
      { length: lastYear - START_YEAR + 1 },
      (_, idx) => START_YEAR + idx,
    );

    const publicationYearValue = normalizePublicationYear(
      publication.publication_year,
    );
    const publicationMonthValue = normalizePublicationMonth(
      publication.publication_month,
    );

    const reqIcon = <i className="bi bi-asterisk text-danger"></i>;

    return (
      <>
        <div className={"row mb-3"}>
          <div className={"col"}>
            <label className={"form-label"} htmlFor={"publication_title"}>
              Title {reqIcon}
            </label>
            <input
              name={"publication_title"}
              id={"publication_title"}
              type={"text"}
              className={`form-control ${formValid ? "" : "is-invalid"}`}
              value={publication.title || ""}
              onChange={updateTitle}
            />
          </div>
        </div>

        <div className={"row mb-3"}>
          <div className={"col"}>
            <label className={"form-label"} htmlFor={"publication_year"}>
              Year Published
            </label>
            <select
              name={"publication_year"}
              id={"publication_year"}
              className={"form-control"}
              value={publicationYearValue}
              onChange={(e) => {
                dispatch(updatePublication({
                  key: "publication_year",
                  value: e.target.value,
                }));
              }}
            >
              <option value="">Select a year</option>
              {years.map((year) => (
                <option key={`year_${year}`} value={`${year}`}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={"row mb-3"}>
          <div className={"col"}>
            <label className={"form-label"} htmlFor={"publication_month"}>
              Month Published
            </label>
            <select
              name={"publication_month"}
              id={"publication_month"}
              className={"form-control"}
              value={publicationMonthValue}
              onChange={(e) => {
                dispatch(updatePublication({
                  key: "publication_month",
                  value: e.target.value,
                }));
              }}
            >
              <option value="">Select a month</option>
              {MONTHS.map((month, idx) => (
                <option key={`month_${idx}`} value={`${idx + 1}`}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  };

  const publicationInformation = (
    <div className={"card"}>
      <div className={"card-header"}>
        <h2>Publication Information</h2>
      </div>
      <div className={"card-body"}>
        <p className={"mb-2"}>
          Enter information about this publication below. If you have a DOI, you
          may use the &quot;Lookup Publication&quot; button to attempt to find
          this information automatically.
        </p>

        <DoiSearch />

        <div className={"row mb-3"}>
          <div className={"col"}>
            <label htmlFor={"publication_type"} className={"form-label"}>
              Publication Type
            </label>
            <select
              name={"publication[publication_type]"}
              id={"publication_type"}
              className={"form-control"}
              value={publication.publication_type || ""}
              onChange={(e) => dispatch(changePublicationType(e.target.value))}
            >
              {publicationTypes.map((pt) => (
                <option
                  key={`pub_type_${pt.type_id}`}
                  value={pt.publication_type}
                >
                  {pt.publication_type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {fixedFields()}

        {dynamicFields()}
      </div>
    </div>
  );

  const authors = (
    <div className={"card mt-3"}>
      <div className={"card-header d-flex"}>
        <h2>Authors</h2>
        <InfoTip>
          Add authors by clicking the &quot;Add Authors&quot; button below and
          entering the author&apos;s details. You may also remove authors by
          clicking the <i className={"bi bi-trash fw-bold text-danger"}></i>{" "}
          button
        </InfoTip>
      </div>
      <div className={"card-body"}>
        <Authors />
      </div>
    </div>
  );

  const projects = (
    <div className={"card mt-3"}>
      <div className={"card-header d-flex"}>
        <h2>Associated Projects</h2>
        <InfoTip>
          Click/Tap each project that this publication is related to.
        </InfoTip>
      </div>
      <div className={"card-body"}>
        <Projects />
        <hr />
        <ProjectSearch />
      </div>
    </div>
  );

  const resources = (
    <div className={"card mt-3"}>
      <div className={"card-header d-flex"}>
        <h2>Resources</h2>
        <InfoTip>
          Select the resources that were used in this publication. Resources
          are shown from the projects you selected above.
        </InfoTip>
      </div>
      <div className={"card-body"}>
        <Resources />
      </div>
    </div>
  );

  return (
    <>
      {publicationInformation}
      {authors}
      {projects}
      {resources}
    </>
  );
}
