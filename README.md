# Job Sheets – WR & EL Jones Electrical

Installable app for job cards, materials, photos, daily timesheets and weekly hours.

* The **data** lives in the "Job Sheets" Google Sheet and Google Drive of the admin account (via Apps Script).
* This repository only holds the **app screens** – no jobs, hours, photos or PINs are stored here.

**To connect:** edit `config.js` and paste the Apps Script *Web app URL* (ending in `/exec`), then commit.

**To update the app:** upload the new `index.html` (and any other changed files) over the old ones.
