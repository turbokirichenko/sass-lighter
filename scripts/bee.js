//bee
fs = require('fs');
convSync = require('../components/converter/convSync.js');


//start working
logFile('success: start ' + process.pid);
const compile = process.argv[2];
const outfile = process.argv[3];

console.log(process.pid);
fs.watch(compile, (event, filename) => {
	const newStream = fs.createWriteStream(outfile);
	newStream.write(convSync({file: compile, out: outfile}));
});


process.on('exit', () => {
	logFile('exited');
});