# Ozan's Image in Editor Plugin

## Brief Explanation

Because I always prefer seeing the images directly under the link when I write my notes in Markdown, I developed a plugin for myself to view images directly under the Editor view. 

## Requirement & Samples

Users needs to use one of settings below to be able to view the images properly in the Editor view. It will ensure that plugin is able to generate the image source link correctly.

### 1 - First Option (Absolute Path)

#### Requirement

*New Link Format -> Absolute path in vault*

![Absolute Path Settings](images/Absolute_Path_Settings.png)

#### View

![Absolute Path View](images/Absolute_Path_View.png)

###  2 - Second Option (Relative Path)

#### Requirements

1 - *New Link Format -> Relative path to file*

![Relative Path Settings](images/Relative_Path_Settings.png)

2 - *the attachment folder needs to be selected under main vault directory as a separate folder:*

- My Vault
    - **Attachments**
        - Pasted Image 2.png
        - Pasted Image 3.png
    - School Notes
        - Lectures.md
    - Programming notes
        - React.md

![Relative Path Settings](images/Attachment_Folder_Set.png)

#### View

![Relative Path View](images/Relative_Path_View.png)

### 3- Third Option: 

#### Requirements

1 - *New Link Format -> Shortest Path Possible* 

![Shortest Path Settings](/images/Shortest_Path_Settings.png)

2 - *Default location for new attachments -> Vault Folder*

![Default Location Vault](/images/Default_Location_Vault.png)

#### View

![Shortest Path View](/images/Shortest_Path_Possible_View.png)

## Image View Size

Relative and Absolute Path will give you possibility to add "alt" text for the image. You can decide about the size of the image using following 
alt texts:

1. #small
2. #x-small
3. #xx-small

If you have any issue or you have any suggestion, please feel free to reach me out directly using <me@ozan.pl>

## Checklist

Plugin was tested on:

- [x] Windows
- [x] macOS
- [ ] Linux

## Planned Corrections

- [ ] For relative path (Option 2), users need to use a folder from the main project directory due to the fact that relative path part ('../../') is ignored at the moment. There is going to be a new update for viewing the 'relative path' from any source directory.
- [ ] For shortest path (Option 3), user needs to keep all images in the main vault directory at the moment. There is going to be a new update for checking the user settings for the custom path of attachment folder.