export const WYSIWYG_Style = `

/* Not Active Lines */
div:not(.CodeMirror-activeline) >
.CodeMirror-line span.cm-formatting:not(.cm-formatting-list):not(.cm-image):not(.cm-url):not(.cm-link) /* not(.cm-formatting-code-block) */ {
  display: none !important;
}

/* H1 Underline */
.cm-s-obsidian pre.HyperMD-header-1:after {
  content: "";
  position: absolute;
  bottom: 5px;
  left: 5px;
  width: calc(100% - 10px);
  height: 1px;
  background: var(--text-accent);
}

.cm-s-obsidian pre.HyperMD-header-1{
  padding-bottom: 5px;
}

/* except numbered list */
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-list {
   display: inline !important;
}

span.cm-formatting-list,
span.cm-formatting-code-block.cm-hmd-codeblock,
span.cm-formatting-header {
  display: inline !important;
}

/* and task checkboxes */
span.cm-formatting-task {
  display: inline !important;
  font-family: monospace;
}

/* Checkboxes instead of brackets in edit mode */
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-task.cm-meta,
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-task.cm-property {
    color: transparent;
    position: relative;
    display: inline !important;
    margin-right: -0.1rem;
}

div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-task.cm-meta:after,
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-task.cm-property:after {
    content: "○";
    position: absolute;
    top: 3px;
    left: 4px;
    color: rgb(219, 95, 12);
    font-size: calc(var(--editor-font-size) * 1.2);
    text-align: center;
}

div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting-task.cm-property:after {
  content: "✓";
  color: rgb(124, 131, 124) !important;
}

span.cm-formatting-task.cm-property ~ span {
  text-decoration: line-through;
  color: rgb(124, 131, 124) !important;
}

/* highlight (==) not visible anymore if not active line */
div:not(.CodeMirror-activeline) > .CodeMirror-line .cm-formatting-highlight.cm-highlight {
 font-size: 0;
}

/* Blockquote */
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-formatting.cm-formatting-quote,
div:not(.CodeMirror-activeline)>.CodeMirror-line span.cm-hmd-indent-in-quote {
  display: inline !important;
  color: transparent !important;
}

div:not(.CodeMirror-activeline)>.HyperMD-quote {
	 background-color: var(--background-primary-alt);
   border-left: 3px solid var(--text-selection);
   border-color: red !important;
   font-size: var(--editor-font-size) !important;
   line-height: 1.5em;
   margin-left: 5px;
   padding: 10px 6px 10px 6px;
   display: inline-block;
   width: 100%;
}

/* Tags */
div:not(.CodeMirror-activeline) > .CodeMirror-line span.cm-hashtag-end:before {
   content: '';
}

.tag, div:not(.CodeMirror-activeline) > .CodeMirror-line span.cm-hashtag-end {
  background-color: var(--text-accent);
  border: none;
  color: white;
  font-size: var(--editor-font-size) !important;
  padding: 0px 6px !important;
  padding-top: -2px;
  padding-bottom: 2px;
  text-align: center;
  text-decoration: none !important;
  display: inline-block;
  margin: 0.5px 0.5px;
  cursor: pointer;
  border-radius: 14px;
}

`;
