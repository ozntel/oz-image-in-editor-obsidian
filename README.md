# Ozan's Image in Editor Plugin

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/ozntel/oz-image-in-editor-obsidian?style=for-the-badge)
![GitHub all releases](https://img.shields.io/github/downloads/ozntel/oz-image-in-editor-obsidian/total?style=for-the-badge)

**Note**: As of `Version 2.1.3`, support for legacy editor has been removed. If you still want to use this plugin with the legacy editor, please manually install `Version 2.1.2`, which is the latest version compatible with the Legacy editor.

**Important**: This plugin only supports `Source Mode` of the new editor starting from `Version 2.1.3`. If you use `Live Preview`, this plugin will automatically disable all widgets to avoid any duplicate image, pdf, excalidraw etc.

## 📕 Brief Explanation

-   Plugin helps you to view `images`, `iframes`, `PDF Files`, `excalidraw` drawings and `transclusions` directly under the Editor view without a necessity to switch to Preview mode.
-   The plugin allows you to see both your `local images` and `images from internet`.
-   Both `Markdown` and `Wikilinks` formats are supported as described below.
-   You can resize the view of images using `ALT-TEXT` options provided below to ensure that they don't take too much place in your screen as long as it is not needed.

## 📕 Formats Supported

```markdown
FORMAT: !(ALT_TEXT)[IMAGE_PATH_OR_NAME]
SAMPLE: ![#x-small](myimage.png)
```

```markdown
FORMAT: ![[IMAGE_PATH_OR_NAME|ALT_TEXT]]
SAMPLE: ![[myimage.png|#x-small]]
```

```markdown
FORMAT: ![[IMAGE_PATH_OR_NAME]]
SAMPLE: ![[myimage.png]]
```

**Scanned Image Formats** : `jpg`, `jpeg`, `png`, `gif`, `svg`, `bmp`

## 📕 Image View Size

Relative and Absolute Path will give you possibility to add `alt` text for the image. You can decide about the size of the image using alt texts like `#small`, `#x-small` and `#xx-small`:

```markdown
![[myImage.png|#xx-small]]
!(#x-small)[myImage.png]
```

#### New Sizing Feature:

You can now use the formats below to scale the images:

```markdown
Width x Height
![100x100](image.png)
```

```markdown
Only Width
![300](image.png)
```

### 📕 Invert Color Feature

Similar to `Minimal Theme`, you can add `#invert` within the `alt-text` to view the images in `invert color` mode:

```markdown
![[image.png|#invert]]
```

```markdown
![#invert](image.png)
```

## 📕 Transclusions Rendering

The plugin now renders the Transclusions within the Editor. You can use as `file` transclusion, `block id` and `header`:

```markdown
File Transclusion
![[myFile]]
```

```markdown
Block Transclusion
![[myFile#^316sd1]]
```

```markdown
Header Transclusion
![[myFile#Header2]]
```

To be able to use this functionality, you need to enable render in plugin settings.

## 📕 Wikilink to Markdown & Markdown to Wikilink

Plugin's link conversion functions are moved to [Obsidian Link Converter Plugin](https://github.com/ozntel/obsidian-link-converter) with many additional functionalities. You can download from Community Plugins.

## 📕 Excalidraw View

After a nice collaboration with Zsolt, you can now view `excalidraw` drawings within the Editor, as well. Reference: <a href="https://github.com/zsviczian/obsidian-excalidraw-plugin">Excalidraw Plugin</a>

Usage with `excalidraw` extension:

```markdown
![[drawing.excalidraw|ALT_TEXT]]
![[drawing|ALT-TEXT]]
```

```markdown
!(ALT_TEXT)[drawing.excalidraw]
!(ALT-TEXT)[drawing]
```

You can turn on/off rendering option for `Excalidraw` drawings.

## 📕 PDF Render Feature

You can turn on option for rendering the PDF files in the Editor mode.
You can view both from local files and from the internet.
You can also start viewing the `PDF` file from certain page number using the following pattern:

```markdown
![[myfile.pdf#page=12]]
![](myfile.pdf#page=12)
```

## 📕 iFrame Render Feature

You can turn on the `iFrame` option from settings to render `iframes` within the editor:

**Samples**:

```html
<iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/L9fJM2jCPlU"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
></iframe>
```

```html
<iframe width="550" height="315" src="https://ozan.pl" />
```

## 📕 Local Files

It is also possible to view supported files even if the files are not located within the Obsidian Vault. Let's say if you have a file located under your Downloads folder, you can use either `file:///` or `app://local/` prefixes to view the file in Editor:

```md
![[file:////Users/mycomputer/Downloads/Images/IMG_1122.jpg]]
```

## 📕 Toggle Render Options

You have an option to toggle render for images, pdf, iframes, transclusions and excalidraws in your plugin settings. You can also toggle render by using the commands available in the command pallette. Toggling `Render All` option will require you to reload the vault.

## 📕 Contact

If you have any issue or you have any suggestion, please feel free to reach me out directly using contact page of my website [ozan.pl/contact/](https://www.ozan.pl/contact/) or directly to <me@ozan.pl>.

## Support

If you are enjoying the plugin then you can support my work and enthusiasm by buying me a coffee:

<a href='https://ko-fi.com/L3L356V6Q' target='_blank'>
    <img height='48' style='border:0px;height:48px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
