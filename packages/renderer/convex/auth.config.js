// convex/auth.config.js (Corrected applicationID)
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: process.env.CONVEX_APP_ID, // Use environment variable!
    },
  ],
};