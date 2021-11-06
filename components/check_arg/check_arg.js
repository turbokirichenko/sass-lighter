const path = require('path');
const fs = require('fs');


//check file
const hasAccess = (path) => {
	return new Promise((resolve, reject)=>{
		fs.access(path, fs.constants.F_OK, (err)=>{
			if(err) reject(false);
			resolve(true);
		})
	})
}

const checkingFiles = (compile, upd, exec_app_path) => {
	//parsing path and check access
	if (compile && upd) {
		let scss_path = path.normalize(path.join(exec_app_path, compile));
		let css_path = path.normalize(path.join(exec_app_path, upd));
		return Promise.all([hasAccess(scss_path), hasAccess(css_path)]).then((res)=>{
			file_css_path = css_path;
			file_compile_path = scss_path;

			return new Promise((resolve)=>{
				resolve({file_compile_path, file_css_path});
			})

		}).catch((res)=>{
			if(res == false){
				console.log('[FALSE] no access file: ' + css_path);
			}
			process.exit(1);
		})
	}
	else {
		console.error('[FALSE] wrong params');
		process.exit(1);
	}
}

module.exports = checkingFiles;
