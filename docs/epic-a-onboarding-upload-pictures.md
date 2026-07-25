# Epic A — Onboarding: Upload Pictures
**Product:** The Wardrobe Collective
**Epic:** EPIC A — Onboarding
**Scope:** Welcome flow → Home Screen → Virtual Wardrobe (first-time) → Import from Camera Roll → Extraction → Results → Persist
**Format:** 3 C's + INVEST
**Status:** Draft v1

---

## Flow Map

```
App Launch
  └── Story 1: Welcome Mascot & Voiceover
        └── Story 2: Home Screen (View Wardrobe | Style Me Now | Fine Tune My Profile)
              └── Story 3: Global Back Navigation (< button → Home)
              └── [View Wardrobe]
                    └── Story 4: First-Time Wardrobe Entry (Import | Photograph | Describe)
                          └── [Import from Camera Roll]
                                └── Story 5: Open Device Photo Picker
                                      └── Story 6: Review Screen — Selected Photos
                                            ├── Story 7: Remove a Photo (X button)
                                            ├── Story 8: Add More Photos (up to 20)
                                            └── Story 9: Trigger Extract
                                                  └── Story 10: Background Processing Screen
                                                        └── Story 11: Extraction Results — Select & Add
                                                              └── Story 12: Persist Items to User Account
```

**Extraction Capability (cross-cutting):**
- Story 13: Extract Multiple Items per Photo
- Story 14: Handle Unclear / Unrecognised Items
- Story 15: Attribute Items to Source Photo

---

## Stories

---

### Story 1: App Welcome with Mascot Voiceover

**Title:** App Welcome with Mascot Voiceover

**Description:** As a new or returning user, I want to be greeted by the app mascot with a voiceover when I open the app, so that I feel welcomed and understand what the app is about.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. On app launch, the mascot is displayed full-screen before any navigation options appear.
2. A voiceover plays automatically on launch without requiring the user to tap anything.
3. The voiceover completes before the Home Screen is shown, OR a skip option is available to proceed immediately.
4. The mascot animation and voiceover are accessible — a text transcript or subtitle is shown for users with audio off or accessibility needs.
5. On subsequent logins, the welcome screen either does not show or can be configured to skip by returning users.

---

### Story 2: Home Screen with Three Primary Actions

**Title:** Home Screen with Three Primary Actions

**Description:** As a user, I want to see three clear options on the Home Screen after the welcome, so that I can quickly choose what I want to do in the app.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. After the welcome screen, the Home Screen displays exactly three buttons: **View Wardrobe**, **Style Me Now**, and **Fine Tune My Profile**.
2. Each button is visually distinct, labeled clearly, and tappable.
3. Tapping **View Wardrobe** navigates the user to the Virtual Wardrobe flow.
4. Tapping **Style Me Now** navigates the user to the Style Me flow.
5. Tapping **Fine Tune My Profile** navigates the user to the Profile settings flow.
6. The Home Screen does not show a back (`<`) button — it is the root screen.

---

### Story 3: Back Button Returns User to Home Screen

**Title:** Back Button Returns User to Home Screen

**Description:** As a user, I want a `<` button on the top left of every screen (except Home), so that I can return to the Home Screen at any point without getting lost.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Every screen except the Home Screen displays a `<` back button in the top-left corner.
2. Tapping the `<` button from any screen takes the user directly to the Home Screen.
3. Any unsaved state on the current screen is either auto-saved or the user is warned before navigating away.
4. The button is consistently positioned and sized across all screens.
5. The button is accessible via screen readers and meets minimum tap-target size (44×44pt).

---

### Story 4: First-Time Wardrobe Setup — Choose How to Add Items

**Title:** First-Time Wardrobe Setup: Choose How to Add Items

