#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');
const path = require('path')
const pkg = require("./package.json");

//command to daemon process
const {starter, sendler} = require('./components/starter/starter.js');
const checkingFiles  = require('./components/check_arg/check_arg.js');

const parceRes = (res)=>{
	const regexp = /pid\: (\d*)/i;
	let rep = null;
	if(rep = res.match(regexp)){
		let new_pair = {
			pid: rep[1],
			compile: file_compile_path,
			out: file_css_path
		}

		return new_pair
	}
	return null;
}

//if burn coomand 
const burnComma = (compile, upd) => {

	//current state of app
	let infobj = require('./state.json');

	//the app path
	const exec_app_path = infobj.project_dir === "" 
		? process.cwd() 
		: infobj.project_dir;

	//
	const execCommand = async (property) => {
		//daemon process not exist
		if(infobj.active == false){
			//
			return await starter(property);
		}
		else {
			//
			return await sendler(property);
		}
	}

	checkingFiles(compile, upd, exec_app_path).then((res)=>{
		//info for daemon process
		const property = {
			active: infobj.active,
			script: path.join(__dirname, "/scripts/beekeeper.js"),
			fi: path.join(__dirname, "/stream/in/income.txt"),
			fo: path.join(__dirname, "/stream/out/commands.txt"),
			command: `BURN ${res.file_compile_path} ${res.file_css_path}`
		}

		//
		infobj.last_command = property.command;

		console.log('creating process...');
		return execCommand(property);
	}).then((res)=>{
		//
		if(res == false){
			console.error('[ERROR] script working bad');
			process.exit(2);
		}

		//
		let rep;
		if(rep = parceRes(res)){
			infobj.active = true;
			infobj.current_pairs.push(rep);
			const data = JSON.stringify(infobj);
			fs.writeFile(__dirname + '/state.json', data, 'utf8', (err)=>{
				if(err){
					console.error('[ERROR] problem with state.json')
					process.exit(3);
				}
			});
		}

		console.log('[OK] ' + res);
		setTimeout(()=>{process.exit(0)}, 1000);
	});
}

const stopComma = () => {
	let infobj = require('./state.json');

	const property = {
		active: infobj.active,
		script: path.join(__dirname, "/scripts/beekeeper.js"),
		fi: path.join(__dirname, "/stream/in/income.txt"),
		fo: path.join(__dirname, "/stream/out/commands.txt"),
		command: `STOP ALL PRCS`
	}

	const execComma = async () => {
		return await sendler(property);
	}

	console.log('close...')
	if(infobj) execComma().then((res)=>{
		if(res === false){
			console.log('[ERROR] uncaught error');
			process.exit(3);
		}

		console.log('[OK] '+ res);
		return res;
	}).then(()=>{
		infobj.active = false;

		infobj.current_pairs = [];
		infobj.last_command = property.command;

		const data = JSON.stringify(infobj);
		fs.writeFile(__dirname + '/state.json', data, 'utf8', (err)=>{
			if(err){
				console.error('[ERROR] problem with state.json')
				process.exit(3);
			}
		});
	})
	else console.log('[OK] process has already been stopped')
}

const infoComma = () => {
	infobj = require('./state.json');
	console.log(infobj);
}

commander
	.version('1.0.0')
	.description('.sass/.scss to .css convertor.');

commander
	.command('burn <compile> [upd]')
	.description('autoconverting silent process')
	.action((compile, upd) => {
		burnComma(compile, upd);
	});

commander
	.command('stop')
	.description('exit of all processess')
	.action(() => {
		stopComma();
	});

commander
	.command('info')
	.action(()=>{
		infoComma();
	})

commander.parse(process.argv);