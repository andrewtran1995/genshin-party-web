/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard'],
	rules: {
		'no-descending-specificity': null,
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: [
					'theme',
					'plugin',
					'custom-variant',
					'utility',
					'source',
					'apply',
					'reference',
					'variant'
				]
			}
		]
	},
	overrides: [
		{
			files: ['**/*.svelte'],
			customSyntax: 'postcss-html'
		}
	]
};