**Description:** As a first-time user opening the Virtual Wardrobe, I want to see three ways to add my clothes, so that I can start building my wardrobe in the way that suits me best.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. When a user opens Virtual Wardrobe for the very first time (empty wardrobe state), they are shown three options: **Import from Camera Roll**, **Photograph Items**, and **Just Describe It**.
2. This three-option screen is only shown when the wardrobe is empty (first-time state); returning users with existing items see their wardrobe directly.
3. Tapping **Import from Camera Roll** triggers the device's photo library permission prompt and then opens the photo picker.
4. Tapping **Photograph Items** triggers the device's camera permission prompt and opens the in-app camera.
5. Tapping **Just Describe It** opens a text/form-based flow where the user can describe a clothing item without a photo.
6. A `<` button is present in the top-left, returning the user to the Home Screen.
7. The screen includes a brief descriptor or subtitle for each option so users understand what each method involves.

---

### Story 5: Open Device Photo Picker

**Title:** Launch Camera Roll Picker from Wardrobe

**Description:** As a user setting up my wardrobe, I want to open my device's photo library when I tap "Import from Camera Roll," so that I can select clothing photos I've already taken.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Tapping "Import from Camera Roll" triggers the device's native photo library permission prompt if permission has not been granted.
2. If permission is denied, a message is shown explaining why access is needed, with a link to device settings.
3. If permission is granted, the native photo picker opens immediately.
4. The picker allows multi-select mode — the user can select multiple photos in one session.
5. Selection is capped at 20 photos; once 20 are selected, remaining photos are visually disabled and cannot be selected.
6. A counter (e.g. "5/20 selected") is visible within the picker as the user selects photos.
7. The user can tap Cancel to exit the picker and return to the three-option wardrobe entry screen without any photos being imported.

---

### Story 6: Review Screen Shows All Selected Photos

**Title:** Review Screen Shows All Selected Photos

**Description:** As a user, I want to see all the photos I selected in a review screen after choosing them, so that I can confirm my selection before the app processes them.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. After confirming selection in the photo picker, the user is taken to a Review Screen displaying all selected photos as thumbnails in a grid.
2. Each thumbnail clearly shows the photo and has an **X** button overlaid on it.
3. The total count of selected photos is displayed (e.g. "12 photos selected").
4. An **Add More** button is visible and accessible from this screen.
5. An **Extract** button is visible at the bottom of the screen.
6. A `<` button is present in the top-left, returning the user to the Home Screen.
7. The screen scrolls if the number of photos exceeds the visible grid area.

---

### Story 7: Remove Individual Photos Before Extraction

**Title:** Remove Individual Photos Before Extraction

**Description:** As a user, I want to tap the X on any photo thumbnail on the Review Screen, so that I can remove photos I don't want to include without starting over.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Tapping the **X** on a thumbnail immediately removes that photo from the review grid.
2. The photo count updates in real time after removal (e.g. drops from "12" to "11").
3. Removing a photo does not close the screen or reset the rest of the selection.
4. If the user removes all photos, the Review Screen shows an empty state with a prompt to "Add Photos" and disables the Extract button.
5. A removed photo can be re-added using the **Add More** button.

---

### Story 8: Add More Photos Up to the 20-Photo Limit

**Title:** Add More Photos Up to the 20-Photo Limit

**Description:** As a user on the Review Screen, I want to add more photos to my current selection, so that I can include items I missed without losing what I already selected.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Tapping **Add More** reopens the device photo picker in multi-select mode.
2. Already-selected photos are visually marked as selected in the picker so the user knows what's already included.
3. The picker enforces the remaining capacity — if 12 are already selected, only 8 more can be added (counter shows "8 remaining").
4. If the user already has 20 photos selected, the **Add More** button is disabled and a tooltip reads "Maximum 20 photos reached."
5. After confirming additional selections, the user is returned to the Review Screen with the new photos appended to the existing grid.
6. The total count updates to reflect the new total.

---

### Story 9: Trigger Extraction on Selected Photos

**Title:** Trigger Extraction on Selected Photos

