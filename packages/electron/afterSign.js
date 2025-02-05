const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appPath}`);

  await notarize({
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, // Use app-specific password
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log(`Finished notarizing ${appPath}`);
};