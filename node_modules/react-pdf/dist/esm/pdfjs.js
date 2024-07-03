import * as pdfjsModule from 'pdfjs-dist';
const pdfjs = ('default' in pdfjsModule ? pdfjsModule['default'] : pdfjsModule);
export default pdfjs;