**Description:** As a user, I want to tap the Extract button on the Review Screen, so that the app can analyse my photos and identify the clothing items in them.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. The **Extract** button is enabled only when at least 1 photo is present on the Review Screen.
2. Tapping **Extract** triggers the extraction process and immediately navigates the user to the Processing Screen (Story 10).
3. The Extract button is disabled when zero photos are on the Review Screen.
4. A confirmation dialog is shown if the user attempts to navigate away after tapping Extract and mid-extraction has begun.

---

### Story 10: Show Processing Screen During Photo Extraction

**Title:** Show Processing Screen During Photo Extraction

**Description:** As a user, I want to see a dedicated processing screen after tapping Extract, so that I know my photos are being analysed in the background and the app hasn't frozen.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Immediately after tapping Extract, the user is taken to a full Processing Screen — they do not remain on the Review Screen.
2. The Processing Screen displays a visible background process indicator (e.g. animated progress bar, spinner, or per-photo progress tiles) showing extraction is actively running.
3. The screen shows contextual copy to set expectations (e.g. "Analysing your clothes… this may take a moment").
4. If extraction is per-photo, each photo's status is shown individually (e.g. queued → processing → done / failed) so the user can see progress at a granular level.
5. Overall progress is shown (e.g. "7 of 12 items processed").
6. Tapping the `<` button mid-extraction shows a confirmation dialog warning that progress will be lost.
7. When all photos have been processed, the screen automatically transitions to the Results Screen (Story 11) without requiring any user action.
8. If the app is backgrounded during extraction, processing continues and the user is notified via an in-app notification or badge when extraction is complete.

---

### Story 11: Review Extracted Items and Add to Wardrobe

**Title:** Review Extracted Items and Add to Wardrobe

**Description:** As a user, I want to see all the clothing items the app extracted from my photos, so that I can select the ones that are correct and add them to my wardrobe.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. When extraction completes, the Results Screen is shown automatically displaying all extracted clothing items as individual cards or thumbnails.
2. A header displays the total count of items extracted (e.g. "14 items found").
3. Each item card shows the cropped clothing image and any metadata the extraction identified (e.g. item type, colour).
4. All items are selected by default — the user deselects ones they don't want rather than having to select each one manually.
5. Tapping an item card toggles its selected/deselected state, with a clear visual indicator (e.g. checkmark, highlighted border vs. greyed-out).
6. A selected count updates dynamically near the button (e.g. "10 of 14 selected").
7. The **Add to Wardrobe** button is pinned to the bottom of the screen and is enabled only when at least 1 item is selected.
8. Tapping **Add to Wardrobe** saves the selected items to the user's Virtual Wardrobe and navigates the user to the Wardrobe view showing the newly added items.
9. If the user deselects all items, the **Add to Wardrobe** button is disabled and a prompt encourages them to select at least one item.
10. A `<` button is present in the top-left; tapping it shows a confirmation dialog warning that unconfirmed items will be discarded.

---

### Story 12: Persist Wardrobe Items to User Account

**Title:** Save Extracted Items Permanently to User's Wardrobe

**Description:** As a user, I want my confirmed wardrobe items to be saved to my account, so that I can see them every time I return to the app without having to re-upload anything.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. When the user taps **Add to Wardrobe**, all selected items are saved to the user's account in the database before navigating away from the Results Screen.
2. A success confirmation is shown (e.g. toast or inline message: "10 items added to your wardrobe") once items are saved.
3. On returning to the Virtual Wardrobe screen (within the same session, after backgrounding, or after logging back in), all previously saved items are loaded and displayed.
4. Items persist across sessions — logging out and back in does not remove wardrobe items.
5. If the save fails due to a network error, the user is shown an error message and given the option to retry; no items are silently lost.
6. The Wardrobe screen shows a loading state while items are being fetched from the database on re-entry.
7. The first-time three-option entry screen (Story 4) is no longer shown once the wardrobe contains at least one saved item.
8. Each saved item is associated with the authenticated user's account and is not visible to other users.

---

## Extraction Capability Stories

---

### Story 13: Extract Multiple Clothing Items from a Single Photo

**Title:** Identify and Isolate Multiple Clothing Items per Photo

