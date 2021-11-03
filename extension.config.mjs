import svg from 'rollup-plugin-svg-import';
import { terser } from 'rollup-plugin-terser';
import analyze from 'rollup-plugin-analyzer';

export default {
	plugins: [
		svg({
			// process SVG to DOM Node or String. Default: false
			stringify: true,
		}),
		terser({
			ecma: 2019,
		}),
		analyze(),
	],
};
