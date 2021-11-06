const { fork } = require('child_process');
const fs = require('fs');

//### PROMISES ###

//promise
const keepMessageFromChild = (child_process) => {
	//waiting event from child process
	return new Promise((resolve, reject) => {
		child_process.on('message', (object)=> {
			resolve(object);
		});

		child_process.on('error', (error)=> {
			reject(error);
		});
	})
}

//promise
const keepMessageFromStream = (stream) => {
	let content = null;

	//read from file
	return new Promise((resolve, reject)=>{
		setTimeout(()=>{
			content = fs.readFileSync(stream);
			resolve(content.toString());
		}, 1000);
	});
}

///### DEV DEPENDIES FUNCTION ###

//create new beekeeper
const oneBeekeeper = async (script) => {
	//
	const beekeeper = fork(script, {
		detached: true
	});

	//
	beekeeper.send({command: 'START'});

	return await keepMessageFromChild(beekeeper);
} 

//
const parseChunk = (chunk) => {
	let arr = chunk.toString().split('\n').reverse();
	return {status: 'ok', mes: arr[1]};
}

///### EXPORT MAIN FUNCTION ###

//if beekeeper works
const sendler = (property) => {
	let itworks = false; 

	//file in/out
	fileIn = property.fi;
	fileOut = property.fo;

	return new Promise((resolve, reject) => {
		//create write stream
		const writeStream = fs.createWriteStream(fileOut);

		//write command to file
		writeStream.write(property.command);
		keepMessageFromStream(fileIn)
		.then((chunk)=>{

			//parse chunk
			if(chunk){
				itworks = parseChunk(chunk).mes;
			}
			else itworks = 'no data';
			resolve(itworks);
		})
		.catch((err)=>{
			itworks = false;
			reject(itworks);
		});
	})

	//read message from file
}

//on beekeeper
const starter = (property) => {
	let itworks = false; 

	//read file
	const fileIn = property.fi;
	const fileOut = property.fo;
	return oneBeekeeper(property.script)
		.then((report)=>{
			if(report.status == 'success'){
				
				//
				return sendler(property);
			}
			return null;
		})
}


//export functions as object
module.exports = {starter, sendler};