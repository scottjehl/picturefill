# grunt-gh-pages
**Publish to GitHub Pages with Grunt**

Use [Grunt](http://gruntjs.com/) to push to your `gh-pages` branch hosted on GitHub or any other branch anywhere else.

## Getting Started
This plugin requires Grunt `~0.4.1` and Git `>=1.7.6`.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [`gruntfile.js`](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-gh-pages --save-dev
```

Once the plugin has been installed, it may be enabled inside your `gruntfile.js` with this line:

```js
grunt.loadNpmTasks('grunt-gh-pages');
```

## The `gh-pages` task

### Overview
In your project's Gruntfile, add a section named `gh-pages` to the data object passed into `initConfig`.

```js
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'dist'
    },
    src: ['**']
  }
});
```

Running this task with `grunt gh-pages` will create a temporary clone of the current repository, create a `gh-pages` branch if one doesn't already exist, copy over all files from the `dist` directory that match patterns from the`src` configuration, commit all changes, and push to the `origin` remote.

If a `gh-pages` branch already exists, it will be updated with all commits from the remote before adding any commits from the provided `src` files.

**Note** that any files in the `gh-pages` branch that are *not* in the `src` files **will be removed**.  See the [`add` option](#optionsadd) if you don't want any of the existing files removed.

The `gh-pages` task is a multi-task, so different targets can be configured with different `src` files and `options`.  For example, to have the `gh-pages:gh-pages` target push to `gh-pages` and a second `gh-pages:foo` target push to a `bar` branch, the multi-task could be configured as follows:

```js
grunt.initConfig({
  'gh-pages': {
    options: {
      // Options for all targets go here.
    },
    'gh-pages': {
      options: {
        base: 'build'
      },
      // These files will get pushed to the `gh-pages` branch (the default).
      src: ['index.html']
    },
    'foo': {
      options: {
        base: 'bar-build',
        branch: 'bar'
      },
      // These files will get pushed to the `bar` branch.
      src: ['other.txt']
    }
  }
});
```


### Options

The default task options work for simple cases cases.  The options described below let you push to alternate branches, customize your commit messages, and more.

Options for all targets can be configured on the task level.  Individual tasks can also have their own options that override task level options.

All options can be overriden with command line flags.  The pattern to provide an option is like `--gh-pages-optname foo` where `optname` is the option name and `foo` is the option value.  For example, to supply the [`tag`](#optionstag) and [`message`](#optionsmessage), the task could be run as follows:

    grunt gh-pages --gh-pages-tag 'v1.2.3' --gh-pages-message 'Tagging v1.2.3'

#### <a id="optionsbase">options.base</a>
 * type: `string`
 * default: `process.cwd()`

The base directory for all source files (those listed in the `src` config property).  By default, source files are assumed to be relative to the current working directory, and they will be copied to the target with this relative path.  If your source files are all in a different directory (say, `build`), and you want them to be copied with a path relative to that directory, provide the directory path in the `base` option (e.g. `base: 'build'`).

Example use of the `base` option:

```js
/**
 * Given the following directory structure:
 *
 *   build/
 *     index.html
 *     js/
 *       site.js
 *
 * The task below will create a `gh-pages` branch that looks like this:
 *
 *   index.html
 *   js/
 *     site.js
 *
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build'
    },
    src: '**/*'
  }
});
```

#### <a id="optionsdotfiles">options.dotfiles</a>
 * type: `boolean`
 * default: `false`

Include dotfiles.  By default, files starting with `.` are ignored unless they are explicitly provided in the `src` array.  If you want to also include dotfiles that otherwise match your `src` patterns, set `dotfiles: true` in your options.

Example use of the `dotfiles` option:

```js
/**
 * The task below will push dotfiles (directories and files)
 * that otherwise match the `src` pattern.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'dist',
      dotfiles: true
    },
    src: '**/*'
  }
});
```

#### <a id="optionsadd">options.add</a>
 * type: `boolean`
 * default: `false`

Only add, and never remove existing files.  By default, existing files in the target branch are removed before adding the ones from your `src` config.  If you want the task to add new `src` files but leave existing ones untouched, set `add: true` in your target options.

Example use of the `add` option:

```js
/**
 * The task below will only add files to the `gh-pages` branch, never removing
 * any existing files (even if they don't exist in the `src` config).
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      add: true
    },
    src: '**/*'
  }
});
```

#### <a id="optionsrepo">options.repo</a>
 * type: `string`
 * default: url for the origin remote of the current dir (assumes a git repository)

By default, the `gh-pages` task assumes that the current working directory is a git repository, and that you want to push changes to the `origin` remote.  This is the most common case - your `gruntfile.js` builds static resources and the `gh-pages` task pushes them to a remote.

If instead your `gruntfile.js` is not in a git repository, or if you want to push to another repository, you can provide the repository URL in the `repo` option.

Example use of the `repo` option:

```js
/**
 * If the current directory is not a clone of the repository you want to work
 * with, set the URL for the repository in the `repo` option.  This task will
 * push all files in the `src` config to the `gh-pages` branch of the `repo`.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      repo: 'https://example.com/other/repo.git'
    },
    src: '**/*'
  }
});
```


#### <a id="optionsbranch">options.branch</a>
 * type: `string`
 * default: `'gh-pages'`

The name of the branch you'll be pushing to.  The default uses GitHub's `gh-pages` branch, but this same task can be used to push to any branch on any remote.

Example use of the `branch` option:

```js
/**
 * This task pushes to the `master` branch of the configured `repo`.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      branch: 'master',
      repo: 'https://example.com/other/repo.git'
    },
    src: '**/*'
  }
});
```


#### <a id="optionstag">options.tag</a>
 * type: `string`
 * default: `''`

Create a tag after committing changes on the target branch.  By default, no tag is created.  To create a tag, provide the tag name as the option value.

Example use of the `tag` option from the command line:

    grunt gh-pages --gh-pages-tag 'v3.2.1'


#### <a id="optionsmessage">options.message</a>
 * type: `string`
 * default: `'Updates'`

The commit message for all commits.

Example use of the `message` option:

```js
/**
 * This adds commits with a custom message.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      message: 'Auto-generated commit'
    },
    src: '**/*'
  }
});
```

Alternatively, this option can be set on the command line:

```shell
grunt gh-pages --gh-pages-message 'Making commits'
```


#### <a id="optionsuser">options.user</a>
 * type: `Object`
 * default: `null`

If you are running the `gh-pages` task in a repository without a `user.name` or `user.email` git config properties (or on a machine without these global config properties), you must provide user info before git allows you to commit.  The `options.user` object accepts `name` and `email` string values to identify the committer.

Example use of the `user` option:

```js
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      user: {
        name: 'Joe Code',
        email: 'coder@example.com'
      }
    },
    src: '**/*'
  }
});
```

#### <a id="optionsclone">options.clone</a>
 * type: `string`
 * default: `'.grunt/grunt-gh-pages/gh-pages/repo'`

Path to a directory where your repository will be cloned.  If this directory doesn't already exist, it will be created.  If it already exists, it is assumed to be a clone of your repository.  If you stick with the default value (recommended), you will likely want to add `.grunt` to your `.gitignore` file.

Example use of the `clone` option:

```js
/**
 * If you already have a temp directory, and want the repository cloned there,
 * use the `clone` option as below.  To avoid re-cloning every time the task is
 * run, this should be a directory that sticks around for a while.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      clone: 'path/to/tmp/dir'
    },
    src: '**/*'
  }
});
```


#### <a id="optionspush">options.push</a>
 * type: `boolean`
 * default: `true`

Push branch to remote.  To commit only (with no push) set to `false`.

Example use of the `push` option:

```js
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      push: false
    },
    src: '**/*'
  }
});
```

#### <a id="optionssilent">options.silent</a>
 * type: `boolean`
 * default: `false`

Suppress logging.  This option should be used if the repository URL or other information passed to git commands is sensitive and should not be logged.  With silent `true` log messages are suppressed and error messages are sanitized.

Example use of the `silent` option:

```js
/**
 * This configuration will suppress logging and sanitize error messages.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      repo: 'https://' + process.env.GH_TOKEN + '@github.com/user/private-repo.git',
      silent: true
    },
    src: '**/*'
  }
});
```


#### <a id="optionsgit">options.git</a>
 * type: `string`
 * default: `'git'`

Your `git` executable.

Example use of the `git` option:

```js
/**
 * If `git` is not on your path, provide the path as shown below.
 */
grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'build',
      git: '/path/to/git'
    },
    src: '**/*'
  }
});
```

## Dependencies

Note that this plugin requires Git 1.7.6 or higher (because it uses the `--exit-code` option for `git ls-remote`).  If you'd like to see this working with earlier versions of Git, please [open an issue](https://github.com/tschaub/grunt-gh-pages/issues).

[![Current Status](https://secure.travis-ci.org/tschaub/grunt-gh-pages.png?branch=master)](https://travis-ci.org/tschaub/grunt-gh-pages)
