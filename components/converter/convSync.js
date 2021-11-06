const sass = require('sass');

const convertToStream = (object) => {

	const prop_obj = {
		file: object.file,
		outfile: object.out,
		sourceMap: false,
		outputStyle: "compressed"
	}

	return sass.renderSync(prop_obj).css.toString();
}

module.exports = convertToStream;