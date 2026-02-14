# Flow: Creating a Job → Generating a Certificate

This document describes the end-to-end flow in the GIRIK_BACKEND codebase from creating a job request to generating a certificate. It includes actor roles, important status transitions, API endpoints, validations, services called, and references to key implementation points.

## Actors / Roles
- CLIENT: Requests jobs for their vessels.
- ADMIN / GM / TM: Manage and approve jobs, assign surveyors, generate certificates.
- SURVEYOR: Performs field work (start survey, stream location, submit checklist & survey report).

## Key Models Involved
- JobRequest (jobs)
- Certificate (certificates)
- CertificateType, CertificateTemplate
- SurveyReport, GpsTracking, ActivityPlanning (checklists)
- JobStatusHistory, CertificateHistory

## High-level status flow
1. CREATED (job created)
2. ASSIGNED (GM assigns a surveyor)
3. IN_PROGRESS (surveyor starts survey)
4. SURVEY_DONE (surveyor submits survey report)
5. TM_FINAL (technical manager finalizes survey)
6. CERTIFIED (certificate generated and job status updated)

## Preconditions / Validations (important)
- When creating a job, provided `certificate_type_id` and `vessel_id` are validated against the DB.
- A survey report can only be submitted when job is `IN_PROGRESS` and at least one checklist entry exists.
- Only the assigned surveyor may start/stream/submit for the job.
- Certificate generation requires a valid job (and uses the job's `certificate_type_id` and `vessel_id`).

## API Endpoints (important)
- Create job

  POST /api/v1/jobs

  - Roles: CLIENT, ADMIN, GM
  - Validates `vessel_id`, `certificate_type_id`

  Sample payload:
  ```json
  {
    "vessel_id": 123,
    "certificate_type_id": 5,
    "reason": "Annual inspection",
    "target_port": "Mumbai",
    "target_date": "2026-03-01"
  }
  ```

- Assign surveyor

  PUT /api/v1/jobs/:id/assign

  - Roles: ADMIN, GM
  - Sets `gm_assigned_surveyor_id` and job_status => `ASSIGNED`

- Start survey (surveyor check-in)

  POST /api/v1/surveys/start

  - Roles: SURVEYOR
  - Body: `{ "job_id": <id>, "latitude": <lat>, "longitude": <lon> }`
  - Transitions job_status => `IN_PROGRESS` and logs GPS.

- Submit checklist

  (Checklist endpoints exist in the checklists module; at least one checklist row must exist before submitting survey report.)

- Submit survey report (with optional attendance photo)

  POST /api/v1/surveys

  - Roles: SURVEYOR
  - Requires: job.status === `IN_PROGRESS` and checklists submitted
  - Uploads photo to S3, creates SurveyReport, creates a GPS tracking entry, and sets job_status => `SURVEY_DONE`

- Finalize survey

  PUT /api/v1/surveys/:id/finalize

  - Roles: SURVEYOR
  - Requires job_status === `SURVEY_DONE`
  - Sets job_status => `TM_FINAL`

- Generate certificate

  POST /api/v1/certificates

  - Roles: ADMIN, GM, TM
  - Body: `{ "job_id": <id>, "validity_years": 1 }`
  - Creates Certificate row, generates certificate number, computes issue/expiry dates, sets job_status => `CERTIFIED`

## Implementation notes & where to look in code

- Job creation logic (validations, DB create, and initial JobStatusHistory):

```10:29:/Users/abhinavvishwakarma/work/Project/GIRIK_BACKEND/src/modules/jobs/job.service.js
export const createJob = async (data, userId) => {
    if (data.certificate_type_id) {
        const certType = await CertificateType.findByPk(data.certificate_type_id);
        if (!certType) {
            throw { statusCode: 400, message: 'Invalid or unknown certificate_type_id. Please use a valid certificate type from /api/v1/certificates/types.' };
        }
    }
    ...
    const job = await JobRequest.create({
        ...safeData,
        requested_by_user_id: userId,
        job_status: 'CREATED'
    });
    await JobStatusHistory.create({ ... new_status: 'CREATED' });
    return job;
};
```

- Start survey (check-in) — sets `IN_PROGRESS` and logs initial GPS:

```62:89:/Users/abhinavvishwakarma/work/Project/GIRIK_BACKEND/src/modules/surveys/survey.service.js
export const startSurvey = async (data, userId) => {
    const { job_id, latitude, longitude } = data;
    const job = await JobRequest.findByPk(job_id);
    ...
    await job.update({ job_status: 'IN_PROGRESS' });
    await JobStatusHistory.create({... new_status: 'IN_PROGRESS' });
    await GpsTracking.create({...});
    return { message: 'Survey Started', job_id, started_at: new Date() };
};
```

- Submit survey report — upload photo to S3, create SurveyReport, update job status to `SURVEY_DONE`, log gps:

```11:60:/Users/abhinavvishwakarma/work/Project/GIRIK_BACKEND/src/modules/surveys/survey.service.js
export const submitSurveyReport = async (data, file, userId) => {
    const { job_id, gps_latitude, gps_longitude, survey_statement } = data;
    const job = await JobRequest.findByPk(job_id);
    ...
    const report = await SurveyReport.create({
        job_id,
        surveyor_id: userId,
        survey_date: new Date(),
        gps_latitude,
        gps_longitude,
        attendance_photo_url: photoUrl,
        survey_statement
    });
    await job.update({ job_status: 'SURVEY_DONE' });
    await GpsTracking.create({...});
    return report;
};
```

- Generate certificate — creates Certificate record, fills template, converts to PDF via Puppeteer, uploads to S3, updates job_status => `CERTIFIED`:

```42:66:/Users/abhinavvishwakarma/work/Project/GIRIK_BACKEND/src/modules/certificates/certificate.service.js
export const generateCertificate = async (data, userId) => {
    const { job_id, validity_years } = data;
    const job = await JobRequest.findByPk(job_id, { include: [Vessel, CertificateType] });
    ...
    const cert = await Certificate.create({ vessel_id: job.vessel_id, certificate_type_id: job.certificate_type_id, certificate_number: certificateNumber, issue_date: issueDate, expiry_date: expiryDate, status: 'VALID', issued_by_user_id: userId });
    // generate PDF using template (if exists) and upload to S3, then update cert.pdf_file_url
    await job.update({ job_status: 'CERTIFIED' });
    return await Certificate.findByPk(cert.id, { include: [...] });
};
```

- PDF generation and upload flow (uses Puppeteer + S3):

```35:56:/Users/abhinavvishwakarma/work/Project/GIRIK_BACKEND/src/services/certificate-pdf.service.js
export const htmlToPdfBuffer = async (html) => {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: {...} });
    return Buffer.from(pdfBuffer);
};
```

Then `uploadCertificatePdf` calls the S3 service to upload and returns a public URL.

## Typical sequence (concise)
1. CLIENT (or ADMIN/GM) calls POST /jobs -> job created with `CREATED`.
2. ADMIN/GM assigns a surveyor -> PUT /jobs/:id/assign -> job becomes `ASSIGNED`.
3. SURVEYOR calls POST /surveys/start -> job becomes `IN_PROGRESS`.
4. SURVEYOR submits checklist entries (checklist module).
5. SURVEYOR POST /surveys (with photo) -> SurveyReport created, job -> `SURVEY_DONE`.
6. SURVEYOR (or TM) finalizes -> PUT /surveys/:id/finalize -> job -> `TM_FINAL`.
7. ADMIN/GM/TM POST /certificates -> Certificate created, PDF generated and uploaded, job -> `CERTIFIED`.

## Edge cases and failure handling
- PDF generation may fail (Puppeteer missing, Chromium issue). The certificate row is persisted even if PDF generation fails — the code logs a warning and the cert stays without `pdf_file_url`.
- Attempts to change status in invalid order are rejected with 400 and clear messages (see survey.service and job.service validations).
- Access control: many endpoints check role and scope — unauthorized access returns 403.

## Where to extend / customization points
- Template content: CertificateTemplate entries (DB) — update template HTML to change certificate appearance.
- PDF settings: adjust page size/margins in `certificate-pdf.service.htmlToPdfBuffer`.
- Hook email/notification after certificate generation (notificationService is used elsewhere).

---
File created: `src/docs/flows/job-to-certificate.md` — keep this document up-to-date when job lifecycle or certificate logic changes.

