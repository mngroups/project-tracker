module.exports = {
  // An app is never published to npm.
  npm: { publish: false },
  git: {
    commitMessage: "chore: release ${version}",
    push: true,
    tagName: "v${version}",
  },
  github: {
    release: true,
    web: true,
    releaseName: "v${version}",
    releaseNotes(context) {
      return context.changelog;
    },
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: {
        name: "conventionalcommits",
        types: [
          { type: "feat", section: "Added" },
          { type: "fix", section: "Fixed" },
          { type: "test", section: "Test" },
          { type: "perf", section: "Improved" },
          { type: "change", section: "Changed" },
          { type: "remove", section: "Removed" },
        ],
      },
      infile: "CHANGELOG.md",
      ignoreRecommendedBump: true,
      // Start a new changelog section only at stable tags. By default every
      // rc tag opens one, so a stable release's notes came out as a stack of
      // "1.2.2-rc.N" headings instead of a single "1.2.2" section. rc releases
      // are unaffected: their range never spans another tag.
      writerOpts: {
        generateOn: (commit) => /^\d+\.\d+\.\d+$/.test(commit.version ?? ""),
      },
    },
  },
};
