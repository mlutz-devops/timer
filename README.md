# Tempo

A responsive, dark-only React workout timer built with **shadcn/ui**, Radix UI, and Tailwind CSS v4. Create and reorder exercises, configure timed reps and sets, and follow a distraction-free countdown with pause, previous, and next controls.

## Run locally

Requires Node.js **22.12+** (or a newer supported LTS).

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview` serves the production build. Browser tests cover desktop and mobile Chromium; Linux may need Playwright’s system dependencies (`npx playwright install --with-deps chromium`).

## Container and registry

The container serves the production frontend with Nginx on port **80**. Build and run locally:

```sh
docker build -t tempo .
docker run --rm -p 8080:80 tempo
```

Open `http://localhost:8080`. In your cluster, point the Service's `targetPort` at `80`.

`.github/workflows/push-image.yml` runs on every push (or manually) on a **self-hosted** GitHub Actions runner. It publishes `ghcr.io/<owner>/<repository>:latest` and a `sha-<commit>` tag; pushing a version tag such as `v1.0.0` also publishes that version tag. Each tag is a multi-platform image supporting **linux/amd64** and **linux/arm64**, so the cluster automatically pulls the correct architecture for each node.

The runner needs Docker and permission to run privileged containers for QEMU setup. Registry authentication uses the built-in `GITHUB_TOKEN` with `packages: write`; no extra secret is required. If an existing GHCR package rejects the push, grant this repository Actions access in the package settings. For a private package, configure your cluster's `imagePullSecrets` with credentials allowed to read it, or make the package public.

As in the example workflow, every push updates `latest`, including pushes to other branches. Use a version or commit tag when pinning a cluster deployment.

## Behavior

- Selecting a workout opens its first rep in a ready state. Press **Start** to begin the countdown; that same button then becomes **Pause / Resume** for the rest of the session. Rep navigation is disabled until starting. **Restart workout** opens a fresh ready state after completion.
- Each exercise uses one rep duration and one rest duration for all its reps and sets.
- Rest runs between every rep, including between sets and exercises, using the preceding exercise’s setting. There is no rest after the workout’s final rep.
- Next skips to the following rep. Previous returns to the preceding rep; during rest it restarts the rep just completed. Navigation resets the rep’s duration and preserves pause state.
- Absolute deadlines keep the clock from drifting when timer callbacks are delayed. The app catches up when a background tab becomes visible again; it cannot guarantee background execution while a browser or device is suspended.
- Exiting pauses the timer while asking for confirmation. Canceling resumes it only if it was running beforehand.
- Workout definitions are saved on this browser/device using `localStorage`. Active sessions are not persisted, so refreshing returns to the library. No accounts, server, or tracking.
- Two editable sample workouts appear on the first visit. Deleting every workout keeps the library empty on future visits.
- Storage errors are shown without crashing. Unreadable saved data is not replaced until the user makes a change.
- Dark mode is permanent, independent of the operating system’s preference. The initial HTML, native form controls, dialogs, and notifications are all dark. There is no light theme or theme toggle.

## Structure

`src/utils/timer.ts` is the pure timer state machine; `workoutTimeline.ts` generates work/rest phases. Hooks handle clock updates and storage. Components render the library, editor, and runner.

Official shadcn/ui New York components live in `src/components/ui/`, with import aliases and registry configuration in `components.json`. Buttons, cards, inputs, labels, badges, dialogs, alerts, separators, progress bars, and Sonner notifications use these components. The Sonner wrapper deliberately fixes the theme to dark rather than requiring `next-themes`. `src/styles.css` defines the single dark token palette and responsive layouts; Tailwind v4 is wired into Vite. Google Fonts are optional and fall back to local sans-serif fonts.
