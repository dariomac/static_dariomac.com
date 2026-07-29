# Main files with context information

The rationale behind this project (its purpose and an explanation of its current status) is described in the file `data/me/finish-this-website.dmd`.

The explanation about how this static website generator works is described in the file `data/me/static-website-generator.dmd`.

# Internal Docs

There is a folder named `internal-docs` that contains more information about the project.

I'll list some particular files so can get a better idea of what is there.

- `internal-docs/builder.md` contains a detailed explanation of how the static website generator works.
- `internal-docs/layouts.md` contains information about the layouts used in the project.
- `internal-docs/dmd-templates` contains information about the dmd templates used in the project, one file per dmd template.
- `internal-docs/dmd-format.md` contains information about the dmd format, including the "Image Assets (WebP + Thumbnails)" section — read that before adding any image to a dmd file's `[content:md]` or `[related_images:json]`, since WebP files and gallery thumbnails are never generated automatically by the build and must be created and committed by hand.
- `internal-docs/notes-builder.md` contains an explanation of how `notes-builder.mjs` works.
