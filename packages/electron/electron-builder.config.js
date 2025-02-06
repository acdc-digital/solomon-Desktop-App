// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/electron-builder.config.js

const config = {
    appId: "com.solomon.desktop",
    productName: "Solomon Desktop App",
    files: [
      "package.json",
      {
        from: "dist",
        to: ".", 
        filter: ["**/*"]
      },
      {
        from: "../renderer/out",
        to: "renderer",
        filter: ["**/*"]
      }
    ],
    linux: {
      target: [
        "AppImage"
      ]
    },
    mac: {
      category: "public.app-category.productivity",
      target: ["dmg", "zip"],
      hardenedRuntime: true,
      entitlements: "entitlements.mac.plist",
      entitlementsInherit: "entitlements.mac.inherit.plist"
    },
    dmg: {
      contents: [
        {
          "x": 410,
          "y": 150,
          "type": "link",
          "path": "/Applications"
        },
        {
          "x": 130,
          "y": 150,
          "type": "file"
        }
      ]
    },
    win: {
      target: [
        "nsis"
      ]
    },
    afterSign: "./afterSign.js",
  };
  
  if (process.env.PUBLISH_FOR_REAL === "true") {
    config.publish = [
      {
        provider: "github",
        owner: "acdc-digital",
        repo: "solomon-Desktop-App",
      },
    ];
  }
  
  module.exports = config;