**Description:** As a user, I want the app to detect and extract every clothing item visible in each photo I upload, so that a single photo of an outfit or a flat lay can populate multiple wardrobe entries at once.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. When a photo is processed, the extraction engine scans the entire image and identifies all clothing items present — not just the most prominent one.
2. Each detected item is extracted as a separate wardrobe entry with its own cropped image.
3. The extraction works across common photo types: outfit photos (worn on a person), flat lays, hanging garments, and folded items.
4. Extracted items from the same photo are visually grouped or labelled on the Results Screen so the user can trace which photo each item came from.
5. If a single photo yields multiple items (e.g. a top, trousers, and a belt), all items appear as individual selectable cards on the Results Screen.

---

### Story 14: Handle Unclear or Unrecognised Items Gracefully

**Title:** Flag Items the Extraction Could Not Confidently Identify

**Description:** As a user, I want to know when the app couldn't clearly identify a clothing item from my photo, so that I'm not adding incorrectly labelled items to my wardrobe.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. If the extraction engine detects a region that may be clothing but cannot confidently classify it, the item is flagged with a low-confidence indicator (e.g. "Not sure about this one") on its card.
2. Low-confidence items are still shown on the Results Screen but are deselected by default, requiring the user to opt in.
3. If no clothing items are detected in a photo at all, that photo is shown separately with a message (e.g. "No items found in this photo") and does not contribute to the extracted count.
4. A photo where zero items are found does not cause the overall extraction to fail — other photos are processed normally.
5. The total items count in the header reflects only items the engine could extract, not the number of photos uploaded.

---

### Story 15: Attribute Extracted Items to Source Photo

**Title:** Link Each Extracted Item to Its Source Photo

**Description:** As a system, each extracted clothing item must retain a reference to the photo it was pulled from, so that extraction is traceable and items can be re-processed or reviewed if needed.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Each extracted item record in the database stores a reference to the source photo it was derived from.
2. The bounding box or region coordinates used during extraction are stored alongside the item, enabling re-cropping if needed.
3. If the same garment appears in multiple uploaded photos, the extraction engine creates a separate item entry per appearance — deduplication is handled in a later workflow, not at extraction time.
4. The source photo is retained in the user's storage (or a reference to it) for a defined period to support re-extraction or correction.
5. Extraction metadata (confidence score, detected category, timestamp) is stored per item and accessible to the system for future model improvements.

---

## Story Summary

| # | Title | Flow Stage | Priority |
|---|-------|------------|----------|
| 1 | App Welcome with Mascot Voiceover | Welcome | P0 |
| 2 | Home Screen with Three Primary Actions | Home | P0 |
| 3 | Back Button Returns User to Home Screen | Global | P0 |
| 4 | First-Time Wardrobe Setup — Choose How to Add Items | Virtual Wardrobe | P0 |
| 5 | Open Device Photo Picker | Import Flow | P0 |
| 6 | Review Screen Shows All Selected Photos | Import Flow | P0 |
| 7 | Remove Individual Photos Before Extraction | Import Flow | P0 |
| 8 | Add More Photos Up to the 20-Photo Limit | Import Flow | P0 |
| 9 | Trigger Extraction on Selected Photos | Import Flow | P0 |
| 10 | Show Processing Screen During Photo Extraction | Extraction | P0 |
| 11 | Review Extracted Items and Add to Wardrobe | Results | P0 |
| 12 | Persist Wardrobe Items to User Account | Persistence | P0 |
| 13 | Extract Multiple Clothing Items from a Single Photo | Capability | P0 |
| 14 | Handle Unclear or Unrecognised Items Gracefully | Capability | P0 |
| 15 | Attribute Extracted Items to Source Photo | Capability | P0 |

**Suggested build order:** Stories 3 → 2 → 1 → 4 → 5 → 13 → 14 → 15 → 6 → 7 → 8 → 9 → 10 → 11 → 12
(Extraction capability stories 13–15 should be scoped and spiked before building the UI flow that depends on them.)
