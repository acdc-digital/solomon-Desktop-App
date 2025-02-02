     ____        _                             
    / ___|  ___ | | ___  _ __ ___   ___  _ __  
    \___ \ / _ \| |/ _ \| '_ ` _ \ / _ \| '_ \ 
     ___) | (_) | | (_) | | | | | | (_) | | | |
    |____/ \___/|_|\___/|_| |_| |_|\___/|_| |_|

Welcome!

Our Goal at ACDC.digital is to create a Full-Service workstation which enables ERP (enterprise resource planning) with integrated artificial intellgent assistants. To be a part of our jounrey, you can begin by cloning our repository and following the below steps to get started with our ongoing development:

## Try our Domain

**Deployment**   
solomon-desktop-33o1isx0l-acdcdigitals-projects.vercel.app

**Domain**   
https://solomon-desktop-app.vercel.app/

## Clone our Repo
**git clone https://github.com/acdc-digital/solomon-Desktop-App.git**

Once cloned ensure you have pnpm installed (if not already): npm install -g pnpm

1. pnpm install
2. **Optional development mode:** pnpm run dev
3. pnpm run build
4. pnpm run start

**Note:** currently we're using 'electron-builder' which provides some advanced functionality that will be more important later on during development. electron-builder is a popular alternative for generating more advanced binaries/installers (like .dmg, .exe/NSIS, .AppImage, .deb etc.). The pitfall is that the builder takes a little longer but it works none-the-less.   
**Note2:** I've temporarilty disabled the "prestart": "npm run build" to avoid generating a completely fresh build every time simply to expedite the above concern.

## Development Logs 
To Begin, we'll be launching our application on Vercel, and using Electron's Auto-Updater, we're able to manually change the versions in our package.json to seamlessly ship updates to the deployed front-end. We will eventually move to the Vercel direct CI/CD (but we're beta-testing for now).

**Heading into Development:** We'll begin by hosting our Front-End on Vercel. Whereas Electron is maintained in a local environment, we'll host our Next.Js architecture on Vercel to enhance the scalability of the application, and ease auto-updates as our application development progresses. Ie; The Next.js front end (hosted on Vercel) and the Electron shell (packaged and distributed separately) allow you to update your UI frequently without forcing a full update of the desktop app. This separation is a best practice for maintainability and user experience.
