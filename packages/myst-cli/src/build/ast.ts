import fs from 'node:fs';
import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import {
  FRONTMATTER_ALIASES,
  PAGE_FRONTMATTER_KEYS,
  articlesWithFile,
} from 'myst-frontmatter';
import { filterKeys } from 'simple-validators';
import { finalizeMdast } from '../process/mdast.js';
import type { ISession } from '../session/types.js';
import { ImageExtensions } from '../utils/resolveExtension.js';
import { getFileContent } from './utils/getFileContent.js';
import { cleanOutput } from './utils/cleanOutput.js';
import type { ExportWithOutput, ExportResults, ExportFnOptions } from './types.js';
import { string } from 'zod';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TYPST_IMAGE_EXTENSIONS = [
  ImageExtensions.svg,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export async function localArticleToAST(
  session: ISession,
  templateOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const { articles, output } = templateOptions;
  const { projectPath, extraLinkTransformers, execute } = opts ?? {};
  const fileArticles = articlesWithFile(articles);
  const content = await getFileContent(
    session,
    fileArticles.map((article) => article.file),
    {
      projectPath,
      imageExtensions: TYPST_IMAGE_EXTENSIONS,
      extraLinkTransformers,
      titleDepths: fileArticles.map((article) => article.level),
      preFrontmatters: fileArticles.map((article) =>
        filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
      ),
      execute,
    },
  );

  const toc = tic();
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      await finalizeMdast(session, mdast, frontmatter, fileArticles[ind].file, {
        imageWriteFolder: path.join(path.dirname(output), 'files'),
        imageAltOutputFolder: 'files/',
        imageExtensions: TYPST_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });
      return mdast;
    }),
  );

  session.log.info(toc(`📑 Exported ast in %s, copying to ${output}`));
  session.log.info(`AST: ${JSON.stringify(results, undefined, 2)}`);

  writeFileToFolder(output, JSON.stringify(results[0], undefined, 2));
  if (results.length > 1) {
    session.log.info(toc(`Multi-Article export not yet supported for ast`));
  }

  return { tempFolders: [] };
}

export async function runAstExport( // DBG: Must return an info on whether glossaries are present
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  let result: ExportResults;
  result = await localArticleToAST(session, exportOptions, opts);
  return result;
}