import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import mystToTypst from '../src/index.ts';

// Read YAML file
const content = fs.readFileSync(
  path.join('tests/sidebyside.yml'),
  { encoding: 'utf-8' }
);

// Parse YAML
const cases = yaml.load(content) as unknown;

const mdast = cases.cases[2].mdast;

const pipe: any = unified().use(mystToTypst);

pipe.runSync(mdast);
const file = pipe.stringify(mdast);

console.log(file);
