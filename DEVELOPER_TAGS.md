# GR Class Certificate Developer Tags Reference

Below is the list of all dynamic placeholder tags (developer tags) currently supported when generating certificates in the GR Class backend system. 

When designing or updating Word templates (`.docx`), using these tag names (either as plain text placeholders like `{tag_name}` or inside Content Controls / Structured Document Tags) will ensure that the backend automatically populates them with the corresponding database values.

---

### Standard Vessel & Certificate Particulars

| Developer Tag | Primary Description | Matches / Synonyms Detected |
| :--- | :--- | :--- |
| `certificate_number` | Unique identifier for the certificate | `certificate number`, `no de certificado`, `certificate no`, `certificado no.`, `certificatenumber`, `certnumber`, `certno` |
| `vessel_name` | Name of the vessel / ship | `name of ship`, `name of vessel`, `vesselname`, `nameofship`, `shipname`, `nombredelanave`, `vessel` |
| `imo_number` | IMO Ship Identification Number | `imo number`, `imo number1`, `imo no.`, `imo no`, `imonumber`, `imo`, `imono` |
| `call_sign` | Distinctive call letters or signal | `distinctive number or letters`, `call sign`, `señal distintiva`, `callsign`, `distinctivenumber`, `sign` |
| `port_of_registry` | Home port of registry | `port of registry`, `puerto de registro`, `portofregistry`, `registryport`, `puertoderegistro` |
| `gross_tonnage` | Gross Tonnage (GT) | `gross tonnage`, `arqueo bruto`, `grosstonnage`, `gt` |
| `net_tonnage` | Net Tonnage (NT) | `net tonnage`, `arqueo neto`, `nettonnage`, `nt` |
| `deadweight` | Deadweight Tonnage (DWT) | `deadweight`, `peso muerto`, `dwt` |
| `year_built` | Date keel was laid / year built | `date of construction`, `date of built`, `date of build`, `keel laid`, `año de construcción`, `fechadeconstruccion`, `yearbuilt`, `built` |
| `ship_type` | Type of vessel classification | `ship type`, `tipo de buque`, `type of ship`, `shiptype`, `vesseltype` |

---

### Dates & Locations

| Developer Tag | Primary Description | Matches / Synonyms Detected |
| :--- | :--- | :--- |
| `issue_date` | Date the certificate is officially issued | `date of issue`, `fecha de emision`, `fecha de emisión`, `issuedate` |
| `expiry_date` | Date of certificate expiration | `valid until`, `valido hasta`, `expirydate`, `validity`, `validuntil` |
| `survey_completion_date` | Date the survey was completed | `completion date of the survey`, `fecha de terminación`, `surveycompletiondate`, `surveydate` |
| `place_of_survey` | Place/Port where certificate is issued / survey completed | `issued at`, `expedido en`, `lugar de emision`, `port`, `place`, `location`, `placeofsurvey` |
| `surveyor_name` | Full name of the inspector / auditor | `surveyor name`, `nombre del inspector`, `auditor name`, `surveyorname`, `surveyor` |
| `flag_state` | Flag administration governing the ship | `flag state`, `flag`, `flagstate` |

---

### Additional Fields

| Developer Tag | Primary Description | Matches / Synonyms Detected |
| :--- | :--- | :--- |
| `owner_operators` | Client / Owner / Operator company name | `owner`, `operator`, `company`, `client`, `owneroperator` |
| `mmsi_number` | Maritime Mobile Service Identity number | `mmsi_number` |
| `ballast_water_capacity` | Ballast Water Capacity in cubic meters | `ballast water capacity`, `capacidad de agua de lastre` |
| `certificate_type` | Certificate Type Name | `certificate_type`, `certtype`, `certname` |
| `certificate_term` | Term of certificate (`FULL_TERM` / `SHORT_TERM`) | `certificate_term`, `term` |
| `gr_class_logo` | URL/Base64 of GR Class Logo | `gr_class_logo` |
| `flag_logo` | URL/Base64 of Flag State logo | `flag_logo` |
