//beekeeper v2 test

const {fork} = require('child_process');
const forever = require('forever-monitor');
const fs = require('fs');
const path = require('path');
const md5 = require('md5');

//customize stdout
//log filename

const setFilename = __dirname + '/../stream/out/commands.txt'
const setlog = __dirname + '/../stream/in/income.txt';

const myOutStream = fs.createWriteStream(setlog);
				process.stdout.write = myOutStream.write.bind(myOutStream);

const stdoutSet = () => {
	const myOutStream = fs.createWriteStream(setlog);
	return myOutStream.write.bind(myOutStream);
}

//script var
let bees_array = new Map();


//promise for keep message
const recieveMessage = () => {
	return new Promise((resolve, reject)=> {
		process.on('message', (object) => {
			resolve(object);
		})

		process.on('error', (error) => {
			reject(error);
		})
	})
};

//promise for keep message from child process
const recieveMessageFromChild = (child_process) => {
	return new Promise((resolve, reject) => {
		child_process.on('message', (object)=> {
			resolve(object);
		})

		child_process.on('error', (error)=> {
			reject(error);
		})
	})
}

//promise for forever exec script
const keepMessageFromForeverProcess = (child) => {
	return new Promise((resolve, reject) => {
		child.on('stdout', (data)=>{
			resolve(data);
		});
		child.on('stderr', (error)=>{
			reject(error);
		});
	})
}

//promise for forever watch script
const keepChangeFromChildProcess = (child) => {
	return new Promise((resolve, reject) => {
		child.on('restart', (info) => {
			resolve('restart');
		});

		child.on('stop', () => {
			resolve('stop');
		});

		child.on('exit', () => {
			reject('exit');
		});
	})
}

//promise for read stream
const readStream = () => {
	let content = null;
	return new Promise((resolve, reject)=>{
		content = fs.readFileSync(setFilename);
		resolve(content.toString());
	});
}

//new bee preparing
const processingBeeForever = (object) => {

	//BURN command detected
	if(object.status == 'burn'){

		//if this unique pair

		if(bees_array.has(object.hash) === false) {
			const beeCommand = __dirname + `/bee.js`;
			const bee = new (forever.Monitor)(beeCommand, {
				max: 3,
				silent: true,
				args: [object.compile, object.outfile]
			});

			bee.start();

			bees_array.set(object.hash, bee);

			//return bee's answer
			return keepMessageFromForeverProcess(bee);
		}

		else {
			return { status: 'skip', message: 'this pair was exist' };
		}
	}

	//STOP command detected
	if(object.status == 'stop'){

		//clear working processes
		if(bees_array.size){
			bees_array.forEach((value, key) => {
				value.stop();
			});
		}

		//return end message
		return { status: 'end', message: 'close all working processes\n'};

	}

	return null;
}

//create answer object
const getParseCommand = (command_string) => {
	let result = {};
	let arg = command_string.split(' ');

	if(arg[0] == 'BURN') {
		let hash = md5(arg[1] + arg[2]);
		const c_path = arg[1];
		const o_path = arg[2];
		result = {
			status: 'burn', 
			compile: c_path, 
			outfile: o_path,
			hash: hash
		};
	}

	if(arg[0] == 'STOP') {
		result = {status: 'stop'};
	}

	return result;
}

//
const processingObject = (object) => {

	//last remember hash
	let keyHash = null;

	//check command
	if(object.command == 'START') {

		//report to parrent about success
		process.send({status: 'success', message: 'ready to watch file'});
		//process.stdout.write('');


		//start listen new command
		fs.watch(setFilename, (event, filename) => {
			if(filename) {
				//
				//process.send({status:'success', message: 'watching file'});
				process.disconnect();
				
				//
				readStream()
					.then((content)=>{

						//
						const answer = getParseCommand(content);

						//
						if(answer.status == 'stop'){
							return processingBeeForever(answer);
						}

						//
						if(answer && (answer.hash != keyHash)){
							keyHash = answer.hash;
							return processingBeeForever(answer);
						}
					})
					.then((report)=>{

						//report from promise
						if(report){

							if(report.status == 'skip' || report.status == 'success'){
								process.stdout.write(report.message + '\n');
								return null;
							}
							if(report.status == 'end'){
								process.stdout.end('processes stopped\n');
								process.exit();
							}

							process.stdout.write('pid: ' + report);
							return null;
						}

						return null;
					})
			}
		});
	}
	else {
		//report to parrent about success
		process.send({status: 'undefined', message: 'command START not detected'});
		process.stdout.end('exit code: 1');
		process.exit();
	}
}

//waiting START message from parrent and watching filestream change
recieveMessage().then((object)=>{processingObject(object)});