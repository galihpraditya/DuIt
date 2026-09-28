export interface AppConfig {
  version: string;
  buildNumber: number;
  appName: string;
  githubRepo: string;
  latestApkDownloadUrl: string;
  releasesPageUrl: string;
}

export const APP_CONFIG: AppConfig = {
  version: '2.0.0',
  buildNumber: 2,
  appName: 'DuIt Expense Tracker',
  githubRepo: 'galihpraditya/DuIt',
  // Static permanent download link for the latest release APK on GitHub Releases
  latestApkDownloadUrl: 'https://github.com/galihpraditya/DuIt/releases/latest/download/DuIt-Wallet-latest.apk',
  releasesPageUrl: 'https://github.com/galihpraditya/DuIt/releases/latest',
};
