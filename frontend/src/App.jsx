import { useState } from "react";

import {
  LayoutDashboard,
  Upload,
  SlidersHorizontal,
  Table2,
  History,
  Settings,
  Info,
  FileSpreadsheet,
  CalendarDays,
  Search,
  RotateCcw,
  Filter,
  Download,
  ShieldCheck,
  ChevronDown,
  Menu,
} from "lucide-react";

import "./App.css";

function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [fileInfo, setFileInfo] = useState(null);

  const [excelData, setExcelData] = useState([]);

  const [uploading, setUploading] = useState(false);

  // Excel category filters
  const [filters, setFilters] = useState({});

  // Name
  const [nameFilter, setNameFilter] = useState("");

  // Gender
  const [genderFilter, setGenderFilter] =
    useState("All");

  // Age
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");

  // Main search
  const [searchTerm, setSearchTerm] =
    useState("");


  // =========================================================
  // UPLOAD EXCEL
  // =========================================================

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName =
      file.name.toLowerCase();

    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls")
    ) {
      alert(
        "Please upload an Excel file (.xlsx or .xls)."
      );

      event.target.value = "";

      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://localhost:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "FastAPI response:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to process Excel file."
        );
      }

      // Store backend information
      setFileInfo(data);

      // Store Excel data
      setExcelData(
        Array.isArray(data.data)
          ? data.data
          : []
      );

      // Reset filters when new file is uploaded
      setFilters({});

      setNameFilter("");

      setGenderFilter("All");

      setAgeFrom("");

      setAgeTo("");

      setSearchTerm("");

    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      alert(
        error.message ||
          "Could not connect to FastAPI."
      );

    } finally {

      setUploading(false);

      // Allows uploading same file again
      event.target.value = "";
    }
  };


  // =========================================================
  // NORMALIZE TEXT
  // =========================================================

  const normalizeText = (value) => {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };


  // =========================================================
  // NORMALIZE COLUMN
  // =========================================================

  const normalizeColumn = (value) => {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };


  // =========================================================
  // FIND NAME COLUMN
  // =========================================================

  const findNameColumn = (row) => {
    const columns =
      Object.keys(row);

    const exactNames = [
      "name",
      "full name",
      "fullname",
      "full name with initials",
      "name with initials",
    ];

    const exactColumn =
      columns.find(
        (column) =>
          exactNames.includes(
            normalizeColumn(column)
          )
      );

    if (exactColumn) {
      return exactColumn;
    }

    // Fallback
    return columns.find(
      (column) => {
        const normalized =
          normalizeColumn(column);

        return (
          normalized.includes("name") &&
          !normalized.includes("username")
        );
      }
    );
  };


  // =========================================================
  // FIND GENDER COLUMN
  // =========================================================

  const findGenderColumn = (row) => {
    const columns =
      Object.keys(row);

    return columns.find(
      (column) => {

        const name =
          normalizeColumn(column);

        return (
          name.includes("gender") ||
          name.includes("sex") ||
          name.includes("ස්ත්‍රී") ||
          name.includes("ස්ත්රි") ||
          name.includes("පුරුෂ")
        );
      }
    );
  };


  // =========================================================
  // FIND BIRTHDAY COLUMN
  // =========================================================

  const findBirthdayColumn = (row) => {
    const columns =
      Object.keys(row);

    const possibleNames = [
      "birthday",
      "birth date",
      "birthdate",
      "date of birth",
      "dob",
      "birth day",
      "birth_day",
      "date_of_birth",
    ];

    const exactColumn =
      columns.find(
        (column) =>
          possibleNames.includes(
            normalizeColumn(column)
          )
      );

    if (exactColumn) {
      return exactColumn;
    }

    // Fallback
    return columns.find(
      (column) =>
        normalizeColumn(column)
          .includes("birth")
    );
  };


  // =========================================================
  // NORMALIZE GENDER VALUE
  // =========================================================

  const normalizeGender = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const gender =
      String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    // MALE
    if (
      gender === "male" ||
      gender === "m" ||
      gender === "පුරුෂ" ||
      gender.includes("පුරුෂ")
    ) {
      return "male";
    }

    // FEMALE
    if (
      gender === "female" ||
      gender === "f" ||
      gender === "ස්ත්‍රී" ||
      gender === "ස්ත්රි" ||
      gender.includes("ස්ත්‍රී") ||
      gender.includes("ස්ත්රි")
    ) {
      return "female";
    }

    return gender;
  };


  // =========================================================
  // CALCULATE AGE
  // =========================================================

  const calculateAge = (value) => {
    if (!value) {
      return null;
    }

    let birthDate = null;

    // Date object
    if (value instanceof Date) {

      birthDate = value;

    } else {

      const dateString =
        String(value).trim();

      if (!dateString) {
        return null;
      }

      // YYYY-MM-DD
      if (
        /^\d{4}-\d{1,2}-\d{1,2}$/.test(
          dateString
        )
      ) {

        const [
          year,
          month,
          day,
        ] =
          dateString
            .split("-")
            .map(Number);

        birthDate = new Date(
          year,
          month - 1,
          day
        );

      }

      // DD/MM/YYYY
      else if (
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(
          dateString
        )
      ) {

        const [
          day,
          month,
          year,
        ] =
          dateString
            .split("/")
            .map(Number);

        birthDate = new Date(
          year,
          month - 1,
          day
        );

      }

      // DD-MM-YYYY
      else if (
        /^\d{1,2}-\d{1,2}-\d{4}$/.test(
          dateString
        )
      ) {

        const [
          day,
          month,
          year,
        ] =
          dateString
            .split("-")
            .map(Number);

        birthDate = new Date(
          year,
          month - 1,
          day
        );

      }

      // Other formats
      else {

        birthDate =
          new Date(dateString);
      }
    }

    if (
      !birthDate ||
      Number.isNaN(
        birthDate.getTime()
      )
    ) {
      return null;
    }

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
          birthDate.getDate()
      )
    ) {
      age--;
    }

    return age;
  };


  // =========================================================
  // HANDLE EXCEL FILTER
  // =========================================================

  const handleFilterChange = (
    column,
    value
  ) => {

    setFilters(
      (previous) => ({
        ...previous,
        [column]: value,
      })
    );
  };


  // =========================================================
  // RESET ALL
  // =========================================================

  const clearFilters = () => {

    setFilters({});

    setNameFilter("");

    setGenderFilter("All");

    setAgeFrom("");

    setAgeTo("");

    setSearchTerm("");
  };


  // =========================================================
  // FILTER DATA
  // =========================================================

  const filteredData =
    excelData.filter(
      (row) => {

        // ===================================================
        // EXCEL CATEGORY FILTERS
        // ===================================================

        const matchesCategories =
          Object.entries(
            filters
          ).every(
            ([column, selectedValue]) => {

              if (
                !selectedValue ||
                selectedValue === "All"
              ) {
                return true;
              }

              const rowValue =
                normalizeText(
                  row[column]
                );

              const filterValue =
                normalizeText(
                  selectedValue
                );

              return (
                rowValue ===
                filterValue
              );
            }
          );


        // ===================================================
        // NAME FILTER
        // ===================================================

        let matchesName = true;

        if (
          nameFilter.trim() !== ""
        ) {

          const nameColumn =
            findNameColumn(row);

          if (!nameColumn) {

            matchesName = false;

          } else {

            const rowName =
              normalizeText(
                row[nameColumn]
              );

            matchesName =
              rowName.includes(
                normalizeText(
                  nameFilter
                )
              );
          }
        }


        // ===================================================
        // GENDER FILTER
        // ===================================================

        let matchesGender = true;

        if (
          genderFilter !== "All"
        ) {

          const genderColumn =
            findGenderColumn(row);

          if (!genderColumn) {

            matchesGender = false;

          } else {

            const excelGender =
              normalizeGender(
                row[genderColumn]
              );

            const selectedGender =
              normalizeGender(
                genderFilter
              );

            matchesGender =
              excelGender ===
              selectedGender;
          }
        }


        // ===================================================
        // AGE FILTER
        // ===================================================

        let matchesAge = true;

        const ageFilterActive =
          ageFrom !== "" ||
          ageTo !== "";

        if (ageFilterActive) {

          const birthdayColumn =
            findBirthdayColumn(row);

          if (!birthdayColumn) {

            matchesAge = false;

          } else {

            const age =
              calculateAge(
                row[birthdayColumn]
              );

            if (age === null) {

              matchesAge = false;

            } else {

              if (
                ageFrom !== "" &&
                age <
                  Number(ageFrom)
              ) {
                matchesAge = false;
              }

              if (
                ageTo !== "" &&
                age >
                  Number(ageTo)
              ) {
                matchesAge = false;
              }
            }
          }
        }


        // ===================================================
        // MAIN SEARCH
        // ===================================================

        let matchesSearch = true;

        if (
          searchTerm.trim() !== ""
        ) {

          const search =
            normalizeText(
              searchTerm
            );

          matchesSearch =
            Object.values(row).some(
              (value) =>
                normalizeText(
                  value
                ).includes(search)
            );
        }


        // ===================================================
        // FINAL
        // ===================================================

        return (
          matchesCategories &&
          matchesName &&
          matchesGender &&
          matchesAge &&
          matchesSearch
        );
      }
    );


  // =========================================================
  // EXPORT CSV
  // =========================================================

  const exportCSV = () => {

    if (
      filteredData.length === 0
    ) {

      alert(
        "No records to export."
      );

      return;
    }

    const columns =
      fileInfo?.column_names ||
      Object.keys(
        filteredData[0]
      );

    const header =
      columns.join(",");

    const rows =
      filteredData.map(
        (row) =>
          columns
            .map(
              (column) => {

                const value =
                  row[column] ?? "";

                return `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`;
              }
            )
            .join(",")
      );

    const csv = [
      header,
      ...rows,
    ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "filtered_results.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Filter size={22} />
          </div>

          <span>
            Excel Filter App
          </span>

        </div>


        <nav className="navigation">

          <NavItem
            icon={
              <LayoutDashboard
                size={19}
              />
            }
            text="Dashboard"
            active
          />

          <NavItem
            icon={
              <Upload size={19} />
            }
            text="Upload Excel"
          />

          <NavItem
            icon={
              <SlidersHorizontal
                size={19}
              />
            }
            text="Filters"
          />

          <NavItem
            icon={
              <Table2 size={19} />
            }
            text="Results"
          />

          <NavItem
            icon={
              <History size={19} />
            }
            text="Export History"
          />

          <NavItem
            icon={
              <Settings size={19} />
            }
            text="Settings"
          />

          <NavItem
            icon={
              <Info size={19} />
            }
            text="About"
          />

        </nav>


        <div className="security-card">

          <div className="security-icon">
            <ShieldCheck
              size={18}
            />
          </div>

          <div>

            <strong>
              Your Data is Safe
            </strong>

            <p>
              Your files are processed
              securely.
            </p>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="header">

          <div className="mobile-menu">
            <Menu size={22} />
          </div>


          <label className="upload-button">

            <Upload size={17} />

            {uploading
              ? "Uploading..."
              : "Upload New File"}

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleFileUpload
              }
              hidden
            />

          </label>


          <div className="profile">

            <div className="avatar">
              A
            </div>

            <span>
              Admin
            </span>

            <ChevronDown
              size={16}
            />

          </div>

        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="content">

          {/* PAGE TITLE */}

          <div className="page-title">

            <h1>
              Filter Google Form Results
            </h1>

            <p>
              Upload your Excel file,
              filter by categories and
              download filtered results.
            </p>

          </div>


          {/* =================================================
              FILE INFORMATION
          ================================================= */}

          <section className="file-card">

            <InfoCard
              icon={
                <FileSpreadsheet
                  size={21}
                />
              }
              iconClass="green"
              title="File Name"
              value={
                fileInfo?.filename ||
                "No file uploaded"
              }
            />


            <InfoCard
              icon={
                <Table2 size={21} />
              }
              iconClass="blue"
              title="Total Records"
              value={
                fileInfo
                  ? fileInfo.rows
                  : "—"
              }
            />


            <InfoCard
              icon={
                <CalendarDays
                  size={21}
                />
              }
              iconClass="purple"
              title="Uploaded On"
              value={
                fileInfo
                  ? "Just now"
                  : "—"
              }
            />


            <InfoCard
              icon={
                <Table2 size={21} />
              }
              iconClass="orange"
              title="Total Columns"
              value={
                fileInfo
                  ? fileInfo.columns
                  : "—"
              }
            />

          </section>


          {/* =================================================
              FILTER PANEL
          ================================================= */}

          <section className="panel">

            <div className="panel-title">

              <Filter size={20} />

              <h2>
                Filters
              </h2>

            </div>


            <div className="filter-grid">

              {/* =================================================
                  EXCEL CATEGORY FILTERS

                  First 3 are hidden.

                  4th onward are shown.
              ================================================= */}

         {fileInfo?.categories &&
  Object.entries(fileInfo.categories)
    .slice(3)
    .map(([column, values]) => (
      <div
        className="field-group"
        key={column}
      >
        <label>{column}</label>

        <select
          className="select-box"
          value={
            filters[column] || "All"
          }
          onChange={(event) =>
            handleFilterChange(
              column,
              event.target.value
            )
          }
        >
          <option value="All">
            All
          </option>

          {Array.isArray(values) &&
            values.map(
              (value, index) => (
                <option
                  key={index}
                  value={value}
                >
                  {value}
                </option>
              )
            )}
        </select>
      </div>
    ))}


              {/* =================================================
                  NAME FILTER

                  ALWAYS VISIBLE
              ================================================= */}

              <div className="field-group">

                <label>
                  Name
                </label>


                <div className="search-box">

                  <Search
                    size={18}
                  />


                  <input
                    type="text"
                    placeholder="Enter name..."
                    value={
                      nameFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setNameFilter(
                        event.target
                          .value
                      )
                    }
                  />


                  {nameFilter !== "" && (

                    <button
                      type="button"
                      className="search-clear"
                      onClick={() =>
                        setNameFilter(
                          ""
                        )
                      }
                    >
                      ×
                    </button>

                  )}

                </div>

              </div>


              {/* =================================================
                  GENDER FILTER

                  ALWAYS VISIBLE
              ================================================= */}

              <div className="field-group">

                <label>
                  Gender
                </label>


                <select
                  className="select-box"
                  value={
                    genderFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setGenderFilter(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="All">
                    All
                  </option>

                  <option value="පුරුෂ">
                    පුරුෂ
                  </option>

                  <option value="ස්ත්‍රී">
                    ස්ත්‍රී
                  </option>

                </select>

              </div>


              {/* =================================================
                  AGE RANGE

                  ALWAYS VISIBLE
              ================================================= */}

              <div className="field-group age-group">

                <label>
                  Age Range
                </label>


                <div className="age-inputs">

                  <div className="input-wrapper">

                    <input
                      type="number"
                      min="0"
                      placeholder="From"
                      value={
                        ageFrom
                      }
                      onChange={(
                        event
                      ) =>
                        setAgeFrom(
                          event.target
                            .value
                        )
                      }
                    />

                    <span>
                      Age
                    </span>

                  </div>


                  <div className="input-wrapper">

                    <input
                      type="number"
                      min="0"
                      placeholder="To"
                      value={
                        ageTo
                      }
                      onChange={(
                        event
                      ) =>
                        setAgeTo(
                          event.target
                            .value
                        )
                      }
                    />

                    <span>
                      Age
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  MAIN SEARCH

                  ALWAYS VISIBLE
              ================================================= */}

              <div className="field-group search-group">

                <label>
                  Search by Name / ID /
                  Email / Phone
                </label>


                <div className="search-box main-search">

                  <Search
                    size={18}
                  />


                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={
                      searchTerm
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchTerm(
                        event.target
                          .value
                      )
                    }
                  />


                  {searchTerm !== "" && (

                    <button
                      type="button"
                      className="search-clear"
                      onClick={() =>
                        setSearchTerm(
                          ""
                        )
                      }
                    >
                      ×
                    </button>

                  )}

                </div>

              </div>


              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="filter-actions">

                <button
                  type="button"
                  className="reset-button"
                  onClick={
                    clearFilters
                  }
                >

                  <RotateCcw
                    size={16}
                  />

                  Reset Filters

                </button>


                <button
                  type="button"
                  className="apply-button"
                  onClick={() => {

                    console.log(
                      "Applied filters:",
                      {
                        filters,
                        nameFilter,
                        genderFilter,
                        ageFrom,
                        ageTo,
                        searchTerm,
                      }
                    );

                  }}
                >

                  <Filter size={16} />

                  Apply Filters

                </button>

              </div>

            </div>

          </section>


          {/* =================================================
              RESULTS
          ================================================= */}

          <section className="panel results-panel">

            <div className="results-header">

              <div className="panel-title">

                <Table2
                  size={20}
                />

                <h2>
                  Results
                </h2>

              </div>


              <button
                type="button"
                className="csv-button"
                disabled={
                  filteredData.length ===
                  0
                }
                onClick={
                  exportCSV
                }
              >

                <Download
                  size={16}
                />

                Export CSV

              </button>

            </div>


            {/* RESULT COUNT */}

            <div className="record-count">

              <span>
                ✓
              </span>

              Showing{" "}

              <strong>
                {
                  filteredData.length
                }
              </strong>

              {" "}of{" "}

              <strong>
                {
                  excelData.length
                }
              </strong>

              {" "}records

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="table-container">

              {!fileInfo ? (

                <div className="empty-state">

                  <FileSpreadsheet
                    size={40}
                  />

                  <h3>
                    No Excel file uploaded
                  </h3>

                  <p>
                    Upload an Excel file
                    to see your results.
                  </p>

                </div>

              ) : filteredData.length ===
                0 ? (

                <div className="empty-state">

                  <Search
                    size={40}
                  />

                  <h3>
                    No matching records
                  </h3>

                  <p>
                    Try changing your
                    filters or search.
                  </p>

                </div>

              ) : (

                <table>

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>


                      {(
                        fileInfo.column_names ||
                        Object.keys(
                          filteredData[0]
                        )
                      ).map(
                        (column) => (

                          <th
                            key={
                              column
                            }
                          >
                            {column}
                          </th>

                        )
                      )}

                    </tr>

                  </thead>


                  <tbody>

                    {filteredData.map(
                      (
                        row,
                        index
                      ) => (

                        <tr
                          key={
                            index
                          }
                        >

                          <td>
                            {
                              index +
                              1
                            }
                          </td>


                          {(
                            fileInfo.column_names ||
                            Object.keys(
                              row
                            )
                          ).map(
                            (column) => (

                              <td
                                key={
                                  column
                                }
                              >
                                {String(
                                  row[
                                    column
                                  ] ??
                                    ""
                                )}
                              </td>

                            )
                          )}

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              )}

            </div>

          </section>

        </section>

      </main>

    </div>
  );
}


// =========================================================
// NAVIGATION ITEM
// =========================================================

function NavItem({
  icon,
  text,
  active = false,
}) {

  return (
    <div
      className={`nav-item ${
        active
          ? "active"
          : ""
      }`}
    >

      {icon}

      <span>
        {text}
      </span>

    </div>
  );
}


// =========================================================
// INFORMATION CARD
// =========================================================

function InfoCard({
  icon,
  iconClass,
  title,
  value,
}) {

  return (
    <div className="info-card">

      <div
        className={`info-icon ${iconClass}`}
      >
        {icon}
      </div>


      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


export default App;