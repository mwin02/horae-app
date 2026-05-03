/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (/** @type {any} */ _config) => ({
  type: "widget",
  name: "HoraeWidget",
  deploymentTarget: "16.1",
  icon: "../../assets/images/icon.png",
  // Widget extensions hosting Live Activities must declare this in their
  // own Info.plist (the host app declares it separately in app.json).
  infoPlist: {
    NSSupportsLiveActivities: true,
  },
  // Shared with the host app via app.json's ios.entitlements so the
  // home-screen widget can read the running-timer snapshot the app writes.
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.myozawwin.horae.shared",
    ],
  },
});
