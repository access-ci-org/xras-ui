import { connect } from "react-redux";
import DoiSearch from "./DoiSearch";
import {
  getPublication,
  getPubTypes,
  getTagCategories,
  getSaving,
  getModal,
  getSaveEnabled,
  getFormValid,
} from "./helpers/selectors";
import {
  updateField,
  changePubType,
  updatePublication,
  setFormValid,
} from "./helpers/actions";
import { savePublication } from "./helpers/thunks";
import Authors from "./Authors";
import InfoTip from "../shared/InfoTip";
import Tags from "./Tags";
import Projects from "./Projects";
import ProjectSearch from "./ProjectSearch";

const PublicationForm = ({
  publication,
  updateField,
  publication_types,
  changePubType,
  updatePublication,
  tag_categories,
  savePublication,
  modal,
  save_enabled,
  setFormValid,
  form_valid,
}) => {
  const updateTitle = (e) => {
    e.target.value.trim() == "" ? setFormValid(false) : setFormValid(true);

    updatePublication({ key: "title", value: e.target.value });
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
            value={f.field_value}
            onChange={(e) => updateField({ index: idx, value: e.target.value })}
          />
        </div>
      </div>
    ));
  };

  const fixedFields = () => {
    const lastYear = new Date().getFullYear() + 2;
    let year = 1980;
    const years = [];
    while (year <= lastYear) years.push(year++);

    const months = [
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
              className={`form-control ${form_valid ? "" : "is-invalid"}`}
              value={publication.title}
              onChange={(e) => updateTitle(e)}
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
              value={publication.publication_year}
              onChange={(e) => {
                updatePublication({
                  key: "publication_year",
                  value: e.target.value,
                });
              }}
            >
              {years.map((year) => (
                <option key={`year_${year}`} value={year}>
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
              value={publication.publication_month}
              onChange={(e) => {
                updatePublication({
                  key: "publication_month",
                  value: e.target.value,
                });
              }}
            >
              {months.map((month, idx) => (
                <option key={`month_${idx}`} value={idx + 1}>
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
              value={publication.publication_type}
              onChange={(e) => changePubType(e.target.value)}
            >
              {publication_types.map((pt) => (
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

  const tags = (
    <div className={"card mt-3"}>
      <div className={"card-header d-flex"}>
        <h2>Tags</h2>
        <InfoTip>
          Add related tags from the lists below. You may choose multiple tags
          per category.
        </InfoTip>
      </div>
      <div className={"card-body"}>
        {tag_categories.map((tc, idx) => (
          <Tags key={`tc_${idx}`} index={idx} category={tc} />
        ))}
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

  return (
    <>
      {publicationInformation}
      {authors}
      {tags}
      {projects}
      {modal ? null : (
        <p className={"mt-3"}>
          <button
            onClick={() => savePublication()}
            className={"btn btn-success"}
            disabled={!save_enabled}
          >
            Save Publication
          </button>
        </p>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  publication: getPublication(state),
  publication_types: getPubTypes(state),
  tag_categories: getTagCategories(state),
  saving: getSaving(state),
  modal: getModal(state),
  save_enabled: getSaveEnabled(state),
  form_valid: getFormValid(state),
});

const mapDispatchToProps = (dispatch) => ({
  updateField: (f) => dispatch(updateField(f)),
  changePubType: (id) => dispatch(changePubType(id)),
  updatePublication: (data) => dispatch(updatePublication(data)),
  savePublication: () => dispatch(savePublication()),
  setFormValid: (data) => dispatch(setFormValid(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PublicationForm);
