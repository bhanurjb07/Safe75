# Safe75 API integration

All ERP access lives in `src/api/`. Every request is a `POST` to the Supabase edge function at `VITE_PROXY_URL`, which forwards it to the college ERP. Nothing else in the app talks to the network.

## Transport (every request)

| | |
|---|---|
| Method | `POST` to `VITE_PROXY_URL` |
| Outer headers | `Content-Type: application/json`, `apikey: <VITE_SUPABASE_ANON_KEY>`, `Authorization: Bearer <VITE_SUPABASE_ANON_KEY>` |
| Body | `{ endpoint, method, headers, body?, contentType? }`. `headers` are the ERP's own (see below) |
| ERP headers after login | `Authorization: Bearer <access_token>`, `X_Token`, `SessionId`, `X-UserId`, `X-ContextId`, `X-WB: 1`, `X-RX: 1` |
| Timeout | 30 s (`AbortController`) |
| Client | `src/api/client.js` → `proxyRequest()` |

### Error handling (`src/api/client.js`, `src/api/errors.js`)

| Response | `ApiError.code` | What the user sees / app does |
|---|---|---|
| Network failure | `network` | "Can't reach the server…" (cached data shown if any) |
| Timeout | `timeout` | "The college ERP is taking too long…" |
| 401, 403, or ASP.NET "Authorization has been denied" | `unauthorized` | Session cleared, back to login with "Session expired" |
| 400 on `/Token` | `credentials` | "Wrong username or password" |
| other 4xx (incl. 404, 429) | `bad_request` | "The ERP rejected the request…" |
| 5xx | `server` | "The college ERP seems to be down…" |
| Missing / unexpected fields | `shape` | Readable message, never a white screen |

Error text is passed through `redact()`, which strips tokens, keys, phone numbers, Aadhaar-like numbers and contact fields. Nothing is written to the console.

---

## 1. Login: INTEGRATED (`src/api/auth.js`)

| | |
|---|---|
| ERP path | `/Token` |
| ERP method | `POST`, `contentType: application/x-www-form-urlencoded` |
| ERP headers | `X-WB: 1`, `X-RX: 1`, `Accept: */*`, `X-Requested-With: XMLHttpRequest` |
| Body | `{ grant_type: "password", username, password }` |
| Fields used | `access_token`, `token_type`, `expires_in`, `X-UserId`, `X-ContextId`, `X-LogoId`, `SessionId`, `X_Token`, `.issued`, `.expires` |
| Storage | Mapped session in **sessionStorage** only. The password is never stored |

## 2. Attendance: INTEGRATED (`src/api/attendance.js` → `mapAttendance` in `src/api/mappers.js`)

| | |
|---|---|
| ERP path | `/api/SubjectAttendance/GetPresentAbsentStudent?isDateWise=false&termId=0&userId={X-UserId}&y=0` |
| ERP method | `GET` |
| Returns | One student (the logged-in one; `userId` comes from the session, never from the URL) |
| Headline fields | `stdSubAtdDetails.overallPresent`, `overallLecture`, `overallPercentage`; fallback `studentSubjectAttendance[0]` |
| Per subject | `subjects[]`: `id`, `code`, `name`, `totalLeactures`, `presentLeactures`, `absentLeactures`, `percentageAttendance`, `*ExtraLeacture*`, `subjectType` (1 = lab) |
| Day-wise log | `attendanceData[]` (regular: `absentDate`, `subjectId`, `isAbsent`, `attandanceType`) **merged with** `extraLectures[]` (extra: `subjectId`, `attendanceLable` "P"/"A", date field resolved from `absentDate` / `lectureDate` / `extraLectureDate` / `attendanceDate` / `date` / any `*date*` key). Records are matched to subjects by `subjectId`; regular before extra for the same subject and date. Regular + extra = ERP total |
| Ignored | `attendanceCopy[]` |
| Debug | `?debug=1` shows regular + extra = sum, checked against the ERP totals |

## 3. Semester history: INTEGRATED (`fetchSemesters`)

| | |
|---|---|
| ERP path | `/api/SubjectAttendance?userFromClient=0&userId={X-UserId}` |
| ERP method | `GET` |
| Fields used | `userId`, `batchId`, `batchName`, `semester`, `financialYear`, `courseName` (newest first) |
| Past semesters | **Experimental** (`VITE_ENABLE_PAST_SEMESTERS=true`): passes a past `userId` to endpoint 2. Hidden automatically if the ERP rejects it or returns the current semester again. Not verified against the live ERP |

