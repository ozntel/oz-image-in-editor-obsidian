# Ozan's Image in Editor Plugin

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/ozntel/oz-image-in-editor-obsidian?style=for-the-badge)
![GitHub all releases](https://img.shields.io/github/downloads/ozntel/oz-image-in-editor-obsidian/total?style=for-the-badge)

## 📕 Brief Explanation

-   Plugin helps you to view `images`, `iframes`, `PDF Files` and `transclusions` directly under the Editor view without a necessity to switch to Preview mode.
-   After a nice collaboration with Zsolt, you can now view `excalidraw` drawings within the Editor, as well. Reference: <a href="https://github.com/zsviczian/obsidian-excalidraw-plugin">Excalidraw Plugin</a>
-   The plugin allows you to see both your local images and images from internet.
-   Both `Markdown` and `Wikilinks` formats are supported as described below.
-   You can resize the view of images using `ALT-TEXT` options provided below to ensure that they don't take too much place in your screen as long as it is not needed.

## 📕 Formats Supported

-   `!( ALT-TEXT )[ IMAGE-NAME ]`
    <span style="color: #d1672a">Sample</span>: `![ #x-small ]( myimage.png )`

-   `![[ IMAGE-NAME | ALT-TEXT ]]`
    <span style="color: #d1672a">Sample</span>: `![[ myimage.png | #x-small ]]`

-   `![[ IMAGE-NAME ]]`
    <span style="color: #d1672a">Sample</span>: `![[ myimage.gif ]]`

**Scanned Image Formats** : `jpg`, `jpeg`, `png`, `gif`, `svg`, `bmp`

## 📕 Image View Size

Relative and Absolute Path will give you possibility to add `alt` text for the image. You can decide about the size of the image using following
alt texts:

1. `#small`
2. `#x-small`
3. `#xx-small`

#### New Sizing Feature:

You can now use the formats below to scale the images:

1. **Width x Height**: `![100x100](image.png)`

2. **Width**: `![300](image.png)`

#### Invert Color Feature

Similar to `Minimal Theme`, you can add `#invert` within the `alt-text` to view the images in `invert color` mode:

-   `![[image.png|#invert]]`
-   `![#invert](image.png)`

## 📕 Transclusions Rendering

The plugin now renders the Transclusions within the Editor. You can use both with `block id` and `header`:

-   `![[myFile#^316sd1]]`
-   `![[myFile#Header2]]`

To be able to use this functionality, you need to enable render in plugin settings.

Sample Views:

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/transclusions-header.png" width="70%"/>

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/transclusions-block.png" width="70%"/>

## 📕 Wikilink to Markdown & Markdown to Wikilink

The plugin now also has additional commands to convert:

-   All `Wikilinks` in Vault to `Markdown Links` and `Markdown Links` to `Wikilinks`
-   `Wikilinks` only in `active file` to `Markdown Links` and `Markdown Links` to `Wikilinks`

Sample Video (How does it work?): [Wiki to Md & Md to Wiki](https://www.youtube.com/watch?v=edUSYWErErA)

## 📕 Excalidraw View

Usage with `excalidraw` extension:

-   `![[drawing.excalidraw|ALT-TEXT]]`
-   `!(ALT-TEXT)[drawing.excalidraw]`

Usage with `.md` extension:

-   `![[drawing.md|ALT-TEXT]]`
-   `!(ALT-TEXT)[drawing.md]`

**Important:** If you are using `1.2.x` version of Excalidraw plugin, `Wikilinks` format needs to include `.md` extension, otherwise, drawing won't be rendered in Editor.

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/excalidraw-support.png" width="70%"/>

-   You can now turn on/off rendering option for `Excalidraw` drawings.

## 📕 PDF Render Feature

You can turn on option for rendering the PDF files in the Editor mode.
You can view both from local files and from the internet.
You can also start viewing the `PDF` file from certain page number using the following pattern:

-   `![[myfile.pdf#page=12]]`
-   `![](myfile.pdf#page=12)`

### Samples

**Local PDF File**

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/pdf-local-file.png" width="70%"/>

**PDF File From a Link**

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/pdf-from-link.png" width="70%"/>

## 📕 iFrame Render Feature

You can turn on the `iFrame` option from settings to render `iframes` within the editor:

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/iframe-render.png" width="70%"/>

## 📕 New Settings Options

### Refresh Images After Changes

You can now turn on option to refresh images after each file update. It is especially useful for `excalidraw` drawings:

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/refresh-images-settings.png" width="80%"/>

### Turn On / Turn Off Image Rendering

You have an option now to toggle image rendering in your editor:

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/render-toggle-settings.png" width="80%"/>

You can do toggle rendering by a command from the pallette:

<img src="https://raw.githubusercontent.com/ozntel/oz-image-in-editor-obsidian/master/images/render-toggle-command.png" width="80%"/>

## 📕 Sample Image Render Views

### Markdown Format

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/Absolute_Path_View.png" width="70%"/>

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/Relative_Path_View.png" width="70%"/>

### Wikilinks format

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/Shortest_Path_Possible_View.png" width="70%"/>

<img src="https://github.com/ozntel/oz-image-in-editor-obsidian/raw/master/images/Wikilinks_2.png" width="70%"/>

## 📕 Contact

If you have any issue or you have any suggestion, please feel free to reach me out directly using contact page of my website [ozan.pl/contact/](https://www.ozan.pl/contact/) or directly to <me@ozan.pl>.

## Support

If you are enjoying the plugin then you can support my work and enthusiasm by buying me a coffee:

<a href='https://ko-fi.com/L3L356V6Q' target='_blank'>
    <img height='48' style='border:0px;height:48px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
