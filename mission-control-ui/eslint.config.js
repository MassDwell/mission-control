export default [
  // Node.js files (server, api, tests)
  {
    ignores: ['public/**', 'eslint.config.js', 'node_modules/**'],
    rules: {
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'no-console': 'off'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly'
      }
    }
  },
  // Browser files (public/)
  {
    files: ['public/**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'no-console': 'off'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        // Browser event/DOM APIs
        CustomEvent: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        // Browser storage & observers
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        // JS built-ins
        Object: 'readonly',
        Array: 'readonly',
        // App globals
        MissionControlDrilldown: 'writable',
        AgentActivity: 'writable',
        ActiveWork: 'writable',
        BlockedWork: 'writable',
        WorkstreamFlow: 'writable',
        SystemStatus: 'writable',
        MCMode: 'writable',
        MCStorage: 'writable',
        VentureOS: 'writable',
        VentureGraph: 'writable',
        CommandCenter: 'writable'
      }
    }
  }
];
