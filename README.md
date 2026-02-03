# DigitalOcean Spaces Sync Action

A GitHub Action to sync files and directories to DigitalOcean Spaces. Supports automatic versioning from package.json.

## Features

- Upload single files or entire directories
- Specify output directory on your Space
- Automatic versioning from package.json
- Custom CDN domain support
- Configurable file permissions (public/private)
- Progress logging for each file uploaded

## Usage

Create a workflow file in `.github/workflows/`:

```yml
name: Upload to DigitalOcean Spaces
on:
  push:
    branches:
      - main
jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ecssc/spaces-action@v1
        with:
          access_key: ${{ secrets.SPACES_ACCESS_KEY }}
          secret_key: ${{ secrets.SPACES_SECRET_KEY }}
          space_name: ${{ secrets.SPACE_NAME }}
          space_region: ${{ secrets.SPACE_REGION }}
          source: dist
```

## Inputs

| Input          | Description                                                                                          | Required | Default       |
| -------------- | ---------------------------------------------------------------------------------------------------- | -------- | ------------- |
| `access_key`   | DigitalOcean Spaces access key                                                                       | Yes      |               |
| `secret_key`   | DigitalOcean Spaces secret key                                                                       | Yes      |               |
| `space_name`   | Name of your DigitalOcean Space                                                                      | Yes      |               |
| `space_region` | Region of your DigitalOcean Space (e.g. `nyc3`, `fra1`)                                              | Yes      |               |
| `source`       | Path to the source file or directory to upload                                                       | Yes      |               |
| `out_dir`      | Output directory path within your Space                                                              | No       | `/`           |
| `versioning`   | Version subdirectory: `true` for package.json, path to package.json, or any string (e.g. commit SHA) | No       | `false`       |
| `cdn_domain`   | Custom CDN domain for output URL                                                                     | No       |               |
| `permission`   | ACL permission for uploaded files                                                                    | No       | `public-read` |

## Outputs

| Output       | Description               |
| ------------ | ------------------------- |
| `output_url` | URL of the uploaded files |

## Authentication

Generate access keys from your DigitalOcean [API settings](https://cloud.digitalocean.com/account/api/tokens). Store them as [repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

## Examples

### Upload a directory

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: nyc3
    source: dist
    out_dir: assets
```

### Upload a single file

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: nyc3
    source: build/bundle.js
```

### Versioning

When `versioning` is enabled, files are uploaded to a version-specific directory and also copied to `latest/`.

The `versioning` input accepts:

- `true` - use version from package.json in the repository root
- A path ending in `package.json` - use version from that file
- Any other string - use that value directly as the version

#### Using package.json version

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: fra1
    source: dist/bundle.min.js
    out_dir: js
    versioning: true
```

This creates:

- `js/v1.2.3/bundle.min.js`
- `js/latest/bundle.min.js`

To use a package.json in a different location:

```yml
versioning: packages/my-lib/package.json
```

#### Using commit SHA

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: fra1
    source: dist
    out_dir: builds
    versioning: ${{ github.sha }}
```

This creates:

- `builds/abc1234.../`
- `builds/latest/`

### Custom CDN domain

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: nyc3
    source: dist
    cdn_domain: cdn.example.com
```

The `output_url` will use your custom domain instead of the default DigitalOcean URL.

### Private files

```yml
- uses: ecssc/spaces-action@v1
  with:
    access_key: ${{ secrets.SPACES_ACCESS_KEY }}
    secret_key: ${{ secrets.SPACES_SECRET_KEY }}
    space_name: my-space
    space_region: nyc3
    source: dist
    permission: private
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Build for production
npm run build
```

## Releasing

Releases are managed through GitHub Releases. When a new release is published, the release workflow will automatically:

1. Build the action
2. Push the built `dist/` to the major version branch (e.g., `v1`)

Users should reference the major version: `ecssc/spaces-action@v1`

## Acknowledgements

Forked from [BetaHuhn/do-spaces-action](https://github.com/BetaHuhn/do-spaces-action).

## License

MIT
