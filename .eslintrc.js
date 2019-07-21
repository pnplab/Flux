module.exports =
{
  "env": {
    "es6": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:flowtype/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2019,
    "ecmaFeatures": {
      "jsx": true,
      "impliedStrict": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "flowtype"
  ],
  "rules": {
    "indent": [
      "error",
      4,
      {
        "FunctionExpression": {
          "body": 1,
          "parameters": "first"
        }
      }
    ],
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        "args": "none",
        "ignoreRestSiblings": false
      }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "flowtype/use-flow-type": 1,
    "flowtype/valid-syntax": 1,
    "no-console": "off",
    // Disable process.env as I couldn't mock process.env with jest. Thus we
    // force to use a global config file instead of process.env which we can
    // mock.
    "no-process-env": "error", 
    // Disable react/no-unescaped-entities as this only make sense for web app
    // and we're doing native (at least to my opinion).
    "react/no-unescaped-entities": "off"
  },
  "settings": {
    "flowtype": {
      "onlyFilesWithFlowAnnotation": true
    }
  }
};

