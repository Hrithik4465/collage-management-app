@echo off
title CMS Academy Portal - Android Build System
cls
echo ======================================================================
echo           CMS ACADEMY PORTAL - ANDROID BUILD GENERATOR
echo ======================================================================
echo.
echo Select how you would like to build your Android package:
echo.
echo [1] Cloud Build: Google Play Store Bundle (.aab) - Recommended
echo     (Uses Expo Cloud EAS, no 15GB Android Studio SDK required)
echo.
echo [2] Cloud Build: Standalone APK (.apk) for Direct Device Testing
echo     (Install directly on any Android phone via USB/WhatsApp/Drive)
echo.
echo [3] Local Build: Android App Bundle (.aab) via local Gradle
echo     (Requires local Android SDK and Java installed)
echo.
echo [4] Local Build: Standalone APK (.apk) via local Gradle
echo.
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto EAS_AAB
if "%choice%"=="2" goto EAS_APK
if "%choice%"=="3" goto GRADLE_AAB
if "%choice%"=="4" goto GRADLE_APK
if "%choice%"=="5" goto EXIT
goto INVALID

:EAS_AAB
echo.
echo [!] Starting EAS Cloud Build for Google Play Store (.aab)...
echo [!] If this is your first time, log into your free Expo account when prompted.
npx eas-cli build -p android --profile production
goto END

:EAS_APK
echo.
echo [!] Starting EAS Cloud Build for testing APK (.apk)...
echo [!] If this is your first time, log into your free Expo account when prompted.
npx eas-cli build -p android --profile preview
goto END

:GRADLE_AAB
echo.
echo [!] Building release .aab using local Gradle wrapper...
cd android
call gradlew.bat bundleRelease
echo.
echo [OK] If successful, your AAB is located at:
echo android\app\build\outputs\bundle\release\app-release.aab
cd ..
goto END

:GRADLE_APK
echo.
echo [!] Building release .apk using local Gradle wrapper...
cd android
call gradlew.bat assembleRelease
echo.
echo [OK] If successful, your APK is located at:
echo android\app\build\outputs\apk\release\app-release.apk
cd ..
goto END

:INVALID
echo [!] Invalid selection. Please choose a number from 1 to 5.
pause
goto EXIT

:END
echo.
echo ======================================================================
echo Build process finished!
echo ======================================================================
pause

:EXIT

