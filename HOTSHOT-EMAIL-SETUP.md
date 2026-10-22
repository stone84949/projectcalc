# Hotshot Math kit sign-up: 5-minute setup

The "OPERATOR KIT" form on `/hotshot/` sends sign-ups to a small Google Apps Script.
Each sign-up adds one row to a Google Sheet: time, email, consent, and the page it came from.
It's free and uses your own Google account. No form service, nothing to pay for.

Until you paste the web app URL into `hotshot/config.js`, the form stays greyed out and says "The list opens at launch."

## One-time setup (about 5 minutes)

1. In Google Sheets, create a new sheet named **Hotshot Kit Signups**.
2. Open **Extensions > Apps Script**. Delete the starter code, paste in all of `forms/hotshot-kit-signup.gs`, and click **Save**.
3. Pick `testSignup` from the function menu at the top and click **Run**.
   - Google asks for permission to use the sheet. Allow it.
   - If you see "Google hasn't verified this app", click **Advanced**, then **Go to (project)**. It's your own script.
   - A **Signups** tab appears with a header row and one test row (`kit-test@example.com`). Delete the test row afterwards.
4. Click **Deploy > New deployment**. Next to **Select type**, click the gear and choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/.../exec`.
6. In `hotshot/config.js`, paste it as the value of `kitFormUrl`:

   ```js
   window.HotshotConfig = {
     kitFormUrl: 'https://script.google.com/macros/s/PASTE-YOUR-ID/exec',
   };
   ```

   Commit that on a task branch and send it through the usual review and release. The form turns on only when the value is a real `script.google.com/macros/s/.../exec` URL.

To check it's live: open `/hotshot/` on the site, enter your email, tick the box, and press **LIGHT ME UP**. The note should say "You're on the list," and a new row should appear in the sheet.

If **Anyone** isn't offered in step 4 (Workspace accounts only), the admin console is blocking sharing outside your domain: **Apps > Google Workspace > Drive and Docs > Sharing settings**, allow sharing outside the organization.

## What gets saved

| Column | What it is |
| --- | --- |
| Received | Date and time of the sign-up |
| Email | Lowercased email address |
| Consent | `yes` (the form can't be sent without ticking the box) |
| Source page | Site path it came from, such as `/hotshot/` |
| Status | `New`; use it for your own notes |

The privacy page says what's collected and why. Keep it accurate if this changes.

## Spam and duplicates

- A hidden field that people never see. Bots fill it in, and those requests are dropped.
- Requests sent faster than 2 seconds after the page loads are dropped.
- The same email twice within 2 minutes is ignored, and an email already in the sheet isn't added again.
- Anything that starts like a spreadsheet formula is stored as plain text.
- Dropped requests still get an "ok" answer, so bots learn nothing.

## Changing the script later

After editing the script, use **Deploy > Manage deployments**, edit the existing deployment, and set **Version: New version**.
That keeps the same `/exec` URL, so the site doesn't change.

## Sending the kit email

The script only collects addresses. When the kit is ready, send one email to the list from your Google account (Gmail or mail merge from the sheet), and honour any removal request.
