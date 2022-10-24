#!/usr/bin/env node
import { Command } from 'commander';
import version from '../version';
import { makeBuildCLI } from './build';

const program = new Command();

program.addCommand(makeBuildCLI(program));
program.version(`v${version}`, '-v, --version', 'Print the current version of curvenote');
program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);