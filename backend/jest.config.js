module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "routes/**/*.js"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"]
};
