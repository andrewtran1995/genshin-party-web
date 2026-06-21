/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard'],
	rules: {
		'no-descending-specificity': null,
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }]
	},
	overrides: [
		{
			files: ['**/*.svelte'],
			customSyntax: 'postcss-html'
		}
	]
};