## 4. Profile: INTEGRATED (`src/api/profile.js`, `src/api/profileSchema.js`)

| | |
|---|---|
| ERP path | `/api/User?Id={X-UserId}&val=0&val1=0&val2=0&val3=0` |
| ERP method | `GET` |
| Returns | One student object (the logged-in one) |
| `userDetails` | A **JSON string**, parsed with `parseJsonObject()` (`src/utils/responseParser.js`). Invalid JSON gives `{}`, never a crash |
| Fallback rule | For every field, the **root-level value is authoritative**; `userDetails` is only used when the root value is blank. Fields with alternatives (e.g. `smsMobileNumber` → `phone`) try each key in order, root first. Blank means null, empty, or placeholders such as `NA`, `--`, `Select`, `0001-01-01T00:00:00` |
| Fields used | Exactly those listed in `profileSchema.js` (personal, enrolment, contact, present / permanent address, father, mother, parents, guardian, current programme, 10th, 12th + subject-wise marks, diploma, graduation, previous education, additional info, transport, hostel, placement) plus `userInternshipDetails` / `userAchievement` lists. `mapProfile()` separately returns the contact shape `{ firstName, middleName, lastName, rollNumber, admissionNumber, mobile, address, aadhaar }` |
| Not shown | Internal ids (`courseId`, `branchId`, `hostelId`, `routeStopId`…), `profilePictureId` (no image endpoint known), and anything not in the schema |
| Sensitive | Aadhaar masked (last 4 digits, 10 s reveal). Religion, caste, minority, incomes, physical and medical details hidden until "Show private" (re-hides after 30 s) |
| Storage | Name + roll number in sessionStorage (header). **Everything else is memory only**: re-fetched on each login / page load, cleared on logout, never in the debug panel (the response shape is not logged) |
| Formatting | `src/utils/formatters.js`: dates in several formats, numbers sent as strings, Yes / No booleans, ₹ amounts; marks / percentages / money of `0` are treated as "not provided" |

---

## NOT INTEGRATED

These modules from the SIS brief have **no known endpoint** in this project (no documentation, no existing request, no example response). They are deliberately not built rather than faked. To integrate one, capture the ERP's request for that screen (method, path, query, headers, body) and an example response, then add a service in `src/api/` and a row here.

| Module | Status | Notes |
|---|---|---|
| Fees / receipts | NOT INTEGRATED | Profile carries fee-related keys (`feeScheduleId`, `firstFeeAmount`, `showNoDues`…) but no payment history or receipts. Not shown, to avoid presenting partial fee data as a statement |
| Examinations / results / report cards | NOT INTEGRATED | Fields like `subjectsMarks`, `userGrandTotalPercentage`, `reportCardId` were listed but their endpoint is unknown |
| Internal marks | NOT INTEGRATED | |
| Documents / certificate upload & verification | NOT INTEGRATED | Certificate categories alone don't say what a student has uploaded |
| Time table | NOT INTEGRATED | |
| Announcements / circulars | NOT INTEGRATED | In-app Notifications are derived from attendance only |
| Faculty feedback | NOT INTEGRATED | |
| Transport route map, hostel notices / fees | NOT INTEGRATED | Only the profile's own transport / hostel fields are shown |
| Placement applications / opportunities | NOT INTEGRATED | Only eligibility / category and the internship & achievement lists from the profile |
| Discipline, parent / HoD meetings | NOT INTEGRATED | Not shown |
| Profile picture | NOT INTEGRATED | `profilePictureId` exists; the image endpoint is unknown |
| SGPA / CGPA | NOT INTEGRATED | Never calculated without official grading rules and data |

## Security notes

- Safe75 is a browser app talking to the ERP through a proxy. **Authorization is enforced by the ERP**: every request carries the student's own ERP token, and the `userId` always comes from the login response, never from a URL parameter. The frontend is not, and cannot be, a security boundary.
- Only the public Supabase **anon** key is in the frontend; no service-role key exists in this project.
- Never logged anywhere: passwords, tokens, Aadhaar, phone numbers, addresses (see `redact()` and `describeShape()`).
