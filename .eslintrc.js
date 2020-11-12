module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/ban-ts-comment': 0,
		'prefer-const': 0,
		'@typescript-eslint/no-this-alias': 0,
		'no-empty': 0,
		'@typescript-eslint/ban-types': 0,
		'@typescript-eslint/no-explicit-any': 0,
	},
};
