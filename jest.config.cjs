module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.teardown.js'],
};
