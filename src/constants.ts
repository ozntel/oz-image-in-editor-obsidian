export const WYSIWYG_Style = `

/* Not Active Lines */
div:not(.CodeMirror-activeline) >
.CodeMirror-line span.cm-formatting:not(.cm-formatting-list) /* not(.cm-formatting-code-block) */ {
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
   background-color:rgb(238, 234, 234);
   border-left: 3px solid var(--text-selection);
   border-color: red !important;
   font-size: 17px;
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
  background-color: #bd6b19;
  border: none;
  color: white !important;
  font-size: 14px;
  padding: 0px 8px;
  padding-top: -2px;
  padding-bottom: 3px;
  text-align: center;
  text-decoration: none !important;
  display: inline-block;
  margin: 1px 1px;
  cursor: pointer;
  border-radius: 14px;
}

`