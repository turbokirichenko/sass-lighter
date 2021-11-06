const sass = require('sass');

const conv = (filename, outfile) => {
	const result = sass.renderSync({
		file: filename,
		outputStyle: "compressed",
		outfile: outfile,
		sourceMapEmbed: false

	});
	console.log(result.css.toString());
	return result.css.toString();
}

module.exports = conv;