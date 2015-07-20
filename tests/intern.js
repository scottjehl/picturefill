define({
  proxyPort: 9000,
  proxyUrl: "http://localhost:9000/",
  capabilities: {
    "selenium-version": "2.45.0"
  },
  environments: [
    //{ browserName: "safari"},
    //{ browserName: "chrome"},
    { browserName: "firefox"},
    //{ browserName: "internet explorer", version: "11"},
    //{ browserName: "internet explorer", version: "10"},
    //{ browserName: "internet explorer", version: "9"},
    //{ browserName: "internet explorer", version: "8"},
    //{ browserName: "safari", version: "6"},
    //{ browserName: "safari", version: "7"}
  ],
  maxConcurrency: 3,
  suites: [ "intern/node_modules/dojo/has!host-browser?tests/tests" ],
  functionalSuites: [],
  tunnel: "BrowserStackTunnel",
  excludeInstrumentation: /^(?:tests|node_modules)\//
});
