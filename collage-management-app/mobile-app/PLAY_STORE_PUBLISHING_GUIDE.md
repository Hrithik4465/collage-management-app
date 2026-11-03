# Google Play Store Publishing Guide: CMS Academy Portal

This guide provides everything you need to build, sign, and publish the **CMS Academy Portal** to the Google Play Store.

---

## 1. App Configuration & Package Identity

| Configuration | Value |
| :--- | :--- |
| **App Name** | `CMS Academy Portal` |
| **Package Name (Application ID)** | `com.cms.academyportal` |
| **Initial Version** | `1.0.0` |
| **Version Code** | `1` |
| **Min Android Version** | Android 7.0 (API 24) or Android 8.0 (API 26) |
| **Target Android Version** | Android 14 / 15 (API 34 / 35 - Play Store 2024–2026 requirement) |
| **Architecture** | React Native (Expo SDK 58) + Native Android Project (Gradle 9.4) |

---

## 2. Release Signing Credentials (Keystore)

A production-grade RSA 2048-bit keystore has been generated and pre-linked to your Gradle build system:

* **File Location**: 
  * `collage-management-app/mobile-app/release.keystore`
  * `collage-management-app/mobile-app/android/app/release.keystore`
* **Keystore Alias**: `cmsportal`
* **Keystore Password**: `cmsportal2026`
* **Key Password**: `cmsportal2026`
* **Validity**: 10,000 days (~27 years)
* **Distinguished Name**: `CN=CMS Academy, OU=Education, O=CMS Academy, L=New Delhi, ST=Delhi, C=IN`

> [!IMPORTANT]
> Keep a safe backup of `release.keystore` and its passwords in a secure location (e.g., Google Drive or password manager). Google Play requires this exact key to publish future updates for your app.

---

## 3. How to Build the Package

You have three options for generating your build artifacts:

### Method A: One-Click Cloud Build (Recommended — No Android Studio Needed)
Double-click `build_android_app.bat` in `collage-management-app/mobile-app/`:
1. Choose **Option [1]** to build a **Google Play Store App Bundle (`.aab`)**.
2. Choose **Option [2]** to build a **Standalone APK (`.apk`)** for testing on physical devices before publishing.

Alternatively, from the command prompt:
```bash
cd collage-management-app/mobile-app
npx eas-cli build -p android --profile production
```

### Method B: Automated GitHub Actions (Free Cloud CI/CD)
Whenever you push your code to GitHub:
1. Navigate to your repository's **Actions** tab.
2. Select **Build Android App (Play Store AAB & APK)** and click **Run workflow**.
3. In ~5 minutes, download both:
   * `CMS-Academy-Portal-PlayStore-AAB.zip` (upload this to Play Store)
   * `CMS-Academy-Portal-Release-APK.zip` (install this on your phone)

### Method C: Local Android Studio Build
1. Open Android Studio.
2. Select **Open an existing project** and choose `collage-management-app/mobile-app/android`.
3. Go to **Build** → **Generate Signed Bundle / APK...**
4. Select **Android App Bundle**, choose `release.keystore` with alias `cmsportal`, and click **Finish**.
5. Your `.aab` file will be generated in `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 4. Google Play Console Submission Steps

### Step 1: Create Your Google Play Developer Account
1. Go to [Google Play Console](https://play.google.com/console).
2. Sign in with your Google account and pay the one-time registration fee ($25 charged by Google).
3. Complete developer identity verification.

### Step 2: Create a New App
1. In Google Play Console, click **Create app**.
2. Enter:
   * **App name**: `CMS Academy Portal`
   * **Default language**: English (United States) or English (India)
   * **App or game**: App
   * **Free or paid**: Free
3. Accept the Declarations and click **Create app**.

### Step 3: Complete App Content Declarations
Under the **Policy and programs** section, complete the required questionnaires:
* **Privacy Policy**: Provide a public URL (e.g. hosted on your portal or GitHub Pages).
* **App Access**: Choose *"All or some functionality is restricted"* and provide a demo login (`student@college.com` / `admin123`) so Google's review team can test the app.
* **Ads**: Select *"No, my app does not contain ads"*.
* **Content Rating**: Complete the IARC questionnaire (Education category).
* **Target Audience**: Select age 13+ (Students & Faculty).
* **Data Safety**: Declare that login credentials and educational records are encrypted in transit via HTTPS.

### Step 4: Set Up Store Listing Assets
Upload the following required graphics:
1. **App Icon**: `512 x 512 px` (PNG, 32-bit color).
2. **Feature Graphic**: `1024 x 500 px` (PNG/JPEG banner).
3. **Screenshots**: At least 2 phone screenshots (taken from your phone or browser device simulator).
4. **Short Description** (up to 80 characters):
   > *Smart academy portal for students & faculty: attendance, assignments, and tests.*
5. **Full Description** (up to 4000 characters):
   > *CMS Academy Portal is a comprehensive college management mobile app designed for students, faculty, and administrators. Track real-time course progress, access syllabi and study materials, submit assignments, take online quizzes, and stay updated with official campus notices.*

### Step 5: Upload the `.aab` and Release
1. In the left menu, go to **Production** (or **Closed testing** first to test with peers).
2. Click **Create new release**.
3. Drag and drop your `app-release.aab` file.
4. Set release name: `1.0.0 (Initial Release)`.
5. Click **Next** → **Save** → **Review release** → **Start rollout to Production**.

Google review typically takes **1 to 3 business days**, after which your app will be live and downloadable by anyone on the Google Play Store!

