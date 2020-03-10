module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            legacyDecorators: true
        }
    },
    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    extends: 'standard',
    // required to lint *.vue files
    plugins: [
        'html'
    ],
    // add your custom rules here
    'rules': {
        // allow paren-less arrow functions
        'arrow-parens': 0,
        // allow async-await
        'generator-star-spacing': 0,
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,

        'indent': 0, //['error', 4],
        'space-before-function-paren': ['error', 'never'],
        'camelcase': 0,
        'padded-blocks': 0,
        'no-multiple-empty-lines': 0,
        "quotes": 0,
        "semi": 0,
        'no-unused-vars': 0,
        'no-useless-constructor': 0,
        'no-path-concat': 0,
        'import/first': 0,
        'no-useless-return': 0,
        'no-mixed-operators': 0,
        'no-use-before-define': 0,
        'space-before-function-paren': 0,
        'prefer-promise-reject-errors': 0,
        'no-useless-call': 0,
        'promise/param-names': 0,
        'no-undef': 1,
    }
}
