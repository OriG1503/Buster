import { resolve } from 'path';

const FILES_ROOT = resolve(process.cwd(), '../../files');

export const TMP_DIR = `${FILES_ROOT}/tmp`;
export const UPLOADS_DIR = `${FILES_ROOT}/uploads`;
export const REPORTS_DIR = `${FILES_ROOT}/reports`;
